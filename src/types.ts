export interface User {
  id:        string
  email:     string
  name:      string
  role:      string
  avatarUrl: string | null
}

export interface AvatarCrop {
  x:     number   // horizontal offset in percent (-50..50, 0 = centered)
  y:     number
  scale: number   // 1..3
}

export interface Author {
  id:         string
  name:       string
  role:       string
  avatarUrl:  string
  avatarType: 'upload' | 'dicebear'
  avatarCrop: AvatarCrop | null
  createdAt:  string
}

export interface Category { id: string; name: string; createdAt: string }
export interface Badge    { id: string; name: string; createdAt: string }

export type BlockType = 'paragraph' | 'heading' | 'pullquote' | 'image'

export interface ParagraphBlock { type: 'paragraph'; text: string }
export interface HeadingBlock   { type: 'heading';   text: string }
export interface PullquoteBlock { type: 'pullquote'; text: string }
export interface ImageBlock     { type: 'image';     src: string; caption: string }
export type ArticleBlock = ParagraphBlock | HeadingBlock | PullquoteBlock | ImageBlock

export type PinPosition = 'left' | 'right_top' | 'right_bottom'

export interface Article {
  id:             string
  title:          string
  subtitle:       string | null
  readingTimeMin: number
  heroImage:      string | null
  heroCaption:    string | null
  body:           ArticleBlock[]
  status:         'draft' | 'published'
  pinPosition:    PinPosition | null
  publishedAt:    string | null
  createdAt:      string
  updatedAt:      string
  category:       { id: string; name: string } | null
  badge:          { id: string; name: string } | null
  author:         Author | null
}

export interface Paginated<T> {
  items:   T[]
  page:    number
  limit:   number
  total:   number
  hasMore: boolean
}

export interface ArticleList {
  pinned:  Article[]
  recent:  Article[]
  page:    number
  limit:   number
  total:   number
  hasMore: boolean
}
