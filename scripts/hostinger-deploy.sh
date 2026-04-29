#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-/opt/guandalini-blog}"
REPO_URL="${REPO_URL:-https://github.com/luizguandalini/Guandalini.git}"
TARGET_SHA="${TARGET_SHA:-main}"
APP_DOMAIN="${APP_DOMAIN:-luizguandalini.com.br}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-guandalini}"
TRAEFIK_NETWORK="${TRAEFIK_NETWORK:-}"
CANONICAL_CORS_ORIGIN="${CANONICAL_CORS_ORIGIN:-https://$APP_DOMAIN,https://www.$APP_DOMAIN}"
SYNCED_SOURCE="${SYNCED_SOURCE:-0}"
ENV_FILE="$APP_DIR/.env"
SECRETS_DIR="$APP_DIR/.deploy"
SECRETS_FILE="$SECRETS_DIR/initial-admin.txt"

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

random_hex() {
  bytes="$1"
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$bytes"
  else
    tr -dc 'a-f0-9' < /dev/urandom | head -c "$((bytes * 2))"
    echo
  fi
}

set_env_value() {
  key="$1"
  value="$2"
  file="$3"
  tmp_file="${file}.tmp"

  if [ -f "$file" ] && grep -q "^${key}=" "$file"; then
    awk -v key="$key" -v value="$value" '
      BEGIN { replaced = 0 }
      index($0, key "=") == 1 && replaced == 0 {
        print key "=" value
        replaced = 1
        next
      }
      { print }
      END {
        if (replaced == 0) {
          print key "=" value
        }
      }
    ' "$file" > "$tmp_file"
    mv "$tmp_file" "$file"
    return
  fi

  printf '%s=%s\n' "$key" "$value" >> "$file"
}

detect_traefik_network() {
  if [ -n "$TRAEFIK_NETWORK" ] && docker network inspect "$TRAEFIK_NETWORK" >/dev/null 2>&1; then
    echo "$TRAEFIK_NETWORK"
    return 0
  fi

  if docker network inspect traefik-proxy >/dev/null 2>&1; then
    echo "traefik-proxy"
    return 0
  fi

  for container_id in $(docker ps --format '{{.ID}}'); do
    container_meta="$(docker inspect -f '{{.Name}} {{.Config.Image}} {{index .Config.Labels "com.docker.compose.service"}} {{index .Config.Labels "com.docker.compose.project"}}' "$container_id" 2>/dev/null || true)"
    if printf '%s' "$container_meta" | tr '[:upper:]' '[:lower:]' | grep -q 'traefik'; then
      docker inspect -f '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' "$container_id" |
        grep -v -E '^(bridge|host|none)$' |
        head -n 1
      return 0
    fi
  done

  return 1
}

need docker

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "Docker Compose is not installed." >&2
  exit 1
fi

TRAEFIK_NETWORK="$(detect_traefik_network || true)"
if [ -z "$TRAEFIK_NETWORK" ]; then
  echo "Could not find a Docker network attached to Traefik." >&2
  echo "Deploy the Hostinger Docker and Traefik template before deploying this app." >&2
  echo "Existing Docker networks:" >&2
  docker network ls >&2 || true
  exit 1
fi
export TRAEFIK_NETWORK
echo "Using Traefik network: $TRAEFIK_NETWORK"

if [ "$SYNCED_SOURCE" = "1" ]; then
  cd "$APP_DIR"
else
  need git
  mkdir -p "$(dirname "$APP_DIR")"

  if [ ! -d "$APP_DIR/.git" ]; then
    git clone "$REPO_URL" "$APP_DIR"
  fi

  cd "$APP_DIR"
  git fetch --prune origin
  git checkout -B main "$TARGET_SHA"
  git reset --hard "$TARGET_SHA"
fi

if [ ! -f "$ENV_FILE" ]; then
  POSTGRES_PASSWORD="$(random_hex 32)"
  ADMIN_PASSWORD="$(random_hex 24)"
  JWT_SECRET="$(random_hex 48)"
  ADMIN_EMAIL="admin@$APP_DOMAIN"

  umask 077
  cat > "$ENV_FILE" <<EOF
COMPOSE_PROJECT_NAME=$COMPOSE_PROJECT_NAME

POSTGRES_USER=blog_user
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=blog

ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_NAME=Admin
ADMIN_ROLE=Editor-chefe

JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

API_PORT=3001
NODE_ENV=production
APP_DOMAIN=$APP_DOMAIN
CORS_ORIGIN=$CANONICAL_CORS_ORIGIN
WEB_PORT=80
EOF

  mkdir -p "$SECRETS_DIR"
  cat > "$SECRETS_FILE" <<EOF
App URL: https://$APP_DOMAIN
Admin email: $ADMIN_EMAIL
Admin password: $ADMIN_PASSWORD

Created automatically on first deploy. Keep this file private.
EOF
  chmod 600 "$ENV_FILE" "$SECRETS_FILE"
fi

set_env_value "COMPOSE_PROJECT_NAME" "$COMPOSE_PROJECT_NAME" "$ENV_FILE"
set_env_value "APP_DOMAIN" "$APP_DOMAIN" "$ENV_FILE"
set_env_value "CORS_ORIGIN" "$CANONICAL_CORS_ORIGIN" "$ENV_FILE"

if [ -f "$SECRETS_FILE" ]; then
  ADMIN_EMAIL_LINE="$(grep '^ADMIN_EMAIL=' "$ENV_FILE" | head -n 1 | cut -d '=' -f 2- || true)"
  ADMIN_PASSWORD_LINE="$(grep '^ADMIN_PASSWORD=' "$ENV_FILE" | head -n 1 | cut -d '=' -f 2- || true)"
  cat > "$SECRETS_FILE" <<EOF
App URL: https://$APP_DOMAIN
Admin email: ${ADMIN_EMAIL_LINE:-admin@$APP_DOMAIN}
Admin password: ${ADMIN_PASSWORD_LINE:-stored-in-.env}

Updated automatically during deploy. Keep this file private.
EOF
  chmod 600 "$SECRETS_FILE"
fi

$COMPOSE -f docker-compose.prod.yml up -d --build --remove-orphans
$COMPOSE -f docker-compose.prod.yml ps

docker image prune -f >/dev/null 2>&1 || true
