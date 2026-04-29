import { useCallback, useEffect, useState } from 'react'
import styles from './ArticlePost.module.css'
import { articlesApi } from '../api'
import { useAuth } from '../auth'
import type { Article, PinPosition } from '../types'
import { Avatar } from './Avatar'
import { renderRichText } from '../richText'

interface ArticlePostProps {
  articleSlug: string
  onBack: () => void
  onOpenOther: (slug: string) => void
  onEdit: (id: string) => void
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&q=80&auto=format&fit=crop'

const formatFullDate = (iso: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const formatShortDate = (iso: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PIN_LABELS: Record<PinPosition, string> = {
  left: 'Destaque principal',
  right_top: 'Destaque superior',
  right_bottom: 'Destaque inferior',
}

let shareFeedbackTimer: ReturnType<typeof setTimeout> | null = null

export function ArticlePost({ articleSlug, onBack, onOpenOther, onEdit }: ArticlePostProps) {
  const { user } = useAuth()

  const [article, setArticle] = useState<Article | null>(null)
  const [related, setRelated] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pinning, setPinning] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [a, list] = await Promise.all([
        articlesApi.getBySlug(articleSlug),
        articlesApi.list(1, 4),
      ])
      setArticle(a)
      setRelated(list.recent.filter((r) => r.id !== a.id).slice(0, 3))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar artigo')
    } finally {
      setLoading(false)
    }
  }, [articleSlug])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => () => {
    if (shareFeedbackTimer) clearTimeout(shareFeedbackTimer)
  }, [])

  const showShareFeedback = (message: string) => {
    setShareFeedback(message)
    if (shareFeedbackTimer) clearTimeout(shareFeedbackTimer)
    shareFeedbackTimer = setTimeout(() => setShareFeedback(null), 2200)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.setAttribute('readonly', 'true')
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(textarea)
        return ok
      } catch {
        return false
      }
    }
  }

  const openShareWindow = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const share = async (mode: 'whatsapp' | 'instagram' | 'linkedin' | 'copy') => {
    const url = window.location.href
    const title = article?.title ?? ''
    const text = article?.subtitle?.trim() || title

    if (mode === 'whatsapp') {
      openShareWindow(`https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`)
      showShareFeedback('Abrindo WhatsApp')
      return
    }

    if (mode === 'linkedin') {
      openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`)
      showShareFeedback('Abrindo LinkedIn')
      return
    }

    if (mode === 'instagram') {
      const copied = await copyToClipboard(url)
      showShareFeedback(copied
        ? 'Link copiado para o Instagram'
        : 'Nao foi possivel copiar o link')
      return
    }

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        showShareFeedback('Link compartilhado')
        return
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }

    const copied = await copyToClipboard(url)
    showShareFeedback(copied ? 'Link copiado com sucesso' : 'Nao foi possivel copiar o link')
  }

  const setPin = async (position: PinPosition | null) => {
    if (!article) return
    setPinning(true)
    try {
      const updated = await articlesApi.pin(article.id, position)
      setArticle(updated)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao pinar')
    } finally {
      setPinning(false)
    }
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Carregando artigo...
        </div>
      </main>
    )
  }

  if (error || !article) {
    return (
      <main className={styles.page}>
        <article className={styles.article}>
          <button className={styles.backBtn} onClick={onBack}>← Voltar</button>
          <div style={{
            marginTop: 40,
            padding: '20px',
            background: '#FEF0F0',
            border: '1px solid #F5CDC8',
            borderRadius: 14,
            color: '#C0392B',
            fontSize: '0.9375rem',
          }}>
            {error ?? 'Artigo nao encontrado'}
          </div>
        </article>
      </main>
    )
  }

  const author = article.author
  const category = article.category
  const badge = article.badge

  const shareControls = (
    <>
      <span className={styles.shareLabel}>Share</span>
      <button className={styles.shareBtn} aria-label="Compartilhar no WhatsApp" onClick={() => { void share('whatsapp') }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      </button>
      <button className={styles.shareBtn} aria-label="Compartilhar no Instagram" onClick={() => { void share('instagram') }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
      </button>
      <button className={styles.shareBtn} aria-label="Compartilhar no LinkedIn" onClick={() => { void share('linkedin') }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </button>
      <button className={styles.shareBtn} aria-label="Compartilhar ou copiar link" onClick={() => { void share('copy') }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
    </>
  )

  return (
    <main className={styles.page}>
      <div className={styles.articleShell}>
        <aside className={styles.socialShare}>
          {shareControls}
          <span className={styles.shareFeedback} aria-live="polite">
            {shareFeedback ?? '\u00A0'}
          </span>
        </aside>

        <article className={styles.article}>
          <div className={styles.topRow}>
            <button className={styles.backBtn} onClick={onBack}>← Voltar</button>

            {user && (
              <div className={styles.adminRow}>
                <button className={styles.editBtn} onClick={() => onEdit(article.id)}>
                  Editar
                </button>

                <div className={styles.pinGroup}>
                  <span className={styles.pinLabel}>
                    {article.pinPosition ? `Pinado: ${PIN_LABELS[article.pinPosition]}` : 'Pinar em'}
                  </span>
                  <div className={styles.pinButtons}>
                    <button
                      className={`${styles.pinBtn} ${article.pinPosition === 'left' ? styles.pinActive : ''}`}
                      onClick={() => setPin('left')}
                      disabled={pinning}
                      title="Destaque principal (esquerda, grande)"
                    >Esquerda</button>
                    <button
                      className={`${styles.pinBtn} ${article.pinPosition === 'right_top' ? styles.pinActive : ''}`}
                      onClick={() => setPin('right_top')}
                      disabled={pinning}
                      title="Destaque superior direito"
                    >Direita ↑</button>
                    <button
                      className={`${styles.pinBtn} ${article.pinPosition === 'right_bottom' ? styles.pinActive : ''}`}
                      onClick={() => setPin('right_bottom')}
                      disabled={pinning}
                      title="Destaque inferior direito"
                    >Direita ↓</button>
                    {article.pinPosition && (
                      <button
                        className={styles.pinUnpin}
                        onClick={() => setPin(null)}
                        disabled={pinning}
                        title="Remover pin"
                      >Remover</button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <header className={styles.header}>
            <span className={styles.categoryBadge}>· {category?.name ?? 'Artigo'}</span>
            <time className={styles.date}>{formatFullDate(article.publishedAt ?? article.createdAt)}</time>
            <h1 className={styles.title}>{article.title}</h1>
            {article.subtitle && <p className={styles.subtitle}>{article.subtitle}</p>}

            <div className={styles.meta}>
              <span className={styles.badge}>{article.readingTimeMin} min de leitura</span>
              {badge && <span className={styles.badge}>{badge.name}</span>}
            </div>

            {author && (
              <div className={styles.author}>
                <Avatar
                  src={author.avatarUrl}
                  name={author.name}
                  crop={author.avatarCrop}
                  size={40}
                  className={styles.authorAvatar}
                />
                <div>
                  <p className={styles.authorName}>{author.name}</p>
                  <p className={styles.authorRole}>{author.role}</p>
                </div>
              </div>
            )}

            <div className={styles.inlineShare}>
              {shareControls}
              <span className={styles.inlineShareFeedback} aria-live="polite">
                {shareFeedback ?? '\u00A0'}
              </span>
            </div>
          </header>

          {article.heroImage && (
            <figure className={styles.heroFigure}>
              <img
                src={article.heroImage}
                alt={article.heroCaption ?? ''}
                className={styles.heroImage}
                onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
              />
              {article.heroCaption && (
                <figcaption className={styles.caption}>{article.heroCaption}</figcaption>
              )}
            </figure>
          )}

          <div className={styles.body}>
            {article.body.map((block, i) => {
              if (block.type === 'paragraph') return <p key={i} className={styles.paragraph}>{renderRichText(block.text)}</p>
              if (block.type === 'heading') return <h2 key={i} className={styles.sectionHeading}>{renderRichText(block.text)}</h2>
              if (block.type === 'pullquote') return <blockquote key={i} className={styles.pullquote}>{renderRichText(block.text)}</blockquote>
              if (block.type === 'image') {
                return (
                  <figure key={i} className={styles.inlineFigure}>
                    <img
                      src={block.src}
                      alt={block.caption}
                      className={styles.inlineImage}
                      onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                    />
                    {block.caption && <figcaption className={styles.caption}>{block.caption}</figcaption>}
                  </figure>
                )
              }
              return null
            })}
          </div>

          {author && (
            <div className={styles.authorBio}>
              <Avatar
                src={author.avatarUrl}
                name={author.name}
                crop={author.avatarCrop}
                size={64}
                className={styles.authorBioAvatar}
              />
              <div className={styles.authorBioText}>
                <p className={styles.authorBioName}>{author.name}</p>
                <p className={styles.authorBioDesc}>{author.role}</p>
              </div>
            </div>
          )}
        </article>
      </div>

      {related.length > 0 && (
        <section className={styles.related}>
          <div className={styles.relatedInner}>
            <h3 className={styles.relatedTitle}>Leia também</h3>
            <div className={styles.relatedGrid}>
              {related.map((post) => (
                <button
                  key={post.id}
                  className={styles.relatedCard}
                  onClick={() => onOpenOther(post.slug)}
                >
                  <div className={styles.relatedImageWrap}>
                    <img
                      src={post.heroImage ?? FALLBACK_IMAGE}
                      alt={post.title}
                      className={styles.relatedImage}
                      onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                    />
                    <span className={styles.relatedArrow}>↗</span>
                  </div>
                  <div className={styles.relatedInfo}>
                    <span className={styles.relatedCategory}>· {post.category?.name ?? 'Artigo'}</span>
                    <p className={styles.relatedCardTitle}>{post.title}</p>
                    <time className={styles.relatedDate}>
                      {formatShortDate(post.publishedAt ?? post.createdAt)}
                    </time>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaAvatars}>
            {['ana', 'pedro', 'julia', 'marcos', 'carla'].map((seed) => (
              <img
                key={seed}
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=b8c9c0`}
                alt=""
                className={styles.ctaAvatar}
              />
            ))}
          </div>
          <h2 className={styles.ctaTitle}>
            Fique por dentro do que <em>realmente</em> importa em tech.
          </h2>
          <p className={styles.ctaSubtext}>
            Você abre sua caixa de e-mails enquanto toma seu café da manhã? Considere inserir seu endereço abaixo.
          </p>
          <form className={styles.ctaForm} onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Seu nome" className={styles.ctaInput} />
            <input type="email" placeholder="Seu e-mail" className={styles.ctaInput} />
            <button type="submit" className={styles.ctaButton}>Inscrever</button>
          </form>
        </div>
      </section>
    </main>
  )
}
