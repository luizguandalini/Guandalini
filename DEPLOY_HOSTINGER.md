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

A Hostinger costuma criar uma rede Docker externa para o Traefik. O script de deploy tenta detectar essa rede automaticamente; se voce quiser forcar um nome especifico, defina a variavel de repositorio `TRAEFIK_NETWORK` no GitHub.

## 2. DNS

Voce pode usar um dominio seu ou o dominio automatico `sslip.io`.

Padrao ja configurado:

```txt
guandalini.177.7.40.187.sslip.io -> 177.7.40.187
```

Se quiser usar dominio proprio, aponte o dominio/subdominio para o IP da VPS.

Exemplo:

```txt
blog.seudominio.com -> IP_DA_VPS
```

## 3. Variaveis de ambiente

No deploy automatico, o script `scripts/hostinger-deploy.sh` cria o `.env` real na VPS se ele ainda nao existir.

Para deploy manual, crie o `.env` assim:

```sh
cp .env.production.example .env
```

Edite os valores:

```sh
COMPOSE_PROJECT_NAME=guandalini
APP_DOMAIN=luizguandalini.com.br
CORS_ORIGIN=https://luizguandalini.com.br,https://www.luizguandalini.com.br
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
https://luizguandalini.com.br
```

O certificado SSL deve ser emitido e renovado pelo Traefik/Let's Encrypt.

Com a configuracao atual do `docker-compose.prod.yml`, o Traefik tambem aceita:

```txt
https://www.luizguandalini.com.br
```

## 5. Deploy automatico pelo GitHub Actions

O workflow `.github/workflows/deploy.yml` roda em todo push na branch `main`.

Ele faz SSH na VPS, envia o checkout atual do GitHub para `/opt/guandalini-blog`, cria o `.env` de producao automaticamente na primeira execucao e sobe:

```sh
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
```

O `.env` criado na VPS usa senhas fortes aleatorias para:

- `POSTGRES_PASSWORD`
- `ADMIN_PASSWORD`
- `JWT_SECRET`

A credencial inicial do admin fica salva apenas na VPS:

```txt
/opt/guandalini-blog/.deploy/initial-admin.txt
```

Permissao esperada: `600`.

### Segredo necessario no GitHub

Para o GitHub conseguir entrar na VPS, o repositorio precisa ter este secret:

```txt
HOSTINGER_SSH_PRIVATE_KEY
```

Opcional:

```txt
HOSTINGER_SSH_PORT
```

Se voce definir uma variavel de repositorio chamada `APP_DOMAIN`, ela substitui o dominio padrao `guandalini.177.7.40.187.sslip.io`.

Se a rede do Traefik tiver um nome especifico na VPS, defina tambem a variavel de repositorio:

```txt
TRAEFIK_NETWORK
```

## 6. Modo sem Traefik

Use somente se escolher o template Docker simples, sem Traefik:

```sh
docker compose -f docker-compose.standalone.yml up -d --build
```

Nesse modo, o container `web` publica `${WEB_PORT:-80}:80` direto no host e voce precisa resolver HTTPS por fora.
