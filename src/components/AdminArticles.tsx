import { FormEvent, useCallback, useEffect, useState } from 'react'
import { ApiError, articlesApi } from '../api'
import { hrefForRoute } from '../routes'
import type { Article } from '../types'
import styles from './AdminArticles.module.css'

interface AdminArticlesProps {
  onEdit: (id: string) => void
}

const PAGE_SIZE = 10

const STATUS_LABELS = {
  published: 'Publicado',
  draft: 'Rascunho',
  archived: 'Arquivado',
} as const

const formatDate = (value: string | null): string => {
  if (!value) return 'Sem data'
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminArticles({ onEdit }: AdminArticlesProps) {
  const [items, setItems] = useState<Article[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (nextPage: number, nextQuery: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await articlesApi.adminList(nextPage, PAGE_SIZE, nextQuery)
      setItems(res.items)
      setTotal(res.total)
      setHasMore(res.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar artigos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(page, query)
  }, [load, page, query])

  const reloadCurrentPage = async () => {
    await load(page, query)
  }

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setQuery(queryInput.trim())
  }

  const changeStatus = async (article: Article, status: 'published' | 'archived') => {
    const action = status === 'archived' ? 'arquivar' : 'restaurar'
    if (!window.confirm(`Deseja ${action} o artigo "${article.title}"?`)) return

    setBusyId(article.id)
    try {
      await articlesApi.setStatus(article.id, status)
      await reloadCurrentPage()
    } catch (err) {
      alert(err instanceof Error ? err.message : `Nao foi possivel ${action} o artigo`)
    } finally {
      setBusyId(null)
    }
  }

  const removeArticle = async (article: Article) => {
    if (!window.confirm(`Excluir permanentemente "${article.title}"? Essa acao nao pode ser desfeita.`)) return

    setBusyId(article.id)
    try {
      await articlesApi.remove(article.id)
      if (items.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await reloadCurrentPage()
      }
    } catch (err) {
      const message = err instanceof ApiError && err.status === 404
        ? 'O artigo ja nao existe mais.'
        : err instanceof Error
          ? err.message
          : 'Nao foi possivel excluir o artigo'
      alert(message)
      await reloadCurrentPage()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className={styles.panel}>
      <form className={styles.searchBar} onSubmit={onSearch}>
        <input
          className={styles.searchInput}
          type="text"
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          placeholder="Cole a URL do artigo ou informe o slug"
        />
        <button className={styles.primaryBtn} type="submit">
          Buscar
        </button>
      </form>

      <div className={styles.toolbar}>
        <p className={styles.summary}>
          {query ? `Resultado para "${query}"` : 'Artigos mais recentes primeiro'}
        </p>
        <span className={styles.counter}>
          {total} artigo{total === 1 ? '' : 's'}
        </span>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}>Carregando artigos...</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>Nenhum artigo encontrado.</div>
        ) : (
          items.map((article) => {
            const publishedUrl = hrefForRoute({ name: 'article', slug: article.slug })
            const isBusy = busyId === article.id

            return (
              <article key={article.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.meta}>
                    <span className={`${styles.status} ${styles[`status_${article.status}`]}`}>
                      {STATUS_LABELS[article.status]}
                    </span>
                    <span className={styles.slug}>/{article.slug}</span>
                  </div>
                  <a className={styles.link} href={publishedUrl} target="_blank" rel="noreferrer">
                    Abrir
                  </a>
                </div>

                <h3 className={styles.title}>{article.title}</h3>
                {article.subtitle && <p className={styles.subtitle}>{article.subtitle}</p>}

                <div className={styles.infoRow}>
                  <span>{article.category?.name ?? 'Sem categoria'}</span>
                  <span>{article.author?.name ?? 'Sem autor'}</span>
                  <span>{formatDate(article.publishedAt ?? article.createdAt)}</span>
                </div>

                <div className={styles.actions}>
                  <button className={styles.actionBtn} onClick={() => onEdit(article.id)} disabled={isBusy}>
                    Editar
                  </button>
                  {article.status === 'archived' ? (
                    <button
                      className={styles.actionBtn}
                      onClick={() => { void changeStatus(article, 'published') }}
                      disabled={isBusy}
                    >
                      Restaurar
                    </button>
                  ) : (
                    <button
                      className={styles.actionBtn}
                      onClick={() => { void changeStatus(article, 'archived') }}
                      disabled={isBusy}
                    >
                      Arquivar
                    </button>
                  )}
                  <button
                    className={`${styles.actionBtn} ${styles.dangerBtn}`}
                    onClick={() => { void removeArticle(article) }}
                    disabled={isBusy}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>

      <div className={styles.pagination}>
        <button
          className={styles.pageBtn}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page === 1 || loading}
        >
          Anterior
        </button>
        <span className={styles.pageLabel}>Pagina {page}</span>
        <button
          className={styles.pageBtn}
          onClick={() => setPage((current) => current + 1)}
          disabled={!hasMore || loading}
        >
          Proxima
        </button>
      </div>
    </section>
  )
}
