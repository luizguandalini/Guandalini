import styles from './ArticlePost.module.css'

const article = {
  category: 'Inteligência Artificial',
  date: '21 de abril de 2026',
  readingTime: '8 min de leitura',
  style: 'Deep Dive',
  title: 'Como os modelos de linguagem estão redefinindo a forma como programamos',
  subtitle:
    'Da autocompleção ao pair programming com IA: uma análise honesta do que mudou, o que ficou pra trás e para onde estamos indo.',
  author: {
    name: 'Luiz Guandalini',
    role: 'Editor-chefe · Tecnologia',
    avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=luiz&backgroundColor=b8c9c0',
  },
  heroImage: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&q=80&auto=format&fit=crop',
  heroCaption: 'Ambiente de desenvolvimento moderno com múltiplas telas e ferramentas de IA integradas.',
  body: [
    {
      type: 'paragraph' as const,
      text: 'Há três anos, autocompletar uma linha de código com Tab já era considerado mágica. Hoje, desenvolvedores pedem para uma IA escrever funções inteiras, refatorar módulos legados e até sugerir arquiteturas de sistema — e ela obedece. Mas o que realmente mudou? E o que estamos perdendo nessa transição?',
    },
    {
      type: 'heading' as const,
      text: 'O antes e o depois do Copilot',
    },
    {
      type: 'paragraph' as const,
      text: 'Quando o GitHub Copilot foi lançado em 2021, a reação da comunidade foi dividida. Uma parte ficou animada; outra, paranóica com a ideia de que "a IA vai roubar meu emprego". Dois anos depois, ficou claro que nenhum dos dois extremos estava completamente certo.',
    },
    {
      type: 'pullquote' as const,
      text: '"A IA não substitui o programador — ela amplifica quem já sabe o que está fazendo e expõe quem não sabe."',
    },
    {
      type: 'paragraph' as const,
      text: 'O que os dados mostram é mais nuançado: desenvolvedores sênior se tornam significativamente mais produtivos. Desenvolvedores júnior, por outro lado, correm o risco de usar código gerado sem entendê-lo — criando uma camada de abstração perigosa entre o programador e o código que executa em produção.',
    },
    {
      type: 'image' as const,
      src: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=900&q=80&auto=format&fit=crop',
      caption: 'Código sendo gerado em tempo real por um assistente de IA no VS Code.',
    },
    {
      type: 'heading' as const,
      text: 'Além do autocomplete: o paradigma do agente',
    },
    {
      type: 'paragraph' as const,
      text: 'A geração atual vai além do autocomplete. Ferramentas como Cursor, Devin e os novos recursos de agentes do Claude estão começando a operar em loops autônomos: leem erros, buscam documentação, escrevem testes, corrigem o próprio código. É um passo qualitativo diferente.',
    },
    {
      type: 'paragraph' as const,
      text: 'Isso levanta questões sérias sobre revisão de código, ownership intelectual e segurança. Se um agente escreveu 80% do seu pull request, quem é responsável pelo bug que passou despercebido? A resposta ainda está sendo construída pela indústria — e pelas cortes.',
    },
    {
      type: 'heading' as const,
      text: 'O que os melhores times estão fazendo diferente',
    },
    {
      type: 'paragraph' as const,
      text: 'Times de engenharia de alto desempenho não tratam a IA como oráculo. Eles a tratam como um estagiário talentoso mas descuidado: útil para a geração inicial, obrigatório revisar tudo, nunca deixar sem supervisão em sistemas críticos.',
    },
    {
      type: 'paragraph' as const,
      text: 'O investimento real não está em qual ferramenta usar, mas em como estruturar o fluxo de trabalho ao redor delas: prompts padronizados por equipe, revisões focadas em lógica de negócio (não sintaxe), e uma cultura onde questionar o código gerado é encorajado, não visto como falta de confiança na ferramenta.',
    },
  ],
  tags: ['IA', 'Desenvolvimento', 'Produtividade', 'LLM', 'Engenharia'],
  relatedPosts: [
    {
      category: 'Tools',
      title: 'Cursor vs Copilot: qual IDE com IA vale mais em 2026?',
      date: '15 abr 2026',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80&auto=format&fit=crop',
    },
    {
      category: 'Deep Dive',
      title: 'RAG na prática: como conectar sua base de conhecimento a um LLM',
      date: '8 abr 2026',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80&auto=format&fit=crop',
    },
    {
      category: 'Opinião',
      title: 'O programador do futuro precisa aprender prompt engineering?',
      date: '2 abr 2026',
      image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80&auto=format&fit=crop',
    },
  ],
}

interface ArticlePostProps {
  onBack?: () => void
}

export function ArticlePost({ onBack }: ArticlePostProps) {
  return (
    <main className={styles.page}>
      {/* Social Share Sidebar */}
      <aside className={styles.socialShare}>
        <span className={styles.shareLabel}>Share</span>
        <button className={styles.shareBtn} aria-label="Compartilhar no WhatsApp">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
          </svg>
        </button>
        <button className={styles.shareBtn} aria-label="Compartilhar no Instagram">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
          </svg>
        </button>
        <button className={styles.shareBtn} aria-label="Compartilhar no LinkedIn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </button>
        <button className={styles.shareBtn} aria-label="Copiar link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>
      </aside>

      <article className={styles.article}>
        {/* Breadcrumb */}
        {onBack && (
          <button className={styles.backBtn} onClick={onBack}>
            ← Voltar
          </button>
        )}

        {/* Article Header */}
        <header className={styles.header}>
          <span className={styles.categoryBadge}>· {article.category}</span>
          <time className={styles.date}>{article.date}</time>
          <h1 className={styles.title}>{article.title}</h1>
          <p className={styles.subtitle}>{article.subtitle}</p>

          <div className={styles.meta}>
            <span className={styles.badge}>{article.readingTime}</span>
            <span className={styles.badge}>{article.style}</span>
          </div>

          {/* Author */}
          <div className={styles.author}>
            <img
              src={article.author.avatar}
              alt={article.author.name}
              className={styles.authorAvatar}
            />
            <div>
              <p className={styles.authorName}>{article.author.name}</p>
              <p className={styles.authorRole}>{article.author.role}</p>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        <figure className={styles.heroFigure}>
          <img
            src={article.heroImage}
            alt={article.heroCaption}
            className={styles.heroImage}
          />
          <figcaption className={styles.caption}>{article.heroCaption}</figcaption>
        </figure>

        {/* Body */}
        <div className={styles.body}>
          {article.body.map((block, i) => {
            if (block.type === 'paragraph') {
              return <p key={i} className={styles.paragraph}>{block.text}</p>
            }
            if (block.type === 'heading') {
              return <h2 key={i} className={styles.sectionHeading}>{block.text}</h2>
            }
            if (block.type === 'pullquote') {
              return (
                <blockquote key={i} className={styles.pullquote}>
                  {block.text}
                </blockquote>
              )
            }
            if (block.type === 'image') {
              return (
                <figure key={i} className={styles.inlineFigure}>
                  <img src={block.src} alt={block.caption} className={styles.inlineImage} />
                  <figcaption className={styles.caption}>{block.caption}</figcaption>
                </figure>
              )
            }
            return null
          })}
        </div>

        {/* Tags */}
        <div className={styles.tags}>
          {article.tags.map((tag) => (
            <span key={tag} className={styles.tag}>#{tag}</span>
          ))}
        </div>

        {/* Author Bio */}
        <div className={styles.authorBio}>
          <img
            src={article.author.avatar}
            alt={article.author.name}
            className={styles.authorBioAvatar}
          />
          <div className={styles.authorBioText}>
            <p className={styles.authorBioName}>{article.author.name}</p>
            <p className={styles.authorBioDesc}>
              Editor-chefe do Guandalini. Escreve sobre tecnologia e o que mais vier a calhar.
            </p>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      <section className={styles.related}>
        <div className={styles.relatedInner}>
          <h3 className={styles.relatedTitle}>Leia também</h3>
          <div className={styles.relatedGrid}>
            {article.relatedPosts.map((post, i) => (
              <a key={i} href="#" className={styles.relatedCard}>
                <div className={styles.relatedImageWrap}>
                  <img src={post.image} alt={post.title} className={styles.relatedImage} />
                  <span className={styles.relatedArrow}>↗</span>
                </div>
                <div className={styles.relatedInfo}>
                  <span className={styles.relatedCategory}>· {post.category}</span>
                  <p className={styles.relatedCardTitle}>{post.title}</p>
                  <time className={styles.relatedDate}>{post.date}</time>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Newsletter */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaAvatars}>
            {['ana', 'pedro', 'julia', 'marcos', 'carla'].map((seed) => (
              <img
                key={seed}
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=b8c9c0`}
                alt=""
                className={styles.ctaAvatar}
              />
            ))}
          </div>
          <h2 className={styles.ctaTitle}>
            Fique por dentro do que <em>realmente</em> importa em tech.
          </h2>
          <p className={styles.ctaSubtext}>
            Você abre sua caixa de e-mails enquanto toma seu café da manhã? Considere inserir seu endereço abaixo.
          </p>
          <form className={styles.ctaForm} onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Seu nome"
              className={styles.ctaInput}
            />
            <input
              type="email"
              placeholder="Seu e-mail"
              className={styles.ctaInput}
            />
            <button type="submit" className={styles.ctaButton}>
              Inscrever
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
