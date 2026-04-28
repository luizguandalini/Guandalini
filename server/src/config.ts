import 'dotenv/config'

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

function optionalList(name: string): string[] {
  return (process.env[name] ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function assertSecret(name: string, value: string, minLength = 32): string {
  if ((process.env.NODE_ENV ?? 'development') === 'production' && value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters in production`)
  }
  return value
}

export const config = {
  port: Number(process.env.API_PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigins: optionalList('CORS_ORIGIN'),

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
    secret:    assertSecret('JWT_SECRET', required('JWT_SECRET')),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },

  uploadsDir: 'uploads',
}
