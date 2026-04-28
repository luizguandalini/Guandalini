import { Router } from 'express'
import { query } from '../db.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import {
  LIMITS,
  httpError,
  isHttpError,
  optionalString,
  optionalUrl,
  optionalUuid,
  requireInt,
  requireString,
  requireUuid,
  sanitizeBody,
} from '../middleware/validate.js'

export const articlesRouter = Router()

const PIN_POSITIONS = ['left', 'right_top', 'right_bottom'] as const
type PinPosition = typeof PIN_POSITIONS[number]

// ── Full joined row ──────────────────────────────────

const JOIN_SELECT = `
  a.id, a.title, a.subtitle, a.reading_time_min,
  a.hero_image, a.hero_caption, a.body, a.status, a.pin_position,
  a.published_at, a.created_at, a.updated_at,
  c.id   AS category_id,   c.name AS category_name,
  b.id   AS badge_id,      b.name AS badge_name,
  au.id  AS author_id,     au.name AS author_name, au.role AS author_role,
  au.avatar_url AS author_avatar_url, au.avatar_type AS author_avatar_type,
  au.avatar_crop AS author_avatar_crop
`

const JOIN_FROM = `
  FROM articles a
  LEFT JOIN categories c ON c.id = a.category_id
  LEFT JOIN badges     b ON b.id = a.badge_id
  LEFT JOIN authors    au ON au.id = a.author_id
`

interface JoinedRow {
  id: string
  title: string
  subtitle: string | null
  reading_time_min: number
  hero_image: string | null
  hero_caption: string | null
  body: unknown
  status: string
  pin_position: string | null
  published_at: Date | null
  created_at: Date
  updated_at: Date
  category_id:   string | null
  category_name: string | null
  badge_id:      string | null
  badge_name:    string | null
  author_id:           string | null
  author_name:         string | null
  author_role:         string | null
  author_avatar_url:   string | null
  author_avatar_type:  string | null
  author_avatar_crop:  unknown
}

function toDto(r: JoinedRow) {
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    readingTimeMin: r.reading_time_min,
    heroImage: r.hero_image,
    heroCaption: r.hero_caption,
    body: r.body ?? [],
    status: r.status,
    pinPosition: r.pin_position as PinPosition | null,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    category: r.category_id ? { id: r.category_id, name: r.category_name } : null,
    badge:    r.badge_id    ? { id: r.badge_id,    name: r.badge_name }    : null,
    author:   r.author_id   ? {
      id:        r.author_id,
      name:      r.author_name,
      role:      r.author_role,
      avatarUrl: r.author_avatar_url,
      avatarType: r.author_avatar_type,
      avatarCrop: r.author_avatar_crop ?? null,
    } : null,
  }
}

// ── List: pinned (separately) + recent (paginated) ──
articlesRouter.get('/', async (req, res) => {
  try {
    const rawPage  = Number(req.query.page ?? 1)
    const rawLimit = Number(req.query.limit ?? 9)
    const page     = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1
    const limit    = Number.isInteger(rawLimit) ? Math.min(30, Math.max(1, rawLimit)) : 9
    const offset = (page - 1) * limit

    const { rows: pinned } = await query<JoinedRow>(
      `SELECT ${JOIN_SELECT}
       ${JOIN_FROM}
       WHERE a.status = 'published' AND a.pin_position IS NOT NULL
       ORDER BY
         CASE a.pin_position
           WHEN 'left'         THEN 1
           WHEN 'right_top'    THEN 2
           WHEN 'right_bottom' THEN 3
           ELSE 4
         END`,
    )

    const { rows: recent } = await query<JoinedRow>(
      `SELECT ${JOIN_SELECT}
       ${JOIN_FROM}
       WHERE a.status = 'published'
       ORDER BY COALESCE(a.published_at, a.created_at) DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    )

    const { rows: countRows } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM articles WHERE status = 'published'`,
    )
    const total = Number(countRows[0]?.count ?? 0)

    res.json({
      pinned: pinned.map(toDto),
      recent: recent.map(toDto),
      page,
      limit,
      total,
      hasMore: offset + recent.length < total,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro interno' })
  }
})

// ── Get one by id ────────────────────────────────────
articlesRouter.get('/:id', optionalAuth, async (req, res) => {
  try {
    const id = requireUuid(req.params.id, 'id')
    const { rows } = await query<JoinedRow>(
      `SELECT ${JOIN_SELECT} ${JOIN_FROM}
       WHERE a.id = $1 AND (a.status = 'published' OR $2::boolean)`,
      [id, Boolean(req.user)],
    )
    if (!rows[0]) throw httpError(404, 'Artigo não encontrado')
    res.json(toDto(rows[0]))
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.statusCode).json({ error: err.message })
    } else {
      console.error(err)
      res.status(500).json({ error: 'Erro interno' })
    }
  }
})

// ── Create ───────────────────────────────────────────
articlesRouter.post('/', requireAuth, async (req, res) => {
  try {
    const title       = requireString(req.body?.title,    'title',    LIMITS.title)
    const subtitle    = optionalString(req.body?.subtitle,            LIMITS.subtitle)
    const heroImage   = optionalUrl(req.body?.heroImage,              LIMITS.heroImage)
    const heroCaption = optionalString(req.body?.heroCaption,         LIMITS.heroCaption)
    const categoryId  = optionalUuid(req.body?.categoryId, 'categoryId')
    const authorId    = optionalUuid(req.body?.authorId,   'authorId')
    const badgeId     = optionalUuid(req.body?.badgeId,    'badgeId')
    const readingTimeMin = requireInt(req.body?.readingTimeMin ?? 5, 'readingTimeMin', 1, 180)
    const body = sanitizeBody(req.body?.body)

    const status = req.body?.status === 'draft' ? 'draft' : 'published'
    const publishedAt = status === 'published' ? new Date() : null

    const { rows } = await query<{ id: string }>(
      `INSERT INTO articles
         (title, subtitle, category_id, author_id, badge_id,
          reading_time_min, hero_image, hero_caption, body, status, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)
       RETURNING id`,
      [
        title, subtitle, categoryId, authorId, badgeId,
        readingTimeMin, heroImage, heroCaption,
        JSON.stringify(body),
        status, publishedAt,
      ],
    )

    const { rows: full } = await query<JoinedRow>(
      `SELECT ${JOIN_SELECT} ${JOIN_FROM} WHERE a.id = $1`,
      [rows[0].id],
    )
    res.status(201).json(toDto(full[0]))
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.statusCode).json({ error: err.message })
    } else {
      console.error(err)
      res.status(500).json({ error: err instanceof Error ? err.message : 'Erro interno' })
    }
  }
})

// ── Update ───────────────────────────────────────────
articlesRouter.patch('/:id', requireAuth, async (req, res) => {
  try {
    const id = requireUuid(req.params.id, 'id')
    const { rows: existing } = await query<JoinedRow>(
      `SELECT ${JOIN_SELECT} ${JOIN_FROM} WHERE a.id = $1`,
      [id],
    )
    const current = existing[0]
    if (!current) throw httpError(404, 'Artigo não encontrado')

    const title     = req.body?.title     !== undefined ? requireString(req.body.title,  'title', LIMITS.title)  : current.title
    const subtitle  = req.body?.subtitle  !== undefined ? optionalString(req.body.subtitle, LIMITS.subtitle)     : current.subtitle
    const heroImage = req.body?.heroImage !== undefined ? optionalUrl(req.body.heroImage, LIMITS.heroImage)       : current.hero_image
    const heroCaption = req.body?.heroCaption !== undefined ? optionalString(req.body.heroCaption, LIMITS.heroCaption) : current.hero_caption
    const categoryId = req.body?.categoryId !== undefined ? optionalUuid(req.body.categoryId, 'categoryId') : current.category_id
    const authorId   = req.body?.authorId   !== undefined ? optionalUuid(req.body.authorId,   'authorId')   : current.author_id
    const badgeId    = req.body?.badgeId    !== undefined ? optionalUuid(req.body.badgeId,    'badgeId')    : current.badge_id
    const readingTimeMin = req.body?.readingTimeMin !== undefined
      ? requireInt(req.body.readingTimeMin, 'readingTimeMin', 1, 180)
      : current.reading_time_min
    const body = req.body?.body !== undefined ? sanitizeBody(req.body.body) : current.body

    const status = req.body?.status === 'draft'     ? 'draft'
                 : req.body?.status === 'published' ? 'published'
                 : current.status
    const publishedAt = (status === 'published' && !current.published_at) ? new Date() : current.published_at

    await query(
      `UPDATE articles SET
         title = $1, subtitle = $2, category_id = $3, author_id = $4, badge_id = $5,
         reading_time_min = $6, hero_image = $7, hero_caption = $8,
         body = $9::jsonb, status = $10, published_at = $11
       WHERE id = $12`,
      [
        title, subtitle, categoryId, authorId, badgeId,
        readingTimeMin, heroImage, heroCaption,
        JSON.stringify(body),
        status, publishedAt, id,
      ],
    )

    const { rows: full } = await query<JoinedRow>(
      `SELECT ${JOIN_SELECT} ${JOIN_FROM} WHERE a.id = $1`,
      [id],
    )
    res.json(toDto(full[0]))
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.statusCode).json({ error: err.message })
    } else {
      console.error(err)
      res.status(500).json({ error: err instanceof Error ? err.message : 'Erro interno' })
    }
  }
})

// ── Pin / unpin ──────────────────────────────────────
articlesRouter.patch('/:id/pin', requireAuth, async (req, res) => {
  try {
    const id = requireUuid(req.params.id, 'id')
    const raw = req.body?.position
    let position: PinPosition | null = null

    if (raw && raw !== 'none' && raw !== null) {
      if (!PIN_POSITIONS.includes(raw)) {
        throw httpError(400, `position deve ser null ou um de: ${PIN_POSITIONS.join(', ')}`)
      }
      position = raw as PinPosition
    }

    // Free up target slot first (if any other article occupies it)
    if (position) {
      await query(
        `UPDATE articles SET pin_position = NULL
          WHERE pin_position = $1 AND id <> $2`,
        [position, id],
      )
    }

    const { rowCount } = await query(
      `UPDATE articles SET pin_position = $1 WHERE id = $2`,
      [position, id],
    )
    if (!rowCount) throw httpError(404, 'Artigo não encontrado')

    const { rows } = await query<JoinedRow>(
      `SELECT ${JOIN_SELECT} ${JOIN_FROM} WHERE a.id = $1`,
      [id],
    )
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

// ── Delete ───────────────────────────────────────────
articlesRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = requireUuid(req.params.id, 'id')
    const { rowCount } = await query('DELETE FROM articles WHERE id = $1', [id])
    if (!rowCount) throw httpError(404, 'Artigo não encontrado')
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
