import { useState } from 'react'
import { Navbar } from './components/Navbar'
import { HomePage } from './components/HomePage'
import { ArticlePost } from './components/ArticlePost'
import { Footer } from './components/Footer'

type Page = 'home' | 'article'

export default function App() {
  const [page, setPage] = useState<Page>('home')

  return (
    <>
      <Navbar onLogoClick={() => setPage('home')} />
      {page === 'home' ? (
        <HomePage onOpenArticle={() => setPage('article')} />
      ) : (
        <ArticlePost onBack={() => setPage('home')} />
      )}
      <Footer />
    </>
  )
}
