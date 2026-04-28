#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-/opt/guandalini-blog}"
REPO_URL="${REPO_URL:-https://github.com/luizguandalini/Guandalini.git}"
TARGET_SHA="${TARGET_SHA:-main}"
APP_DOMAIN="${APP_DOMAIN:-guandalini.177.7.40.187.sslip.io}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-guandalini}"
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

need docker

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "Docker Compose is not installed." >&2
  exit 1
fi

if ! docker network inspect traefik-proxy >/dev/null 2>&1; then
  echo "Docker network 'traefik-proxy' was not found." >&2
  echo "Deploy the Hostinger Docker and Traefik template before deploying this app." >&2
  exit 1
fi

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
CORS_ORIGIN=https://$APP_DOMAIN
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

$COMPOSE -f docker-compose.prod.yml up -d --build --remove-orphans
$COMPOSE -f docker-compose.prod.yml ps

docker image prune -f >/dev/null 2>&1 || true
