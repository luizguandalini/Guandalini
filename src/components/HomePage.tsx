import styles from './HomePage.module.css'

interface Post {
  id: number
  category: string
  title: string
  excerpt: string
  date: string
  readingTime: string
  image: string
  featured?: boolean
}

const posts: Post[] = [
  {
    id: 1,
    category: 'Inteligência Artificial',
    title: 'Como os modelos de linguagem estão redefinindo a forma como programamos',
    excerpt:
      'Da autocompleção ao pair programming com IA: uma análise honesta do que mudou, o que ficou pra trás e para onde estamos indo.',
    date: '21 abr 2026',
    readingTime: '8 min',
    image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&q=80&auto=format&fit=crop',
    featured: true,
  },
  {
    id: 2,
    category: 'Tools',
    title: 'Cursor vs Copilot: qual IDE com IA vale mais em 2026?',
    excerpt:
      'Comparativo honesto entre as duas ferramentas que dominaram o mercado. Spoiler: a resposta depende do seu perfil.',
    date: '15 abr 2026',
    readingTime: '6 min',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 3,
    category: 'Deep Dive',
    title: 'RAG na prática: como conectar sua base de conhecimento a um LLM',
    excerpt:
      'Retrieval-Augmented Generation saiu do papel — veja como implementar do zero com exemplos reais.',
    date: '8 abr 2026',
    readingTime: '11 min',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 4,
    category: 'Opinião',
    title: 'O programador do futuro precisa aprender prompt engineering?',
    excerpt:
      'A habilidade mais subestimada de 2026 pode ser exatamente aquela que ninguém está ensinando direito.',
    date: '2 abr 2026',
    readingTime: '5 min',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 5,
    category: 'Hardware',
    title: 'Apple M4 Ultra: vale o upgrade ou é só marketing de geladeira?',
    excerpt:
      'Benchmarks reais, comparação com a geração anterior e a pergunta que ninguém responde: pra quem é esse chip?',
    date: '28 mar 2026',
    readingTime: '9 min',
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 6,
    category: 'Segurança',
    title: 'Zero trust na prática: o que realmente muda na sua infraestrutura',
    excerpt:
      'Todo mundo fala em zero trust, mas poucos explicam o que isso significa de verdade no dia a dia de um time de engenharia.',
    date: '22 mar 2026',
    readingTime: '7 min',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 7,
    category: 'Carreira',
    title: 'Como negociei um aumento de 40% sem trocar de empresa',
    excerpt:
      'O processo levou 4 meses, duas conversas difíceis e uma planilha bem montada. Aqui está tudo que funcionou.',
    date: '15 mar 2026',
    readingTime: '6 min',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80&auto=format&fit=crop',
  },
]

interface HomePageProps {
  onOpenArticle: () => void
}

export function HomePage({ onOpenArticle }: HomePageProps) {
  const featured = posts.find((p) => p.featured)!
  const secondary = posts.filter((p) => !p.featured).slice(0, 2)
  const grid = posts.filter((p) => !p.featured).slice(2)

  return (
    <main className={styles.page}>
      {/* ── Hero Section ───────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          {/* Featured large card */}
          <article
            className={styles.featuredCard}
            onClick={onOpenArticle}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onOpenArticle()}
          >
            <div className={styles.featuredImageWrap}>
              <img src={featured.image} alt={featured.title} className={styles.featuredImage} />
            </div>
            <div className={styles.featuredOverlay}>
              <span className={styles.featuredCategory}>· {featured.category}</span>
              <h2 className={styles.featuredTitle}>{featured.title}</h2>
              <div className={styles.featuredMeta}>
                <time>{featured.date}</time>
                <span>·</span>
                <span>{featured.readingTime} de leitura</span>
              </div>
            </div>
            <span className={styles.cardArrow}>↗</span>
          </article>

          {/* Secondary cards sidebar */}
          <aside className={styles.heroSidebar}>
            {secondary.map((post) => (
              <article
                key={post.id}
                className={styles.secondaryCard}
                onClick={onOpenArticle}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onOpenArticle()}
              >
                <div className={styles.secondaryImageWrap}>
                  <img src={post.image} alt={post.title} className={styles.secondaryImage} />
                </div>
                <div className={styles.secondaryInfo}>
                  <span className={styles.secondaryCategory}>· {post.category}</span>
                  <h3 className={styles.secondaryTitle}>{post.title}</h3>
                  <time className={styles.secondaryDate}>{post.date}</time>
                </div>
                <span className={styles.cardArrowSm}>↗</span>
              </article>
            ))}
          </aside>
        </div>
      </section>

      {/* ── Section Divider ────────────────────────────── */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeaderInner}>
          <h2 className={styles.sectionTitle}>Publicações recentes</h2>
          <div className={styles.sectionLine} />
        </div>
      </div>

      {/* ── Article Grid ───────────────────────────────── */}
      <section className={styles.grid}>
        <div className={styles.gridInner}>
          {grid.map((post) => (
            <article
              key={post.id}
              className={styles.gridCard}
              onClick={onOpenArticle}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onOpenArticle()}
            >
              <div className={styles.gridImageWrap}>
                <img src={post.image} alt={post.title} className={styles.gridImage} />
                <span className={styles.gridArrow}>↗</span>
              </div>
              <div className={styles.gridInfo}>
                <div className={styles.gridTop}>
                  <span className={styles.gridCategory}>· {post.category}</span>
                  <time className={styles.gridDate}>{post.date}</time>
                </div>
                <h3 className={styles.gridTitle}>{post.title}</h3>
                <p className={styles.gridExcerpt}>{post.excerpt}</p>
                <span className={styles.gridReadingTime}>{post.readingTime} de leitura</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Load More ──────────────────────────────────── */}
      <div className={styles.loadMore}>
        <button className={styles.loadMoreBtn}>Ver mais artigos</button>
      </div>
    </main>
  )
}
