import { useState, useEffect } from 'react'
import styles from './Navbar.module.css'

interface NavbarProps {
  onLogoClick?: () => void
  onWriteClick?: () => void
}

export function Navbar({ onLogoClick, onWriteClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
          <button className={styles.writeBtn} onClick={onWriteClick}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Escrever
          </button>
          <button className={styles.menuBtn}>Menu</button>
        </div>
      </div>
    </header>
  )
}
