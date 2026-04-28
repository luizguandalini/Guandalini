import { useState, useRef, useEffect, useCallback, type MutableRefObject } from 'react'
import styles from './ArticleEditor.module.css'
import { articlesApi, authorsApi, badgesApi, categoriesApi } from '../api'
import type {
  ArticleBlock,
  Author,
  Badge,
  Category,
} from '../types'
import { useAuth } from '../auth'
import { Avatar } from './Avatar'
import { insertMarkdownLink, renderRichText } from '../richText'

// ── Block types with local IDs (for drag / delete keys) ──────────────

type BlockType = 'paragraph' | 'heading' | 'pullquote' | 'image'

interface ParagraphBlock { id: string; type: 'paragraph'; text: string }
interface HeadingBlock   { id: string; type: 'heading';   text: string }
interface PullquoteBlock { id: string; type: 'pullquote'; text: string }
interface ImageBlock     { id: string; type: 'image';     src: string; caption: string }
type Block = ParagraphBlock | HeadingBlock | PullquoteBlock | ImageBlock

interface FormData {
  categoryId:  string | null
  badgeId:     string | null
  authorId:    string | null
  title:       string
  subtitle:    string
  heroImage:   string
  heroCaption: string
  readingMin:  number
  body:        Block[]
}

// ── Helpers ─────────────────────────────────────────────────────────

let _id = 0
const uid = () => `b${++_id}`

const defaultBlock = (): ParagraphBlock => ({ id: uid(), type: 'paragraph', text: '' })

const BLOCK_LABELS: Record<BlockType, string> = {
  paragraph: '¶  Parágrafo',
  heading:   'H  Subtítulo',
  pullquote: '"  Destaque',
  image:     '⊡  Imagem',
}

function formatReading(min: number): string {
  return `${min} min de leitura`
}

// Map API blocks <-> local blocks (local adds id for stable keys)

function toLocalBlocks(blocks: ArticleBlock[]): Block[] {
  return blocks.map((b) => {
    if (b.type === 'image') {
      return { id: uid(), type: 'image', src: b.src, caption: b.caption }
    }
    return { id: uid(), type: b.type, text: b.text }
  })
}

function toApiBlocks(blocks: Block[]): ArticleBlock[] {
  return blocks.map((block) => {
    if (block.type === 'image') {
      return { type: block.type, src: block.src, caption: block.caption }
    }
    return { type: block.type, text: block.text }
  })
}

// ── Auto-resize textarea hook ────────────────────────────────────────

function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return ref
}

function AutoTextarea({
  value, onChange, placeholder, className, inputRef,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  inputRef?: MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>
}) {
  const ref = useAutoResize(value)
  useEffect(() => {
    if (!inputRef) return
    inputRef.current = ref.current
    return () => {
      inputRef.current = null
    }
  }, [inputRef, ref])

  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      className={className}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

// ── Block editor row ─────────────────────────────────────────────────

function BlockRow({
  block, isFirst, isLast, onChange, onMove, onDelete,
}: {
  block: Block
  isFirst: boolean
  isLast: boolean
  onChange: (b: Block) => void
  onMove: (dir: 'up' | 'down') => void
  onDelete: () => void
}) {
  const textFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  const changeType = (type: BlockType) => {
    if (type === 'image') {
      onChange({ id: block.id, type: 'image', src: '', caption: '' })
    } else {
      const text = block.type !== 'image' ? block.text : ''
      onChange({ id: block.id, type, text } as Block)
    }
  }

  const applyLink = () => {
    if (block.type === 'image') return

    const field = textFieldRef.current
    const start = field?.selectionStart ?? 0
    const end = field?.selectionEnd ?? 0

    if (start === end) {
      alert('Selecione o texto que deseja transformar em link.')
      field?.focus()
      return
    }

    const rawUrl = prompt('URL do link')
    if (rawUrl === null) return

    const result = insertMarkdownLink(block.text, start, end, rawUrl)
    if (!result) {
      alert('Informe uma URL valida, como https://exemplo.com.')
      field?.focus()
      return
    }

    onChange({ ...block, text: result.text } as Block)
    window.setTimeout(() => {
      field?.focus()
      field?.setSelectionRange(result.selectionStart, result.selectionEnd)
    })
  }

  return (
    <div className={styles.blockRow}>
      <div className={styles.blockMeta}>
        <select
          className={styles.typeSelect}
          value={block.type}
          onChange={(e) => changeType(e.target.value as BlockType)}
        >
          {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => (
            <option key={t} value={t}>{BLOCK_LABELS[t]}</option>
          ))}
        </select>
        <div className={styles.blockActions}>
          {block.type !== 'image' && (
            <button className={styles.actionBtn} onClick={applyLink} title="Inserir link no texto selecionado">ln</button>
          )}
          <button className={styles.actionBtn} onClick={() => onMove('up')} disabled={isFirst} title="Mover para cima">↑</button>
          <button className={styles.actionBtn} onClick={() => onMove('down')} disabled={isLast} title="Mover para baixo">↓</button>
          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={onDelete} title="Remover">✕</button>
        </div>
      </div>

      <div className={styles.blockContent}>
        {block.type === 'image' ? (
          <>
            <input
              type="text"
              maxLength={1000}
              className={styles.fieldInput}
              value={block.src}
              placeholder="URL da imagem (ex: https://…)"
              onChange={(e) => onChange({ ...block, src: e.target.value })}
            />
            <input
              type="text"
              maxLength={500}
              className={`${styles.fieldInput} ${styles.captionInput}`}
              value={block.caption}
              placeholder="Legenda da imagem"
              onChange={(e) => onChange({ ...block, caption: e.target.value })}
            />
          </>
        ) : block.type === 'heading' ? (
          <input
            ref={textFieldRef as MutableRefObject<HTMLInputElement | null>}
            type="text"
            maxLength={200}
            className={`${styles.fieldInput} ${styles.headingInput}`}
            value={block.text}
            placeholder="Título da seção…"
            onChange={(e) => onChange({ ...block, text: e.target.value })}
          />
        ) : (
          <AutoTextarea
            value={block.text}
            onChange={(text) => onChange({ ...block, text } as Block)}
            placeholder={block.type === 'pullquote' ? '"Uma frase de destaque…"' : 'Escreva o parágrafo…'}
            className={`${styles.fieldTextarea} ${block.type === 'pullquote' ? styles.pullquoteTextarea : ''}`}
            inputRef={textFieldRef}
          />
        )}
      </div>
    </div>
  )
}

// ── Image with error fallback ────────────────────────────────────────

function BrokenImageIllustration() {
  return (
    <svg viewBox="0 0 280 158" fill="none" className={styles.brokenSvg} aria-hidden>
      <rect width="280" height="158" fill="#F0EBE0" />
      <circle cx="216" cy="44" r="20" fill="#B8C9C0" opacity="0.45" />
      <circle cx="216" cy="44" r="13" fill="#B8C9C0" opacity="0.35" />
      <path d="M100 126 L158 62 L216 126Z" fill="#B8C9C0" opacity="0.35" />
      <path d="M30 126 L90 56 L150 126Z"  fill="#B8C9C0" opacity="0.55" />
      <rect x="0" y="122" width="280" height="36" fill="#B8C9C0" opacity="0.18" />
      <line x1="0" y1="0" x2="280" y2="158" stroke="#C0392B" strokeWidth="1.5" opacity="0.18" strokeLinecap="round" />
      <line x1="280" y1="0" x2="0" y2="158" stroke="#C0392B" strokeWidth="1.5" opacity="0.18" strokeLinecap="round" />
      <circle cx="140" cy="79" r="22" fill="white" opacity="0.88" />
      <circle cx="140" cy="79" r="18" fill="#FEF0F0" />
      <line x1="133" y1="72" x2="147" y2="86" stroke="#C0392B" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="147" y1="72" x2="133" y2="86" stroke="#C0392B" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function ImageWithFallback({
  src, alt, imgClassName, wrapClassName,
}: {
  src: string
  alt: string
  imgClassName: string
  wrapClassName: string
}) {
  const [errored, setErrored] = useState(false)
  useEffect(() => { setErrored(false) }, [src])

  if (errored) {
    return (
      <div className={`${wrapClassName} ${styles.imgErrorWrap}`}>
        <BrokenImageIllustration />
        <div className={styles.imgErrorInfo}>
          <span className={styles.imgErrorTitle}>Imagem não encontrada</span>
          <span className={styles.imgErrorSub}>Verifique a URL e tente novamente</span>
        </div>
      </div>
    )
  }

  return <img src={src} alt={alt} className={imgClassName} onError={() => setErrored(true)} />
}

// ── Preview ───────────────────────────────────────────────────────────

const BLOCK_PLACEHOLDERS: Record<BlockType, string> = {
  paragraph: 'Escreva o parágrafo…',
  heading:   'Título da seção…',
  pullquote: '"Uma frase de destaque…"',
  image:     '',
}

function g(hasValue: boolean) {
  return hasValue ? '' : ` ${styles.previewGhost}`
}

interface PreviewProps {
  data:       FormData
  categories: Category[]
  badges:     Badge[]
  author:     Author | null
}

function Preview({ data, categories, badges, author }: PreviewProps) {
  const category = categories.find((c) => c.id === data.categoryId)
  const badge    = badges.find((b) => b.id === data.badgeId)

  return (
    <div className={styles.previewArticle}>
      <div className={styles.previewHeader}>
        <span className={`${styles.previewCategory}${g(!!category)}`}>
          · {category?.name || 'ex: Inteligência Artificial'}
        </span>

        <h1 className={`${styles.previewTitle}${g(!!data.title)}`}>
          {data.title || 'Título do artigo…'}
        </h1>

        <p className={`${styles.previewSubtitle}${g(!!data.subtitle)}`}>
          {data.subtitle || 'Subtítulo ou lead do artigo…'}
        </p>

        <div className={styles.previewBadges}>
          <span className={styles.previewBadge}>
            {formatReading(data.readingMin)}
          </span>
          <span className={`${styles.previewBadge}${g(!!badge)}`}>
            {badge?.name || 'ex: Deep Dive'}
          </span>
        </div>

        {author && (
          <div className={styles.previewAuthor}>
            <Avatar src={author.avatarUrl} name={author.name} crop={author.avatarCrop} size={36} />
            <div>
              <div className={styles.previewAuthorName}>{author.name}</div>
              <div className={styles.previewAuthorRole}>{author.role}</div>
            </div>
          </div>
        )}
      </div>

      <figure className={styles.previewHeroFig}>
        {data.heroImage ? (
          <ImageWithFallback
            key={data.heroImage}
            src={data.heroImage}
            alt={data.heroCaption}
            imgClassName={styles.previewHeroImg}
            wrapClassName={styles.previewHeroImg}
          />
        ) : (
          <div className={styles.previewHeroPlaceholder}>
            <span>URL da imagem de capa</span>
          </div>
        )}
        <figcaption className={`${styles.previewCaption}${g(!!data.heroCaption)}`}>
          {data.heroCaption || 'Legenda da imagem (opcional)'}
        </figcaption>
      </figure>

      <div className={styles.previewBody}>
        {data.body.map((block) => {
          if (block.type === 'paragraph')
            return <p key={block.id} className={`${styles.previewParagraph}${g(!!block.text)}`}>{block.text ? renderRichText(block.text) : BLOCK_PLACEHOLDERS.paragraph}</p>
          if (block.type === 'heading')
            return <h2 key={block.id} className={`${styles.previewHeading}${g(!!block.text)}`}>{block.text ? renderRichText(block.text) : BLOCK_PLACEHOLDERS.heading}</h2>
          if (block.type === 'pullquote')
            return <blockquote key={block.id} className={`${styles.previewPullquote}${g(!!block.text)}`}>{block.text ? renderRichText(block.text) : BLOCK_PLACEHOLDERS.pullquote}</blockquote>
          if (block.type === 'image')
            return (
              <figure key={block.id} className={styles.previewFig}>
                {block.src ? (
                  <ImageWithFallback
                    key={block.src}
                    src={block.src}
                    alt={block.caption}
                    imgClassName={styles.previewImg}
                    wrapClassName={styles.previewImg}
                  />
                ) : (
                  <div className={styles.previewImgPlaceholder}>
                    <span>URL da imagem</span>
                  </div>
                )}
                {block.caption && (
                  <figcaption className={styles.previewCaption}>{block.caption}</figcaption>
                )}
              </figure>
            )
          return null
        })}
      </div>
    </div>
  )
}

// ── Main editor ──────────────────────────────────────────────────────

interface ArticleEditorProps {
  onExit:       () => void
  onPublished:  (id: string) => void
  articleId?:   string
}

const EMPTY_FORM: FormData = {
  categoryId:  null,
  badgeId:     null,
  authorId:    null,
  title:       '',
  subtitle:    '',
  heroImage:   '',
  heroCaption: '',
  readingMin:  5,
  body:        [defaultBlock()],
}

export function ArticleEditor({ onExit, onPublished, articleId }: ArticleEditorProps) {
  const { user } = useAuth()

  const [data, setData] = useState<FormData>(EMPTY_FORM)
  const [categories, setCategories] = useState<Category[]>([])
  const [badges,     setBadges]     = useState<Badge[]>([])
  const [authors,    setAuthors]    = useState<Author[]>([])

  const [publishing, setPublishing] = useState(false)
  const [publishErr, setPublishErr] = useState<string | null>(null)
  const [savedAt,    setSavedAt]    = useState<Date | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load lookup data + article (if editing) on mount
  useEffect(() => {
    (async () => {
      const [cats, bds, authorsPage] = await Promise.all([
        categoriesApi.list(),
        badgesApi.list(),
        authorsApi.list(1, 50),
      ])
      setCategories(cats.items)
      setBadges(bds.items)
      setAuthors(authorsPage.items)

      if (articleId) {
        try {
          const a = await articlesApi.get(articleId)
          setData({
            categoryId:  a.category?.id ?? null,
            badgeId:     a.badge?.id ?? null,
            authorId:    a.author?.id ?? null,
            title:       a.title,
            subtitle:    a.subtitle ?? '',
            heroImage:   a.heroImage ?? '',
            heroCaption: a.heroCaption ?? '',
            readingMin:  a.readingTimeMin,
            body:        a.body.length > 0 ? toLocalBlocks(a.body) : [defaultBlock()],
          })
        } catch (err) {
          console.error(err)
        }
      }
    })()
  }, [articleId])

  const markDraft = useCallback(() => {
    setSavedAt(null)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => setSavedAt(new Date()), 1200)
  }, [])

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((d) => ({ ...d, [key]: value }))
    markDraft()
  }, [markDraft])

  const updateBlock = useCallback((id: string, block: Block) => {
    setData((d) => ({ ...d, body: d.body.map((b) => (b.id === id ? block : b)) }))
    markDraft()
  }, [markDraft])

  const addBlock = () => setData((d) => ({ ...d, body: [...d.body, defaultBlock()] }))

  const moveBlock = (idx: number, dir: 'up' | 'down') => {
    setData((d) => {
      const body = [...d.body]
      const target = dir === 'up' ? idx - 1 : idx + 1
      ;[body[idx], body[target]] = [body[target], body[idx]]
      return { ...d, body }
    })
  }

  const deleteBlock = (idx: number) => {
    setData((d) => ({
      ...d,
      body: d.body.length > 1 ? d.body.filter((_, i) => i !== idx) : d.body,
    }))
  }

  const publish = async () => {
    setPublishErr(null)
    if (!data.title.trim()) {
      setPublishErr('O título é obrigatório')
      return
    }
    setPublishing(true)
    try {
      const payload = {
        title:          data.title.trim(),
        subtitle:       data.subtitle.trim() || null,
        categoryId:     data.categoryId,
        authorId:       data.authorId,
        badgeId:        data.badgeId,
        readingTimeMin: data.readingMin,
        heroImage:      data.heroImage.trim() || null,
        heroCaption:    data.heroCaption.trim() || null,
        body:           toApiBlocks(data.body),
        status:         'published' as const,
      }
      const res = articleId
        ? await articlesApi.update(articleId, payload)
        : await articlesApi.create(payload)
      onPublished(res.id)
    } catch (err) {
      setPublishErr(err instanceof Error ? err.message : 'Erro ao publicar')
    } finally {
      setPublishing(false)
    }
  }

  const titleRef = useAutoResize(data.title)
  const subRef   = useAutoResize(data.subtitle)

  const wordCount = data.body
    .filter((b): b is ParagraphBlock | HeadingBlock | PullquoteBlock => b.type !== 'image')
    .reduce((acc, b) => acc + b.text.split(/\s+/).filter(Boolean).length, 0)

  const selectedAuthor = authors.find((a) => a.id === data.authorId) ?? null
  const previewAuthor: Author | null = selectedAuthor
    ?? (user ? ({
          id: user.id, name: user.name, role: user.role,
          avatarUrl: user.avatarUrl ?? `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=b8c9c0`,
          avatarType: 'dicebear' as const, avatarCrop: null, createdAt: '',
        }) : null)

  return (
    <div className={styles.editor}>
      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <button className={styles.exitBtn} onClick={onExit}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Sair
        </button>

        <div className={styles.topCenter}>
          <span className={styles.topBrand}>Guandalini.</span>
          <span className={styles.topDivider}>/</span>
          <span className={styles.topLabel}>{articleId ? 'Editar artigo' : 'Novo artigo'}</span>
        </div>

        <div className={styles.topRight}>
          <span className={styles.saveStatus}>
            {savedAt
              ? <><span className={styles.savedDot} />Rascunho local ok</>
              : <><span className={styles.unsavedDot} />{wordCount > 0 ? `${wordCount} palavras` : 'Rascunho'}</>}
          </span>
          <button
            className={styles.publishBtn}
            onClick={publish}
            disabled={publishing || !data.title.trim()}
          >
            {publishing ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </div>

      {publishErr && (
        <div style={{
          background: '#FEF0F0', color: '#C0392B',
          border: '1px solid #F5CDC8', padding: '10px 20px',
          fontSize: '0.8125rem',
        }}>
          {publishErr}
        </div>
      )}

      <div className={styles.panels}>
        {/* ── Left — Editor ── */}
        <div className={styles.panelLeft}>
          <div className={styles.editorInner}>

            <section className={styles.metaSection}>
              <h3 className={styles.sectionLabel}>Metadados</h3>

              <div className={styles.metaGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Categoria</label>
                  <select
                    className={styles.fieldInput}
                    value={data.categoryId ?? ''}
                    onChange={(e) => update('categoryId', e.target.value || null)}
                  >
                    <option value="">— Selecionar —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Tempo de leitura</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      className={styles.fieldInput}
                      value={data.readingMin}
                      style={{ width: 100 }}
                      onChange={(e) => {
                        const n = Number(e.target.value)
                        if (Number.isFinite(n)) update('readingMin', Math.max(1, Math.min(180, n)))
                      }}
                    />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      → {formatReading(data.readingMin)}
                    </span>
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Badge de estilo</label>
                  <select
                    className={styles.fieldInput}
                    value={data.badgeId ?? ''}
                    onChange={(e) => update('badgeId', e.target.value || null)}
                  >
                    <option value="">— Selecionar —</option>
                    {badges.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Autor</label>
                  <select
                    className={styles.fieldInput}
                    value={data.authorId ?? ''}
                    onChange={(e) => update('authorId', e.target.value || null)}
                  >
                    <option value="">
                      {user ? `Eu (${user.name})` : '— Selecionar —'}
                    </option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} — {a.role}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <div className={styles.divider} />

            <section className={styles.titleSection}>
              <textarea
                ref={titleRef}
                value={data.title}
                maxLength={200}
                className={styles.titleInput}
                placeholder="Título do artigo…"
                rows={1}
                onChange={(e) => update('title', e.target.value)}
              />
              <textarea
                ref={subRef}
                value={data.subtitle}
                maxLength={500}
                className={styles.subtitleInput}
                placeholder="Subtítulo ou lead do artigo…"
                rows={2}
                onChange={(e) => update('subtitle', e.target.value)}
              />
            </section>

            <div className={styles.divider} />

            <section className={styles.metaSection}>
              <h3 className={styles.sectionLabel}>Imagem de capa</h3>
              <div className={styles.fieldGroup}>
                <input
                  type="text"
                  maxLength={1000}
                  className={styles.fieldInput}
                  value={data.heroImage}
                  placeholder="URL da imagem principal"
                  onChange={(e) => update('heroImage', e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup} style={{ marginTop: 8 }}>
                <input
                  type="text"
                  maxLength={500}
                  className={styles.fieldInput}
                  value={data.heroCaption}
                  placeholder="Legenda da imagem (opcional)"
                  onChange={(e) => update('heroCaption', e.target.value)}
                />
              </div>
            </section>

            <div className={styles.divider} />

            <section className={styles.bodySection}>
              <h3 className={styles.sectionLabel}>Conteúdo</h3>

              <div className={styles.blockList}>
                {data.body.map((block, idx) => (
                  <BlockRow
                    key={block.id}
                    block={block}
                    isFirst={idx === 0}
                    isLast={idx === data.body.length - 1}
                    onChange={(b) => updateBlock(block.id, b)}
                    onMove={(dir) => moveBlock(idx, dir)}
                    onDelete={() => deleteBlock(idx)}
                  />
                ))}
              </div>

              <button className={styles.addBlockBtn} onClick={addBlock}>
                <span className={styles.addIcon}>+</span>
                Adicionar bloco
              </button>
            </section>
          </div>
        </div>

        {/* ── Right — Preview ── */}
        <div className={styles.panelRight}>
          <div className={styles.previewLabel}>
            <span className={styles.previewDot} />
            Pré-visualização ao vivo
          </div>
          <div className={styles.previewScroll}>
            <Preview data={data} categories={categories} badges={badges} author={previewAuthor} />
          </div>
        </div>
      </div>
    </div>
  )
}
