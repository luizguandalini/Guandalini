# ──────────────────────────────────────────────
# Dev image — the source is bind-mounted and the
# entrypoint re-installs deps automatically if
# node_modules is missing or package.json changed.
# ──────────────────────────────────────────────
FROM node:22-alpine AS dev

WORKDIR /app

# Pre-install once so first `docker compose up` is fast.
# (If the user mounts a fresh `./server` over it, the entrypoint
# will detect the missing node_modules and re-install.)
COPY package.json package-lock.json* ./
RUN npm install && touch node_modules/.install-marker

COPY . .

RUN mkdir -p uploads

ENV NODE_ENV=development
EXPOSE 3001

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# Strip any Windows CRLF that may have snuck in via the COPY on Windows hosts
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
 && chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["sh", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]

# ──────────────────────────────────────────────
# Prod image (for later `docker build --target prod`)
# ──────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build \
 && cp -R src/migrations dist/migrations

FROM node:22-alpine AS prod

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/index.js"]
