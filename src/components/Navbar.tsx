import { useState, useEffect } from 'react'
import styles from './Navbar.module.css'

interface NavbarProps {
  onLogoClick?: () => void
}

export function Navbar({ onLogoClick }: NavbarProps) {
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
          <button className={styles.menuBtn}>Menu</button>
        </div>
      </div>
    </header>
  )
}
