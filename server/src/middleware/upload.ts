import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { mkdirSync } from 'node:fs'
import { config } from '../config.js'

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

mkdirSync(config.uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadsDir),
  filename:    (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase()
    const safe = ALLOWED_EXT.has(ext) ? ext : '.bin'
    cb(null, `${randomUUID()}${safe}`)
  },
})

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase()
    if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('Apenas imagens .jpg, .png ou .webp são permitidas'))
      return
    }
    cb(null, true)
  },
})
