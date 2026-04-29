import type {
  AdminArticleList,
  Article,
  ArticleList,
  Author,
  Badge,
  Category,
  Paginated,
  PinPosition,
  User,
} from './types'

const TOKEN_KEY = 'guandalini.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(path, { ...init, headers })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const data = await res.json()
      if (data?.error) message = data.error
    } catch { /* ignore */ }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>('/api/auth/me'),
}

// ── Authors ───────────────────────────────────────────

export const authorsApi = {
  list: (page = 1, limit = 10) =>
    request<Paginated<Author>>(`/api/authors?page=${page}&limit=${limit}`),

  create: (form: FormData) =>
    request<Author>('/api/authors', { method: 'POST', body: form }),

  update: (id: string, form: FormData) =>
    request<Author>(`/api/authors/${id}`, { method: 'PATCH', body: form }),

  remove: (id: string) =>
    request<{ ok: true }>(`/api/authors/${id}`, { method: 'DELETE' }),
}

// ── Categories ────────────────────────────────────────

export const categoriesApi = {
  list: () => request<{ items: Category[] }>('/api/categories'),
  create: (name: string) => request<Category>('/api/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  update: (id: string, name: string) => request<Category>(`/api/categories/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  remove: (id: string) => request<{ ok: true }>(`/api/categories/${id}`, { method: 'DELETE' }),
}

// ── Badges ────────────────────────────────────────────

export const badgesApi = {
  list: () => request<{ items: Badge[] }>('/api/badges'),
  create: (name: string) => request<Badge>('/api/badges', { method: 'POST', body: JSON.stringify({ name }) }),
  update: (id: string, name: string) => request<Badge>(`/api/badges/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  remove: (id: string) => request<{ ok: true }>(`/api/badges/${id}`, { method: 'DELETE' }),
}

// ── Articles ──────────────────────────────────────────

export interface ArticlePayload {
  title:          string
  subtitle:       string | null
  categoryId:    string | null
  authorId:      string | null
  badgeId:       string | null
  readingTimeMin: number
  heroImage:     string | null
  heroCaption:   string | null
  body:          Article['body']
  status:        'draft' | 'published' | 'archived'
}

export const articlesApi = {
  list: (page = 1, limit = 9) =>
    request<ArticleList>(`/api/articles?page=${page}&limit=${limit}`),

  get: (id: string) => request<Article>(`/api/articles/${id}`),

  getBySlug: (slug: string) => request<Article>(`/api/articles/slug/${encodeURIComponent(slug)}`),

  adminList: (page = 1, limit = 10, q = '') =>
    request<AdminArticleList>(`/api/articles/admin?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`),

  create: (payload: ArticlePayload) =>
    request<Article>('/api/articles', { method: 'POST', body: JSON.stringify(payload) }),

  update: (id: string, payload: Partial<ArticlePayload>) =>
    request<Article>(`/api/articles/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  pin: (id: string, position: PinPosition | null) =>
    request<Article>(`/api/articles/${id}/pin`, {
      method: 'PATCH',
      body: JSON.stringify({ position }),
    }),

  setStatus: (id: string, status: ArticlePayload['status']) =>
    request<Article>(`/api/articles/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  remove: (id: string) => request<{ ok: true }>(`/api/articles/${id}`, { method: 'DELETE' }),
}
