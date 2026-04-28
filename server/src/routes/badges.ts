import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { LIMITS, httpError, isHttpError, requireString, requireUuid } from '../middleware/validate.js'

export const badgesRouter = Router()

badgesRouter.use(requireAuth)

interface BadgeRow { id: string; name: string; created_at: Date }

const toDto = (r: BadgeRow) => ({ id: r.id, name: r.name, createdAt: r.created_at })

badgesRouter.get('/', async (_req, res) => {
  try {
    const { rows } = await query<BadgeRow>(
      'SELECT id, name, created_at FROM badges ORDER BY name ASC',
    )
    res.json({ items: rows.map(toDto) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro interno' })
  }
})

badgesRouter.post('/', async (req, res) => {
  try {
    const name = requireString(req.body?.name, 'name', LIMITS.badgeName)
    const { rows } = await query<BadgeRow>(
      `INSERT INTO badges (name) VALUES ($1)
       RETURNING id, name, created_at`,
      [name],
    )
    res.status(201).json(toDto(rows[0]))
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.statusCode).json({ error: err.message })
    } else if (err instanceof Error && err.message.includes('unique')) {
      res.status(409).json({ error: 'Já existe uma badge com esse nome' })
    } else {
      console.error(err)
      res.status(500).json({ error: 'Erro interno' })
    }
  }
})

badgesRouter.patch('/:id', async (req, res) => {
  try {
    const id = requireUuid(req.params.id, 'id')
    const name = requireString(req.body?.name, 'name', LIMITS.badgeName)
    const { rows } = await query<BadgeRow>(
      `UPDATE badges SET name = $1 WHERE id = $2
       RETURNING id, name, created_at`,
      [name, id],
    )
    if (!rows[0]) throw httpError(404, 'Badge não encontrada')
    res.json(toDto(rows[0]))
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.statusCode).json({ error: err.message })
    } else if (err instanceof Error && err.message.includes('unique')) {
      res.status(409).json({ error: 'Já existe uma badge com esse nome' })
    } else {
      console.error(err)
      res.status(500).json({ error: 'Erro interno' })
    }
  }
})

badgesRouter.delete('/:id', async (req, res) => {
  try {
    const id = requireUuid(req.params.id, 'id')
    const { rowCount } = await query('DELETE FROM badges WHERE id = $1', [id])
    if (!rowCount) throw httpError(404, 'Badge não encontrada')
    res.json({ ok: true })
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.statusCode).json({ error: err.message })
    } else {
      console.error(err)
      res.status(500).json({ error: 'Erro interno' })
    }
  }
})
