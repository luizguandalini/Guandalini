import type { ReactNode } from 'react'
import styles from './AdminLayout.module.css'

export type AdminTab = 'authors' | 'categories' | 'badges'

interface AdminLayoutProps {
  active:    AdminTab
  onNavigate: (tab: AdminTab) => void
  title:     string
  subtitle?: string
  children:  ReactNode
}

export function AdminLayout({ active, onNavigate, title, subtitle, children }: AdminLayoutProps) {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <aside className={styles.sidebar}>
          <span className={styles.sidebarLabel}>Administração</span>

          <nav className={styles.nav}>
            <button
              className={`${styles.navItem} ${active === 'authors' ? styles.active : ''}`}
              onClick={() => onNavigate('authors')}
            >
              Autores
            </button>
            <button
              className={`${styles.navItem} ${active === 'categories' ? styles.active : ''}`}
              onClick={() => onNavigate('categories')}
            >
              Categorias
            </button>
            <button
              className={`${styles.navItem} ${active === 'badges' ? styles.active : ''}`}
              onClick={() => onNavigate('badges')}
            >
              Badges de estilo
            </button>
          </nav>
        </aside>

        <section className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </header>

          {children}
        </section>
      </div>
    </main>
  )
}
