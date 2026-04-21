import { useState } from 'react'
import { Navbar } from './components/Navbar'
import { HomePage } from './components/HomePage'
import { ArticlePost } from './components/ArticlePost'
import { ArticleEditor } from './components/ArticleEditor'
import { Footer } from './components/Footer'

type Page = 'home' | 'article' | 'editor'

export default function App() {
  const [page, setPage] = useState<Page>('home')

  if (page === 'editor') {
    return <ArticleEditor onExit={() => setPage('home')} />
  }

  return (
    <>
      <Navbar
        onLogoClick={() => setPage('home')}
        onWriteClick={() => setPage('editor')}
      />
      {page === 'home' ? (
        <HomePage onOpenArticle={() => setPage('article')} />
      ) : (
        <ArticlePost onBack={() => setPage('home')} />
      )}
      <Footer />
    </>
  )
}
