import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <span className={styles.logo}>
              Guandalini<span className={styles.dot}>.</span>
            </span>
            <p className={styles.tagline}>
              Tecnologia com profundidade.
            </p>
          </div>

          <nav className={styles.links}>
            <div className={styles.linkGroup}>
              <span className={styles.groupLabel}>Conteúdo</span>
              <a href="#">Tecnologia</a>
              <a href="#">Reviews</a>
              <a href="#">Tutoriais</a>
              <a href="#">Opinião</a>
            </div>
            <div className={styles.linkGroup}>
              <span className={styles.groupLabel}>Blog</span>
              <a href="#">Sobre</a>
            </div>
          </nav>
        </div>

        <div className={styles.bottom}>
          <span className={styles.copy}>© 2026 Guandalini. Todos os direitos reservados.</span>
          <div className={styles.social}>
            <a href="https://www.linkedin.com/in/luizguandalini/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
