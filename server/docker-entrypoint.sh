#!/bin/sh
# Auto-install deps when the bind-mounted source is missing node_modules
# (fresh clone) or when package.json is newer than node_modules (deps changed).

set -e

need_install=0

if [ ! -d node_modules ] || [ ! -f node_modules/.install-marker ]; then
  need_install=1
elif [ package.json -nt node_modules/.install-marker ]; then
  need_install=1
fi

if [ "$need_install" = "1" ]; then
  echo "[entrypoint] installing dependencies…"
  npm install
  touch node_modules/.install-marker
else
  echo "[entrypoint] dependencies ok — skipping install"
fi

exec "$@"
