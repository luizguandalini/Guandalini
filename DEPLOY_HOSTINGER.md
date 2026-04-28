# Deploy na Hostinger VPS com Docker

Este projeto sobe completo via Docker Compose:

- `web`: Nginx servindo o build React e fazendo proxy de `/api` e `/uploads`
- `api`: Node/Express em modo production
- `db`: Postgres privado na rede Docker

Somente o serviço `web` publica porta no host. API e banco não ficam expostos publicamente.

## Passos

1. Escolha o template **Docker** na VPS da Hostinger.
2. Acesse a VPS por SSH.
3. Clone o repositório.
4. Crie o `.env` de produção:

```sh
cp .env.production.example .env
```

5. Edite o `.env` com valores reais e fortes:

```sh
POSTGRES_PASSWORD=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
JWT_SECRET=...
CORS_ORIGIN=https://seudominio.com
WEB_PORT=80
API_PORT=3001
```

6. Suba o stack:

```sh
docker compose -f docker-compose.prod.yml up -d --build
```

7. Verifique:

```sh
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f web api
```

## Domínio e HTTPS

Aponte o domínio para o IP da VPS. Para HTTPS, use o recurso de SSL/proxy da Hostinger, Cloudflare com proxy ativo, ou coloque um proxy TLS na VPS na frente deste Compose.

O container `web` fala HTTP na porta `80`; TLS deve terminar no proxy/serviço de borda.
