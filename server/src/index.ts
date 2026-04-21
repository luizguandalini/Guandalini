import express from 'express'
import cors from 'cors'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { config } from './config.js'
import { waitForDb } from './db.js'
import { runMigrations } from './migrate.js'
import { seedAdmin } from './seed.js'

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
  app.use(cors())
  app.use(express.json({ limit: '2mb' }))

  app.use('/uploads', express.static(join(__dirname, '..', config.uploadsDir)))

  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  app.use('/api/auth',       authRouter)
  app.use('/api/authors',    authorsRouter)
  app.use('/api/categories', categoriesRouter)
  app.use('/api/badges',     badgesRouter)
  app.use('/api/articles',   articlesRouter)

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[error]', err)
    res.status(500).json({ error: err.message ?? 'Internal server error' })
  })

  app.listen(config.port, () => {
    console.log(`[api] listening on http://localhost:${config.port}`)
  })
}

main().catch((err) => {
  console.error('[fatal]', err)
  process.exit(1)
})
