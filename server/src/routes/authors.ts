import { Router } from 'express'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { uploadAvatar } from '../middleware/upload.js'
import {
  LIMITS,
  httpError,
  isHttpError,
  requireString,
  sanitizeText,
} from '../middleware/validate.js'
import { config } from '../config.js'

export const authorsRouter = Router()

authorsRouter.use(requireAuth)

interface AuthorRow {
  id:          string
  name:        string
  role:        string
  avatar_url:  string
  avatar_type: string
  avatar_crop: unknown
  created_at:  Date
}

function toDto(r: AuthorRow) {
  return {
    id:         r.id,
    name:       r.name,
    role:       r.role,
    avatarUrl:  r.avatar_url,
    avatarType: r.avatar_type,
    avatarCrop: r.avatar_crop ?? null,
    createdAt:  r.created_at,
  }
}

// ── List with pagination ──────────────────────────────
authorsRouter.get('/', async (req, res) => {
  try {
    const page  = Math.max(1, Number(req.query.page  ?? 1))
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 10)))
    const offset = (page - 1) * limit

    const { rows: items } = await query<AuthorRow>(
      `SELECT id, name, role, avatar_url, avatar_type, avatar_crop, created_at
         FROM authors
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2`,
      [limit, offset],
    )

    const { rows: countRows } = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM authors')
    const total = Number(countRows[0]?.count ?? 0)

    res.json({
      items: items.map(toDto),
      page,
      limit,
      total,
      hasMore: offset + items.length < total,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro interno' })
  }
})

// ── Create (multipart with optional avatar upload) ────
authorsRouter.post('/', uploadAvatar.single('avatar'), async (req, res) => {
  try {
    const name = requireString(req.body?.name, 'name', LIMITS.name)
    const role = requireString(req.body?.role, 'role', LIMITS.role)

    let avatarUrl: string
    let avatarType: 'upload' | 'dicebear'
    let avatarCrop: unknown = null

    if (req.file) {
      avatarUrl  = `/uploads/${req.file.filename}`
      avatarType = 'upload'

      if (typeof req.body?.avatarCrop === 'string' && req.body.avatarCrop) {
        try {
          const parsed = JSON.parse(req.body.avatarCrop)
          if (parsed && typeof parsed === 'object') avatarCrop = parsed
        } catch { /* ignore malformed crop */ }
      }
    } else {
      const dicebearSeed = sanitizeText(req.body?.dicebearSeed ?? name, LIMITS.name)
      avatarUrl  = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(dicebearSeed)}&backgroundColor=b8c9c0`
      avatarType = 'dicebear'
    }

    const { rows } = await query<AuthorRow>(
      `INSERT INTO authors (name, role, avatar_url, avatar_type, avatar_crop)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, role, avatar_url, avatar_type, avatar_crop, created_at`,
      [name, role, avatarUrl, avatarType, avatarCrop],
    )

    res.status(201).json(toDto(rows[0]))
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.statusCode).json({ error: err.message })
    } else {
      console.error(err)
      res.status(500).json({ error: err instanceof Error ? err.message : 'Erro interno' })
    }
  }
})

// ── Update ────────────────────────────────────────────
authorsRouter.patch('/:id', uploadAvatar.single('avatar'), async (req, res) => {
  try {
    const id = req.params.id

    const { rows: existing } = await query<AuthorRow>(
      'SELECT id, name, role, avatar_url, avatar_type, avatar_crop, created_at FROM authors WHERE id = $1',
      [id],
    )
    const current = existing[0]
    if (!current) {
      throw httpError(404, 'Autor não encontrado')
    }

    const name = req.body?.name !== undefined ? requireString(req.body.name, 'name', LIMITS.name) : current.name
    const role = req.body?.role !== undefined ? requireString(req.body.role, 'role', LIMITS.role) : current.role

    let avatarUrl  = current.avatar_url
    let avatarType = current.avatar_type
    let avatarCrop = current.avatar_crop
    let oldFileToDelete: string | null = null

    if (req.file) {
      if (current.avatar_type === 'upload' && current.avatar_url.startsWith('/uploads/')) {
        oldFileToDelete = current.avatar_url
      }
      avatarUrl  = `/uploads/${req.file.filename}`
      avatarType = 'upload'
      if (typeof req.body?.avatarCrop === 'string' && req.body.avatarCrop) {
        try {
          const parsed = JSON.parse(req.body.avatarCrop)
          if (parsed && typeof parsed === 'object') avatarCrop = parsed
        } catch { /* ignore */ }
      }
    } else if (req.body?.dicebearSeed) {
      if (current.avatar_type === 'upload' && current.avatar_url.startsWith('/uploads/')) {
        oldFileToDelete = current.avatar_url
      }
      const seed = sanitizeText(req.body.dicebearSeed, LIMITS.name)
      avatarUrl  = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b8c9c0`
      avatarType = 'dicebear'
      avatarCrop = null
    } else if (req.body?.avatarCrop !== undefined) {
      try {
        const parsed = typeof req.body.avatarCrop === 'string'
          ? JSON.parse(req.body.avatarCrop)
          : req.body.avatarCrop
        if (parsed && typeof parsed === 'object') avatarCrop = parsed
      } catch { /* ignore */ }
    }

    const { rows } = await query<AuthorRow>(
      `UPDATE authors
          SET name = $1, role = $2, avatar_url = $3, avatar_type = $4, avatar_crop = $5
        WHERE id = $6
        RETURNING id, name, role, avatar_url, avatar_type, avatar_crop, created_at`,
      [name, role, avatarUrl, avatarType, avatarCrop, id],
    )

    if (oldFileToDelete) {
      const fileName = oldFileToDelete.replace(/^\/uploads\//, '')
      unlink(join(config.uploadsDir, fileName)).catch(() => {/* ignore */})
    }

    res.json(toDto(rows[0]))
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.statusCode).json({ error: err.message })
    } else {
      console.error(err)
      res.status(500).json({ error: err instanceof Error ? err.message : 'Erro interno' })
    }
  }
})

// ── Delete ────────────────────────────────────────────
authorsRouter.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id
    const { rows } = await query<{ avatar_url: string; avatar_type: string }>(
      'DELETE FROM authors WHERE id = $1 RETURNING avatar_url, avatar_type',
      [id],
    )
    const removed = rows[0]
    if (!removed) {
      throw httpError(404, 'Autor não encontrado')
    }
    if (removed.avatar_type === 'upload' && removed.avatar_url.startsWith('/uploads/')) {
      const fileName = removed.avatar_url.replace(/^\/uploads\//, '')
      unlink(join(config.uploadsDir, fileName)).catch(() => {/* ignore */})
    }
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
