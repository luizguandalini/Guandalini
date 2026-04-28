import express from 'express'
import cors, { type CorsOptions } from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { config } from './config.js'
import { waitForDb } from './db.js'
import { runMigrations } from './migrate.js'
import { seedAdmin } from './seed.js'
import { isHttpError } from './middleware/validate.js'

import { authRouter } from './routes/auth.js'
import { authorsRouter } from './routes/authors.js'
import { categoriesRouter } from './routes/categories.js'
import { badgesRouter } from './routes/badges.js'
import { articlesRouter } from './routes/articles.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  await waitForDb()
  await runMigrations()
  await seedAdmin()

  const app = express()
  if (config.nodeEnv === 'production') {
    app.set('trust proxy', 1)
  }

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }))

  const corsOptions: CorsOptions = config.nodeEnv === 'production'
    ? { origin: config.corsOrigins.length > 0 ? config.corsOrigins : false }
    : { origin: true }

  app.use(cors(corsOptions))
  app.use(express.json({ limit: '2mb' }))
  app.use('/api', rateLimit({
    windowMs: 60 * 1000,
    max: config.nodeEnv === 'production' ? 120 : 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisicoes. Tente novamente em instantes.' },
  }))

  app.use('/uploads', express.static(join(__dirname, '..', config.uploadsDir), {
    immutable: true,
    maxAge: '7d',
  }))

  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  app.use('/api/auth',       authRouter)
  app.use('/api/authors',    authorsRouter)
  app.use('/api/categories', categoriesRouter)
  app.use('/api/badges',     badgesRouter)
  app.use('/api/articles',   articlesRouter)

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    void _next
    console.error('[error]', err)
    const status = isHttpError(err) ? err.statusCode : 500
    const fallback = status >= 500 && config.nodeEnv === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Internal server error'
    res.status(status).json({ error: fallback })
  })

  app.listen(config.port, () => {
    console.log(`[api] listening on http://localhost:${config.port}`)
  })
}

main().catch((err) => {
  console.error('[fatal]', err)
  process.exit(1)
})
