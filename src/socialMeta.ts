import type { Article, ArticleBlock } from './types'

const SITE_NAME = 'Guandalini'
const SITE_TITLE = 'Guandalini - Blog de Tecnologia'
const SITE_DESCRIPTION =
  'Noticias, analises e opinioes sobre tecnologia, produto, IA e o que realmente importa em tech.'
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&q=80&auto=format&fit=crop'

interface SocialMeta {
  title: string
  description: string
  url: string
  image: string
  type: 'website' | 'article'
}

function stripRichText(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`
}

function firstTextBlock(blocks: ArticleBlock[]): string {
  for (const block of blocks) {
    if (block.type === 'image') continue
    const cleaned = stripRichText(block.text)
    if (cleaned) return cleaned
  }
  return ''
}

function resolveAbsoluteUrl(value: string, origin: string): string {
  try {
    return new URL(value, origin).toString()
  } catch {
    return value
  }
}

function ensureMetaTag(selector: string, create: () => HTMLMetaElement): HTMLMetaElement {
  const existing = document.head.querySelector<HTMLMetaElement>(selector)
  if (existing) return existing
  const tag = create()
  document.head.appendChild(tag)
  return tag
}

function setMetaByName(name: string, content: string) {
  const tag = ensureMetaTag(`meta[name="${name}"]`, () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', name)
    return meta
  })
  tag.setAttribute('content', content)
}

function setMetaByProperty(property: string, content: string) {
  const tag = ensureMetaTag(`meta[property="${property}"]`, () => {
    const meta = document.createElement('meta')
    meta.setAttribute('property', property)
    return meta
  })
  tag.setAttribute('content', content)
}

function setCanonical(url: string) {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  const link = existing ?? document.createElement('link')
  link.setAttribute('rel', 'canonical')
  link.setAttribute('href', url)
  if (!existing) document.head.appendChild(link)
}

export function getDefaultSocialMeta(origin = window.location.origin): SocialMeta {
  return {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: `${origin}/`,
    image: FALLBACK_IMAGE,
    type: 'website',
  }
}

export function getArticleSocialMeta(article: Article, origin = window.location.origin): SocialMeta {
  const descriptionSource = article.subtitle?.trim() || firstTextBlock(article.body) || SITE_DESCRIPTION
  return {
    title: `${article.title} | ${SITE_NAME}`,
    description: truncate(descriptionSource, 200),
    url: `${origin}/noticia/${encodeURIComponent(article.slug)}`,
    image: resolveAbsoluteUrl(article.heroImage || FALLBACK_IMAGE, origin),
    type: 'article',
  }
}

export function applySocialMeta(meta: SocialMeta): void {
  document.title = meta.title
  setCanonical(meta.url)
  setMetaByName('description', meta.description)
  setMetaByProperty('og:site_name', SITE_NAME)
  setMetaByProperty('og:type', meta.type)
  setMetaByProperty('og:title', meta.title)
  setMetaByProperty('og:description', meta.description)
  setMetaByProperty('og:url', meta.url)
  setMetaByProperty('og:image', meta.image)
  setMetaByName('twitter:card', 'summary_large_image')
  setMetaByName('twitter:title', meta.title)
  setMetaByName('twitter:description', meta.description)
  setMetaByName('twitter:image', meta.image)
}
