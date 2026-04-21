import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './ArticleEditor.module.css'

// ── Types ──────────────────────────────────────────────────────────

type BlockType = 'paragraph' | 'heading' | 'pullquote' | 'image'

interface ParagraphBlock { id: string; type: 'paragraph'; text: string }
interface HeadingBlock   { id: string; type: 'heading';   text: string }
interface PullquoteBlock { id: string; type: 'pullquote'; text: string }
interface ImageBlock     { id: string; type: 'image';     src: string; caption: string }
type Block = ParagraphBlock | HeadingBlock | PullquoteBlock | ImageBlock

interface ArticleData {
  category:    string
  title:       string
  subtitle:    string
  heroImage:   string
  heroCaption: string
  readingTime: string
  styleBadge:  string
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

// ── Single auto-resize textarea ──────────────────────────────────────

function AutoTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  const ref = useAutoResize(value)
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
  block,
  isFirst,
  isLast,
  onChange,
  onMove,
  onDelete,
}: {
  block: Block
  isFirst: boolean
  isLast: boolean
  onChange: (b: Block) => void
  onMove: (dir: 'up' | 'down') => void
  onDelete: () => void
}) {
  const changeType = (type: BlockType) => {
    if (type === 'image') {
      onChange({ id: block.id, type: 'image', src: '', caption: '' })
    } else {
      const text = block.type !== 'image' ? block.text : ''
      onChange({ id: block.id, type, text } as Block)
    }
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
          <button
            className={styles.actionBtn}
            onClick={() => onMove('up')}
            disabled={isFirst}
            aria-label="Mover para cima"
            title="Mover para cima"
          >↑</button>
          <button
            className={styles.actionBtn}
            onClick={() => onMove('down')}
            disabled={isLast}
            aria-label="Mover para baixo"
            title="Mover para baixo"
          >↓</button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={onDelete}
            aria-label="Remover bloco"
            title="Remover"
          >✕</button>
        </div>
      </div>

      <div className={styles.blockContent}>
        {block.type === 'image' ? (
          <>
            <input
              type="text"
              className={styles.fieldInput}
              value={block.src}
              placeholder="URL da imagem (ex: https://…)"
              onChange={(e) => onChange({ ...block, src: e.target.value })}
            />
            <input
              type="text"
              className={`${styles.fieldInput} ${styles.captionInput}`}
              value={block.caption}
              placeholder="Legenda da imagem"
              onChange={(e) => onChange({ ...block, caption: e.target.value })}
            />
          </>
        ) : block.type === 'heading' ? (
          <input
            type="text"
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
          />
        )}
      </div>
    </div>
  )
}

// ── Preview components ───────────────────────────────────────────────

const BLOCK_PLACEHOLDERS: Record<BlockType, string> = {
  paragraph: 'Escreva o parágrafo…',
  heading:   'Título da seção…',
  pullquote: '"Uma frase de destaque…"',
  image:     '',
}

function g(hasValue: boolean) {
  // Returns ghost class when value is empty
  return hasValue ? '' : ` ${styles.previewGhost}`
}

function Preview({ data }: { data: ArticleData }) {
  return (
    <div className={styles.previewArticle}>
      {/* Header */}
      <div className={styles.previewHeader}>
        <span className={`${styles.previewCategory}${g(!!data.category)}`}>
          · {data.category || 'ex: Inteligência Artificial'}
        </span>

        <h1 className={`${styles.previewTitle}${g(!!data.title)}`}>
          {data.title || 'Título do artigo…'}
        </h1>

        <p className={`${styles.previewSubtitle}${g(!!data.subtitle)}`}>
          {data.subtitle || 'Subtítulo ou lead do artigo…'}
        </p>

        <div className={styles.previewBadges}>
          <span className={`${styles.previewBadge}${g(!!data.readingTime)}`}>
            {data.readingTime || 'ex: 8 min de leitura'}
          </span>
          <span className={`${styles.previewBadge}${g(!!data.styleBadge)}`}>
            {data.styleBadge || 'ex: Deep Dive'}
          </span>
        </div>
      </div>

      {/* Hero image */}
      <figure className={styles.previewHeroFig}>
        {data.heroImage ? (
          <img
            src={data.heroImage}
            alt={data.heroCaption}
            className={styles.previewHeroImg}
            onError={(e) => (e.currentTarget.style.display = 'none')}
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

      {/* Body */}
      <div className={styles.previewBody}>
        {data.body.map((block) => {
          if (block.type === 'paragraph')
            return (
              <p key={block.id} className={`${styles.previewParagraph}${g(!!block.text)}`}>
                {block.text || BLOCK_PLACEHOLDERS.paragraph}
              </p>
            )
          if (block.type === 'heading')
            return (
              <h2 key={block.id} className={`${styles.previewHeading}${g(!!block.text)}`}>
                {block.text || BLOCK_PLACEHOLDERS.heading}
              </h2>
            )
          if (block.type === 'pullquote')
            return (
              <blockquote key={block.id} className={`${styles.previewPullquote}${g(!!block.text)}`}>
                {block.text || BLOCK_PLACEHOLDERS.pullquote}
              </blockquote>
            )
          if (block.type === 'image')
            return (
              <figure key={block.id} className={styles.previewFig}>
                {block.src ? (
                  <img
                    src={block.src}
                    alt={block.caption}
                    className={styles.previewImg}
                    onError={(e) => (e.currentTarget.style.display = 'none')}
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
  onExit: () => void
}

export function ArticleEditor({ onExit }: ArticleEditorProps) {
  const [data, setData] = useState<ArticleData>({
    category: '',
    title: '',
    subtitle: '',
    heroImage: '',
    heroCaption: '',
    readingTime: '',
    styleBadge: '',
    body: [defaultBlock()],
  })

  const [saved, setSaved] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const update = useCallback(<K extends keyof ArticleData>(key: K, value: ArticleData[K]) => {
    setData((d) => ({ ...d, [key]: value }))
    setSaved(false)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => setSaved(true), 1200)
  }, [])

  const updateBlock = useCallback((id: string, block: Block) => {
    setData((d) => ({ ...d, body: d.body.map((b) => (b.id === id ? block : b)) }))
    setSaved(false)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => setSaved(true), 1200)
  }, [])

  const addBlock = () => {
    setData((d) => ({ ...d, body: [...d.body, defaultBlock()] }))
  }

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

  const titleRef   = useAutoResize(data.title)
  const subRef     = useAutoResize(data.subtitle)

  const wordCount = data.body
    .filter((b): b is ParagraphBlock | HeadingBlock | PullquoteBlock => b.type !== 'image')
    .reduce((acc, b) => acc + b.text.split(/\s+/).filter(Boolean).length, 0)

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
          <span className={styles.topLabel}>Novo artigo</span>
        </div>

        <div className={styles.topRight}>
          <span className={styles.saveStatus}>
            {saved ? (
              <>
                <span className={styles.savedDot} />
                Salvo automaticamente
              </>
            ) : (
              <>
                <span className={styles.unsavedDot} />
                {wordCount > 0 ? `${wordCount} palavras` : 'Rascunho'}
              </>
            )}
          </span>
          <button className={styles.publishBtn}>Publicar</button>
        </div>
      </div>

      {/* ── Panels ── */}
      <div className={styles.panels}>

        {/* Left — Editor */}
        <div className={styles.panelLeft}>
          <div className={styles.editorInner}>

            {/* Metadata fields */}
            <section className={styles.metaSection}>
              <h3 className={styles.sectionLabel}>Metadados</h3>

              <div className={styles.metaGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Categoria</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={data.category}
                    placeholder="ex: Inteligência Artificial"
                    onChange={(e) => update('category', e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Tempo de leitura</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={data.readingTime}
                    placeholder="ex: 8 min de leitura"
                    onChange={(e) => update('readingTime', e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Badge de estilo</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={data.styleBadge}
                    placeholder="ex: Deep Dive"
                    onChange={(e) => update('styleBadge', e.target.value)}
                  />
                </div>
              </div>
            </section>

            <div className={styles.divider} />

            {/* Title / Subtitle */}
            <section className={styles.titleSection}>
              <textarea
                ref={titleRef}
                value={data.title}
                className={styles.titleInput}
                placeholder="Título do artigo…"
                rows={1}
                onChange={(e) => update('title', e.target.value)}
              />
              <textarea
                ref={subRef}
                value={data.subtitle}
                className={styles.subtitleInput}
                placeholder="Subtítulo ou lead do artigo…"
                rows={2}
                onChange={(e) => update('subtitle', e.target.value)}
              />
            </section>

            <div className={styles.divider} />

            {/* Hero image */}
            <section className={styles.metaSection}>
              <h3 className={styles.sectionLabel}>Imagem de capa</h3>
              <div className={styles.fieldGroup}>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={data.heroImage}
                  placeholder="URL da imagem principal"
                  onChange={(e) => update('heroImage', e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup} style={{ marginTop: 8 }}>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={data.heroCaption}
                  placeholder="Legenda da imagem (opcional)"
                  onChange={(e) => update('heroCaption', e.target.value)}
                />
              </div>
            </section>

            <div className={styles.divider} />

            {/* Body blocks */}
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

        {/* Right — Preview */}
        <div className={styles.panelRight}>
          <div className={styles.previewLabel}>
            <span className={styles.previewDot} />
            Pré-visualização ao vivo
          </div>
          <div className={styles.previewScroll}>
            <Preview data={data} />
          </div>
        </div>
      </div>
    </div>
  )
}
