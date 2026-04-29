import { useCallback, useEffect, useState } from 'react'
import styles from './HomePage.module.css'
import { articlesApi } from '../api'
import type { Article } from '../types'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&q=80&auto=format&fit=crop'

const formatDate = (iso: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const excerptOf = (a: Article): string => {
  if (a.subtitle) return a.subtitle
  const first = a.body.find((b) => b.type === 'paragraph')
  return first && 'text' in first ? first.text : ''
}

interface HomePageProps {
  onOpenArticle: (slug: string) => void
}

export function HomePage({ onOpenArticle }: HomePageProps) {
  const [pinned, setPinned] = useState<Article[]>([])
  const [recent, setRecent] = useState<Article[]>([])
  const [page, setPage]     = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFirst = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await articlesApi.list(1, 6)
      setPinned(res.pinned)
      setRecent(res.recent)
      setPage(1)
      setHasMore(res.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadFirst() }, [loadFirst])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const next = page + 1
      const res = await articlesApi.list(next, 6)
      setRecent((prev) => [...prev, ...res.recent])
      setPage(next)
      setHasMore(res.hasMore)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMore(false)
    }
  }

  const featured  = pinned.find((a) => a.pinPosition === 'left')         ?? recent[0] ?? null
  const secondary = [
    pinned.find((a) => a.pinPosition === 'right_top'),
    pinned.find((a) => a.pinPosition === 'right_bottom'),
  ].filter(Boolean) as Article[]

  // Fall back to recent articles when fewer than 2 pins exist on the right.
  if (secondary.length < 2) {
    const pinnedIds = new Set(pinned.map((p) => p.id))
    const featuredId = featured?.id
    const fillers = recent.filter((r) => !pinnedIds.has(r.id) && r.id !== featuredId)
    for (const f of fillers) {
      if (secondary.length >= 2) break
      secondary.push(f)
    }
  }

  const featuredId = featured?.id
  const secondaryIds = new Set(secondary.map((s) => s.id))
  const grid = recent.filter((a) => a.id !== featuredId && !secondaryIds.has(a.id))

  return (
    <main className={styles.page}>
      {/* ── Hero Section ───────────────────────────────── */}
      {loading ? (
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.featuredCard}><div className={styles.featuredImageWrap} style={{ background: 'var(--color-bg-white)' }} /></div>
            <aside className={styles.heroSidebar}>
              <div className={styles.secondaryCard}><div className={styles.secondaryImageWrap} style={{ background: 'var(--color-bg-white)' }} /></div>
              <div className={styles.secondaryCard}><div className={styles.secondaryImageWrap} style={{ background: 'var(--color-bg-white)' }} /></div>
            </aside>
          </div>
        </section>
      ) : featured ? (
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <article
              className={styles.featuredCard}
              onClick={() => onOpenArticle(featured.slug)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onOpenArticle(featured.slug)}
            >
              <div className={styles.featuredImageWrap}>
                <img
                  src={featured.heroImage ?? FALLBACK_IMAGE}
                  alt={featured.title}
                  className={styles.featuredImage}
                  onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                />
              </div>
              <div className={styles.featuredOverlay}>
                <span className={styles.featuredCategory}>· {featured.category?.name ?? 'Artigo'}</span>
                <h2 className={styles.featuredTitle}>{featured.title}</h2>
                <div className={styles.featuredMeta}>
                  <time>{formatDate(featured.publishedAt ?? featured.createdAt)}</time>
                  <span>·</span>
                  <span>{featured.readingTimeMin} min de leitura</span>
                </div>
              </div>
              <span className={styles.cardArrow}>↗</span>
            </article>

            <aside className={styles.heroSidebar}>
              {secondary.map((post) => (
                <article
                  key={post.id}
                  className={styles.secondaryCard}
                  onClick={() => onOpenArticle(post.slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onOpenArticle(post.slug)}
                >
                  <div className={styles.secondaryImageWrap}>
                    <img
                      src={post.heroImage ?? FALLBACK_IMAGE}
                      alt={post.title}
                      className={styles.secondaryImage}
                      onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                    />
                  </div>
                  <div className={styles.secondaryInfo}>
                    <span className={styles.secondaryCategory}>· {post.category?.name ?? 'Artigo'}</span>
                    <h3 className={styles.secondaryTitle}>{post.title}</h3>
                    <time className={styles.secondaryDate}>{formatDate(post.publishedAt ?? post.createdAt)}</time>
                  </div>
                  <span className={styles.cardArrowSm}>↗</span>
                </article>
              ))}
            </aside>
          </div>
        </section>
      ) : (
        <section className={styles.hero}>
          <div className={styles.heroInner} style={{ padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ width: '100%' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.75rem', color: 'var(--color-text-primary)', marginBottom: 8 }}>
                Nenhum artigo publicado ainda
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
                Clique em “Escrever” no topo para publicar o primeiro.
              </p>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div style={{
          maxWidth: 600, margin: '0 auto', padding: '12px 20px',
          background: '#FEF0F0', color: '#C0392B',
          border: '1px solid #F5CDC8', borderRadius: 10, fontSize: '0.8125rem',
        }}>
          {error}
        </div>
      )}

      {/* ── Section Divider ────────────────────────────── */}
      {grid.length > 0 && (
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderInner}>
            <h2 className={styles.sectionTitle}>Publicações recentes</h2>
            <div className={styles.sectionLine} />
          </div>
        </div>
      )}

      {/* ── Article Grid ───────────────────────────────── */}
      <section className={styles.grid}>
        <div className={styles.gridInner}>
          {grid.map((post) => (
            <article
              key={post.id}
              className={styles.gridCard}
              onClick={() => onOpenArticle(post.slug)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onOpenArticle(post.slug)}
            >
              <div className={styles.gridImageWrap}>
                <img
                  src={post.heroImage ?? FALLBACK_IMAGE}
                  alt={post.title}
                  className={styles.gridImage}
                  onError={(e) => (e.currentTarget.src = FALLBACK_IMAGE)}
                />
                <span className={styles.gridArrow}>↗</span>
              </div>
              <div className={styles.gridInfo}>
                <div className={styles.gridTop}>
                  <span className={styles.gridCategory}>· {post.category?.name ?? 'Artigo'}</span>
                  <time className={styles.gridDate}>{formatDate(post.publishedAt ?? post.createdAt)}</time>
                </div>
                <h3 className={styles.gridTitle}>{post.title}</h3>
                <p className={styles.gridExcerpt}>{excerptOf(post)}</p>
                <span className={styles.gridReadingTime}>{post.readingTimeMin} min de leitura</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {hasMore && (
        <div className={styles.loadMore}>
          <button
            className={styles.loadMoreBtn}
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Carregando…' : 'Ver mais artigos'}
          </button>
        </div>
      )}
    </main>
  )
}
