import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { LIMITS, httpError, isHttpError, requireString } from '../middleware/validate.js'

export const categoriesRouter = Router()

categoriesRouter.use(requireAuth)

interface CategoryRow { id: string; name: string; created_at: Date }

const toDto = (r: CategoryRow) => ({ id: r.id, name: r.name, createdAt: r.created_at })

categoriesRouter.get('/', async (_req, res) => {
  try {
    const { rows } = await query<CategoryRow>(
      'SELECT id, name, created_at FROM categories ORDER BY name ASC',
    )
    res.json({ items: rows.map(toDto) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro interno' })
  }
})

categoriesRouter.post('/', async (req, res) => {
  try {
    const name = requireString(req.body?.name, 'name', LIMITS.categoryName)

    const { rows } = await query<CategoryRow>(
      `INSERT INTO categories (name) VALUES ($1)
       RETURNING id, name, created_at`,
      [name],
    )
    res.status(201).json(toDto(rows[0]))
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.statusCode).json({ error: err.message })
    } else if (err instanceof Error && err.message.includes('unique')) {
      res.status(409).json({ error: 'Já existe uma categoria com esse nome' })
    } else {
      console.error(err)
      res.status(500).json({ error: 'Erro interno' })
    }
  }
})

categoriesRouter.patch('/:id', async (req, res) => {
  try {
    const id = req.params.id
    const name = requireString(req.body?.name, 'name', LIMITS.categoryName)

    const { rows } = await query<CategoryRow>(
      `UPDATE categories SET name = $1 WHERE id = $2
       RETURNING id, name, created_at`,
      [name, id],
    )
    if (!rows[0]) throw httpError(404, 'Categoria não encontrada')
    res.json(toDto(rows[0]))
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.statusCode).json({ error: err.message })
    } else if (err instanceof Error && err.message.includes('unique')) {
      res.status(409).json({ error: 'Já existe uma categoria com esse nome' })
    } else {
      console.error(err)
      res.status(500).json({ error: 'Erro interno' })
    }
  }
})

categoriesRouter.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM categories WHERE id = $1', [req.params.id])
    if (!rowCount) throw httpError(404, 'Categoria não encontrada')
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
