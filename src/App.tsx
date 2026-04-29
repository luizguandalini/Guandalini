import { useEffect, useState } from 'react'
import { Navbar } from './components/Navbar'
import { HomePage } from './components/HomePage'
import { ArticlePost } from './components/ArticlePost'
import { ArticleEditor } from './components/ArticleEditor'
import { Footer } from './components/Footer'
import { LoginPage } from './components/LoginPage'
import { AdminLayout } from './components/AdminLayout'
import { AdminAuthors } from './components/AdminAuthors'
import { AdminNameList } from './components/AdminNameList'
import { badgesApi, categoriesApi } from './api'
import { useAuth } from './auth'
import { hrefForRoute, routeFromLocation, type AppRoute } from './routes'

export default function App() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState<AppRoute>(() => routeFromLocation(window.location))

  useEffect(() => {
    const onPopState = () => setPage(routeFromLocation(window.location))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const go = (p: AppRoute) => {
    const nextHref = hrefForRoute(p)
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (nextHref !== currentHref) {
      window.history.pushState(null, '', nextHref)
    }
    setPage(p)
  }
  const protectedPage = page.name === 'editor' || page.name === 'admin'

  // ── Global splash while we check the token ──
  if (loading && protectedPage) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-bg)',
        color: 'var(--color-text-secondary)',
        fontSize: '0.875rem',
      }}>
        Carregando…
      </div>
    )
  }

  // ── Not authenticated → login screen ──
  if (protectedPage && !user) {
    return <LoginPage />
  }

  if (page.name === 'login') {
    return <LoginPage onSuccess={() => go({ name: 'home' })} />
  }

  // Editor is full-screen (no navbar/footer)
  if (page.name === 'editor') {
    return (
      <ArticleEditor
        onExit={() => go({ name: 'home' })}
        onPublished={(article) => go({ name: 'article', slug: article.slug })}
        articleId={page.id}
      />
    )
  }

  return (
    <>
      <Navbar
        onLogoClick={() => go({ name: 'home' })}
        onWriteClick={() => go({ name: 'editor' })}
        onAdminClick={() => go({ name: 'admin', tab: 'authors' })}
        onLoginClick={() => go({ name: 'login' })}
      />

      {page.name === 'home' && (
        <HomePage onOpenArticle={(slug) => go({ name: 'article', slug })} />
      )}

      {page.name === 'article' && (
        <ArticlePost
          articleSlug={page.slug}
          onBack={() => go({ name: 'home' })}
          onOpenOther={(slug) => go({ name: 'article', slug })}
          onEdit={(id) => go({ name: 'editor', id })}
        />
      )}

      {page.name === 'admin' && (
        <AdminLayout
          active={page.tab}
          onNavigate={(tab) => go({ name: 'admin', tab })}
          title={
            page.tab === 'authors'    ? 'Autores' :
            page.tab === 'categories' ? 'Categorias' :
                                        'Badges de estilo'
          }
          subtitle={
            page.tab === 'authors'
              ? 'Gerencie autores reais ou fictícios. Selecione-os no editor ao publicar um artigo.'
              : page.tab === 'categories'
                ? 'Categorias para classificar os artigos.'
                : 'Etiquetas rápidas, ex: "Deep Dive", "Opinião", "Tutorial".'
          }
        >
          {page.tab === 'authors'    && <AdminAuthors />}
          {page.tab === 'categories' && (
            <AdminNameList
              load={categoriesApi.list}
              create={categoriesApi.create}
              update={categoriesApi.update}
              remove={categoriesApi.remove}
              singular="categoria"
              maxLength={60}
              placeholder="Nova categoria…"
            />
          )}
          {page.tab === 'badges' && (
            <AdminNameList
              load={badgesApi.list}
              create={badgesApi.create}
              update={badgesApi.update}
              remove={badgesApi.remove}
              singular="badge"
              maxLength={60}
              placeholder="Nova badge…"
            />
          )}
        </AdminLayout>
      )}

      <Footer />
    </>
  )
}
