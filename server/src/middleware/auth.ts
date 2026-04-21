import jwt, { type SignOptions } from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import { config } from '../config.js'

export interface AuthPayload {
  sub:   string
  email: string
  name:  string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(
    payload,
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'] },
  )
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('Authorization') ?? ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
