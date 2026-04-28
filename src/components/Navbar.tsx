import { useState, useEffect, useRef } from 'react'
import styles from './Navbar.module.css'
import { useAuth } from '../auth'
import { Avatar } from './Avatar'

interface NavbarProps {
  onLogoClick?:  () => void
  onWriteClick?: () => void
  onAdminClick?: () => void
  onLoginClick?: () => void
}

export function Navbar({ onLogoClick, onWriteClick, onAdminClick, onLoginClick }: NavbarProps) {
  const { user, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  const avatarUrl = user?.avatarUrl
    ?? `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(user?.name ?? 'luiz')}&backgroundColor=b8c9c0`

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <button className={styles.logo} onClick={onLogoClick}>
          Guandalini<span className={styles.logoDot}>.</span>
        </button>

        <nav className={styles.nav}>
          <a href="#" className={styles.navLink}>Tecnologia</a>
          <a href="#" className={styles.navLink}>Reviews</a>
          <a href="#" className={styles.navLink}>Tutoriais</a>
          <a href="#" className={styles.navLink}>Sobre</a>
        </nav>

        <div className={styles.actions}>
          <button className={styles.searchBtn} aria-label="Buscar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {user ? (
            <button className={styles.writeBtn} onClick={onWriteClick}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Escrever
            </button>
          ) : (
            <button className={styles.writeBtn} onClick={onLoginClick}>
              Entrar
            </button>
          )}

          {user && (
            <div className={styles.userMenu} ref={menuRef}>
              <button
                className={styles.userBtn}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Conta"
              >
                <Avatar src={avatarUrl} name={user.name} size={32} />
              </button>

              {menuOpen && (
                <div className={styles.menu}>
                  <div className={styles.menuHeader}>
                    <span className={styles.menuName}>{user.name}</span>
                    <span className={styles.menuRole}>{user.role}</span>
                  </div>
                  <button
                    className={styles.menuItem}
                    onClick={() => { setMenuOpen(false); onAdminClick?.() }}
                  >
                    Painel administrativo
                  </button>
                  <button
                    className={styles.menuItem}
                    onClick={() => { setMenuOpen(false); logout() }}
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
