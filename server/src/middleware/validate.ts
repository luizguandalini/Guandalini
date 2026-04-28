import sanitizeHtml from 'sanitize-html'

export const LIMITS = {
  email:        255,
  password:     200,
  name:         120,
  role:         120,
  categoryName: 60,
  badgeName:    60,
  title:        200,
  subtitle:     500,
  heroImage:    1000,
  heroCaption:  500,
  blockText:    10_000,
  url:          1000,
} as const

export function sanitizeText(input: unknown, maxLen: number): string {
  if (typeof input !== 'string') return ''
  const clean = sanitizeHtml(input, {
    allowedTags:       [],
    allowedAttributes: {},
  }).trim()
  return clean.slice(0, maxLen)
}

export function requireString(input: unknown, field: string, maxLen: number): string {
  const v = sanitizeText(input, maxLen)
  if (!v) {
    throw httpError(400, `Field '${field}' is required`)
  }
  return v
}

export function optionalString(input: unknown, maxLen: number): string | null {
  if (input === null || input === undefined || input === '') return null
  return sanitizeText(input, maxLen) || null
}

export function optionalUrl(input: unknown, maxLen: number): string | null {
  if (input === null || input === undefined || input === '') return null
  const clean = sanitizeText(input, maxLen)
  if (!clean) return null

  if (/^\/uploads\/[0-9a-f-]+\.(jpe?g|png|webp)$/i.test(clean)) {
    return clean
  }

  try {
    const parsed = new URL(clean)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return clean
    }
  } catch {
    // fall through to validation error below
  }

  throw httpError(400, 'Image URLs must use http(s) or a local upload path')
}

function validateTextLinkUrl(raw: string): boolean {
  const value = raw.trim()
  if (!value) return false

  if (value.startsWith('/') && !value.startsWith('//')) {
    return true
  }

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:'
  } catch {
    return false
  }
}

function findUnescaped(text: string, char: string, start: number): number {
  for (let i = start; i < text.length; i++) {
    if (text[i] !== char) continue

    let slashes = 0
    for (let j = i - 1; j >= 0 && text[j] === '\\'; j--) slashes++
    if (slashes % 2 === 0) return i
  }
  return -1
}

export function validateMarkdownLinks(text: string): void {
  let cursor = 0

  while (cursor < text.length) {
    const open = text.indexOf('[', cursor)
    if (open === -1) return

    const close = findUnescaped(text, ']', open + 1)
    if (close === -1 || text[close + 1] !== '(') {
      cursor = open + 1
      continue
    }

    const urlEnd = text.indexOf(')', close + 2)
    if (urlEnd === -1) {
      cursor = close + 1
      continue
    }

    const label = text.slice(open + 1, close).trim()
    const rawUrl = text.slice(close + 2, urlEnd)
    if (label && !validateTextLinkUrl(rawUrl)) {
      throw httpError(400, 'Text links must use http(s), mailto, or a local path')
    }

    cursor = urlEnd + 1
  }
}

export function requireInt(input: unknown, field: string, min: number, max: number): number {
  const n = Number(input)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
    throw httpError(400, `Field '${field}' must be an integer between ${min} and ${max}`)
  }
  return n
}

export function requireUuid(input: unknown, field: string): string {
  if (typeof input !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)) {
    throw httpError(400, `Field '${field}' must be a valid UUID`)
  }
  return input
}

export function optionalUuid(input: unknown, field: string): string | null {
  if (input === null || input === undefined || input === '') return null
  return requireUuid(input, field)
}

export interface BodyBlockClean {
  type: 'paragraph' | 'heading' | 'pullquote' | 'image'
  text?: string
  src?: string
  caption?: string
}

export function sanitizeBody(input: unknown): BodyBlockClean[] {
  if (!Array.isArray(input)) return []
  const result: BodyBlockClean[] = []

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue
    const obj = raw as Record<string, unknown>
    const type = String(obj.type)

    if (type === 'paragraph' || type === 'heading' || type === 'pullquote') {
      const text = sanitizeText(obj.text, LIMITS.blockText)
      if (text) {
        validateMarkdownLinks(text)
        result.push({ type, text })
      }
    } else if (type === 'image') {
      const src     = optionalUrl(obj.src, LIMITS.url)
      const caption = sanitizeText(obj.caption, LIMITS.heroCaption)
      if (src) result.push({ type, src, caption })
    }
  }

  return result
}

// ── HTTP error helper ─────────────────────────────────────────────

export interface HttpError extends Error {
  statusCode: number
}

export function httpError(statusCode: number, message: string): HttpError {
  const err = new Error(message) as HttpError
  err.statusCode = statusCode
  return err
}

export function isHttpError(err: unknown): err is HttpError {
  return !!err && typeof err === 'object' && 'statusCode' in err
}
