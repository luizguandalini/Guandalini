import 'dotenv/config'

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export const config = {
  port: Number(process.env.API_PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  db: {
    host:     process.env.POSTGRES_HOST     ?? 'localhost',
    port:     Number(process.env.POSTGRES_PORT ?? 5432),
    user:     required('POSTGRES_USER'),
    password: required('POSTGRES_PASSWORD'),
    database: required('POSTGRES_DB'),
  },

  admin: {
    email:    required('ADMIN_EMAIL'),
    password: required('ADMIN_PASSWORD'),
    name:     process.env.ADMIN_NAME ?? 'Admin',
    role:     process.env.ADMIN_ROLE ?? 'Editor-chefe',
  },

  jwt: {
    secret:    required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },

  uploadsDir: 'uploads',
}
