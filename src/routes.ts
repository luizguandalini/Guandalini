export type AppRoute =
  | { name: 'home' }
  | { name: 'article'; slug: string }
  | { name: 'editor'; id?: string }
  | { name: 'admin'; tab: 'articles' | 'authors' | 'categories' | 'badges' }
  | { name: 'login' }

const ARTICLE_PREFIX = '/noticia/'

function normalizePath(pathname: string): string {
  if (!pathname) return '/'
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
}

export function hrefForRoute(route: AppRoute): string {
  switch (route.name) {
    case 'home':
      return '/'
    case 'article':
      return `${ARTICLE_PREFIX}${encodeURIComponent(route.slug)}`
    case 'editor':
      return route.id ? `/editor/${route.id}` : '/editor'
    case 'admin':
      return `/admin/${route.tab}`
    case 'login':
      return '/login'
  }
}

export function routeFromLocation(location: Location): AppRoute {
  const path = normalizePath(location.pathname)

  if (path === '/') return { name: 'home' }
  if (path === '/login') return { name: 'login' }
  if (path === '/editor') return { name: 'editor' }

  if (path.startsWith('/editor/')) {
    const id = decodeURIComponent(path.slice('/editor/'.length))
    return id ? { name: 'editor', id } : { name: 'editor' }
  }

  if (path.startsWith('/admin/')) {
    const tab = path.slice('/admin/'.length)
    if (tab === 'articles' || tab === 'authors' || tab === 'categories' || tab === 'badges') {
      return { name: 'admin', tab }
    }
  }

  if (path.startsWith(ARTICLE_PREFIX)) {
    const slug = decodeURIComponent(path.slice(ARTICLE_PREFIX.length))
    if (slug) return { name: 'article', slug }
  }

  return { name: 'home' }
}
