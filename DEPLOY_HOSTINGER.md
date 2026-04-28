# Deploy na Hostinger VPS com Docker and Traefik

Este projeto esta pronto para o template **Docker and Traefik** da Hostinger.

O stack de producao fica assim:

- `web`: Nginx servindo o build React e fazendo proxy interno de `/api` e `/uploads`
- `api`: Node/Express em modo production
- `db`: Postgres privado na rede Docker
- `traefik-proxy`: rede externa criada pelo projeto Traefik da Hostinger

Somente o Traefik publica `80`/`443` no host. Os containers `web`, `api` e `db` nao publicam portas diretamente.

## 1. Antes de subir o blog

No painel da Hostinger, escolha **Docker and Traefik** e deixe o projeto Traefik padrao ativo.

A Hostinger cria uma rede Docker externa chamada `traefik-proxy`. O `docker-compose.prod.yml` deste projeto entra nessa rede e usa labels para o Traefik descobrir o site.

## 2. DNS

Aponte o dominio ou subdominio para o IP da VPS.

Exemplo:

```txt
blog.seudominio.com -> IP_DA_VPS
```

## 3. Variaveis de ambiente

Na VPS, clone o repositorio e crie o `.env` real:

```sh
cp .env.production.example .env
```

Edite os valores:

```sh
COMPOSE_PROJECT_NAME=guandalini
APP_DOMAIN=blog.seudominio.com
CORS_ORIGIN=https://blog.seudominio.com
POSTGRES_PASSWORD=uma-senha-longa-e-randomica
ADMIN_EMAIL=seu-email
ADMIN_PASSWORD=uma-senha-admin-forte
JWT_SECRET=um-segredo-com-mais-de-32-caracteres
```

## 4. Subir com Traefik

```sh
docker compose -f docker-compose.prod.yml up -d --build
```

Verifique:

```sh
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f web api
```

Depois acesse:

```txt
https://blog.seudominio.com
```

O certificado SSL deve ser emitido e renovado pelo Traefik/Let's Encrypt.

## 5. Modo sem Traefik

Use somente se escolher o template Docker simples, sem Traefik:

```sh
docker compose -f docker-compose.standalone.yml up -d --build
```

Nesse modo, o container `web` publica `${WEB_PORT:-80}:80` direto no host e voce precisa resolver HTTPS por fora.
