import { useState } from 'react'
import { useAuth } from '../auth'
import styles from './LoginPage.module.css'

interface LoginPageProps {
  onSuccess?: () => void
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email.trim(), password)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          Guandalini<span className={styles.dot}>.</span>
        </div>
        <h1 className={styles.title}>Bem-vindo</h1>
        <p className={styles.subtitle}>Entre para publicar e gerenciar artigos.</p>

        <form className={styles.form} onSubmit={submit}>
          <label className={styles.field}>
            <span className={styles.label}>E-mail</span>
            <input
              type="email"
              autoComplete="email"
              required
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.submit}
            disabled={loading || !email || !password}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className={styles.hint}>Acesso restrito ao editor-chefe.</p>
      </div>
    </div>
  )
}
