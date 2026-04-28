import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { mkdirSync } from 'node:fs'
import { readFile, unlink } from 'node:fs/promises'
import type { Request, Response, NextFunction } from 'express'
import { config } from '../config.js'
import { httpError } from './validate.js'

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
      cb(httpError(400, 'Apenas imagens .jpg, .png ou .webp sao permitidas'))
      return
    }
    cb(null, true)
  },
})

function hasAllowedImageSignature(bytes: Buffer): boolean {
  const isJpeg = bytes.length >= 3
    && bytes[0] === 0xff
    && bytes[1] === 0xd8
    && bytes[2] === 0xff

  const isPng = bytes.length >= 8
    && bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4e
    && bytes[3] === 0x47
    && bytes[4] === 0x0d
    && bytes[5] === 0x0a
    && bytes[6] === 0x1a
    && bytes[7] === 0x0a

  const isWebp = bytes.length >= 12
    && bytes.toString('ascii', 0, 4) === 'RIFF'
    && bytes.toString('ascii', 8, 12) === 'WEBP'

  return isJpeg || isPng || isWebp
}

export async function verifyUploadedImage(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.file) {
    next()
    return
  }

  try {
    const bytes = await readFile(req.file.path)
    if (!hasAllowedImageSignature(bytes)) {
      await unlink(req.file.path).catch(() => undefined)
      next(httpError(400, 'Arquivo enviado nao parece ser uma imagem valida'))
      return
    }
    next()
  } catch (err) {
    await unlink(req.file.path).catch(() => undefined)
    next(err)
  }
}
