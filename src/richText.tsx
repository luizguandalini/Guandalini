import type { ReactNode } from 'react'

interface TextSegment {
  type: 'text'
  text: string
}

interface LinkSegment {
  type: 'link'
  text: string
  url: string
}

type Segment = TextSegment | LinkSegment

function unescapeLinkLabel(label: string): string {
  return label.replace(/\\([\\[\]])/g, '$1')
}

function escapeLinkLabel(label: string): string {
  return label.replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]')
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

export function normalizeHyperlinkUrl(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null

  if (raw.startsWith('/') && !raw.startsWith('//')) {
    return raw
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(raw)
    ? raw
    : `https://${raw}`

  try {
    const parsed = new URL(withProtocol)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
      return parsed.toString()
    }
  } catch {
    return null
  }

  return null
}

export function insertMarkdownLink(text: string, start: number, end: number, rawUrl: string) {
  const from = Math.max(0, Math.min(start, text.length))
  const to = Math.max(from, Math.min(end, text.length))
  const label = text.slice(from, to)
  const url = normalizeHyperlinkUrl(rawUrl)

  if (!label.trim() || !url) return null

  const markdown = `[${escapeLinkLabel(label)}](${url})`
  return {
    text: `${text.slice(0, from)}${markdown}${text.slice(to)}`,
    selectionStart: from,
    selectionEnd: from + markdown.length,
  }
}

export function parseRichText(text: string): Segment[] {
  const segments: Segment[] = []
  let plainStart = 0
  let scan = 0

  while (scan < text.length) {
    const open = text.indexOf('[', scan)
    if (open === -1) break

    const close = findUnescaped(text, ']', open + 1)
    if (close === -1 || text[close + 1] !== '(') {
      scan = open + 1
      continue
    }

    const urlEnd = text.indexOf(')', close + 2)
    if (urlEnd === -1) {
      scan = close + 1
      continue
    }

    const label = unescapeLinkLabel(text.slice(open + 1, close))
    const url = normalizeHyperlinkUrl(text.slice(close + 2, urlEnd))

    if (!label || !url) {
      scan = open + 1
      continue
    }

    if (open > plainStart) {
      segments.push({ type: 'text', text: text.slice(plainStart, open) })
    }
    segments.push({ type: 'link', text: label, url })
    scan = urlEnd + 1
    plainStart = scan
  }

  if (plainStart < text.length) {
    segments.push({ type: 'text', text: text.slice(plainStart) })
  }

  return segments.length > 0 ? segments : [{ type: 'text', text }]
}

export function renderRichText(text: string): ReactNode {
  return parseRichText(text).map((segment, index) => {
    if (segment.type === 'text') return segment.text

    const external = !segment.url.startsWith('/')
    return (
      <a
        key={`${segment.url}-${index}`}
        href={segment.url}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {segment.text}
      </a>
    )
  })
}
