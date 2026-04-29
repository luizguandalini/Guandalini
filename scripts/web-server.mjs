import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = resolve(__dirname, '..')
const distDir = join(rootDir, 'dist')
const indexPath = join(distDir, 'index.html')

const PORT = Number(process.env.PORT ?? 80)
const API_ORIGIN = process.env.API_ORIGIN ?? 'http://api:3001'
const SITE_NAME = 'Guandalini'
const SITE_TITLE = 'Guandalini - Blog de Tecnologia'
const SITE_DESCRIPTION =
  'Noticias, analises e opinioes sobre tecnologia, produto, IA e o que realmente importa em tech.'
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&q=80&auto=format&fit=crop'

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
}

const indexTemplate = await readFile(indexPath, 'utf8')

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function stripRichText(text) {
  return String(text ?? '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) return text
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`
}

function firstTextBlock(blocks) {
  if (!Array.isArray(blocks)) return ''

  for (const block of blocks) {
    if (!block || block.type === 'image') continue
    const cleaned = stripRichText(block.text)
    if (cleaned) return cleaned
  }

  return ''
}

function resolveAbsoluteUrl(value, origin) {
  try {
    return new URL(value, origin).toString()
  } catch {
    return value
  }
}

function getOrigin(req) {
  const protocol = req.headers['x-forwarded-proto'] ?? 'http'
  const host = req.headers.host ?? 'localhost'
  return `${protocol}://${host}`
}

function buildMetaTags(meta) {
  return [
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.url)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.type)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.url)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`,
  ].join('\n    ')
}

function renderIndex(meta) {
  return indexTemplate
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace('<!--app-social-meta-->', buildMetaTags(meta))
}

function getDefaultMeta(origin) {
  return {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: `${origin}/`,
    image: FALLBACK_IMAGE,
    type: 'website',
  }
}

function getArticleMeta(article, origin) {
  const description = truncate(
    article.subtitle?.trim() || firstTextBlock(article.body) || SITE_DESCRIPTION,
    200,
  )

  return {
    title: `${article.title} | ${SITE_NAME}`,
    description,
    url: `${origin}/noticia/${encodeURIComponent(article.slug)}`,
    image: resolveAbsoluteUrl(article.heroImage || FALLBACK_IMAGE, origin),
    type: 'article',
  }
}

async function fetchArticle(slug) {
  const response = await fetch(`${API_ORIGIN}/api/articles/slug/${encodeURIComponent(slug)}`, {
    headers: { accept: 'application/json' },
  })

  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(`Article lookup failed with ${response.status}`)
  }

  return response.json()
}

async function proxyRequest(req, res, pathname, search) {
  const targetUrl = new URL(`${pathname}${search}`, API_ORIGIN)
  const headers = new Headers()

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue
    headers.set(key, Array.isArray(value) ? value.join(', ') : value)
  }

  headers.set('host', new URL(API_ORIGIN).host)

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req,
    duplex: req.method === 'GET' || req.method === 'HEAD' ? undefined : 'half',
  })

  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return
    res.setHeader(key, value)
  })

  if (!response.body || req.method === 'HEAD') {
    res.end()
    return
  }

  for await (const chunk of response.body) {
    res.write(chunk)
  }
  res.end()
}

async function serveStaticFile(res, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname
  const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, '')
  const filePath = join(distDir, safePath)

  if (!filePath.startsWith(distDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Forbidden')
    return true
  }

  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) return false

    const ext = extname(filePath).toLowerCase()
    res.statusCode = 200
    res.setHeader('Content-Type', MIME_TYPES[ext] ?? 'application/octet-stream')
    res.setHeader('Content-Length', fileStat.size)
    res.setHeader(
      'Cache-Control',
      pathname.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : 'no-store',
    )

    if (res.req?.method === 'HEAD') {
      res.end()
      return true
    }

    createReadStream(filePath).pipe(res)
    return true
  } catch {
    return false
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const { pathname, search } = url

    if (pathname.startsWith('/api/') || pathname.startsWith('/uploads/')) {
      await proxyRequest(req, res, pathname, search)
      return
    }

    if (pathname.startsWith('/assets/') || pathname === '/favicon.svg') {
      const served = await serveStaticFile(res, pathname)
      if (!served) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found')
      }
      return
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Method not allowed')
      return
    }

    const origin = getOrigin(req)

    if (pathname === '/') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      }).end(renderIndex(getDefaultMeta(origin)))
      return
    }

    if (pathname.startsWith('/noticia/')) {
      const slug = decodeURIComponent(pathname.slice('/noticia/'.length)).trim()
      const article = slug ? await fetchArticle(slug) : null
      const meta = article ? getArticleMeta(article, origin) : getDefaultMeta(origin)
      res.writeHead(article ? 200 : 404, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      }).end(renderIndex(meta))
      return
    }

    const served = await serveStaticFile(res, pathname)
    if (served) return

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    }).end(renderIndex(getDefaultMeta(origin)))
  } catch (error) {
    console.error('[web]', error)
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Internal server error')
  }
})

server.listen(PORT, () => {
  console.log(`[web] listening on http://localhost:${PORT}`)
})
