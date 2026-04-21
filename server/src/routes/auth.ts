import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcrypt'
import { query } from '../db.js'
import { signToken, requireAuth } from '../middleware/auth.js'
import { sanitizeText, LIMITS, httpError, isHttpError } from '../middleware/validate.js'

export const authRouter = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

authRouter.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = sanitizeText(req.body?.email, LIMITS.email).toLowerCase()
    const password = typeof req.body?.password === 'string' ? req.body.password : ''

    if (!email || !password) {
      throw httpError(400, 'Email e senha são obrigatórios')
    }
    if (password.length > LIMITS.password) {
      throw httpError(400, 'Senha muito longa')
    }

    const { rows } = await query<{
      id: string; email: string; password_hash: string; name: string; role: string; avatar_url: string | null
    }>('SELECT id, email, password_hash, name, role, avatar_url FROM users WHERE email = $1', [email])

    const user = rows[0]
    if (!user) {
      throw httpError(401, 'Credenciais inválidas')
    }

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      throw httpError(401, 'Credenciais inválidas')
    }

    const token = signToken({ sub: user.id, email: user.email, name: user.name })

    res.json({
      token,
      user: {
        id:        user.id,
        email:     user.email,
        name:      user.name,
        role:      user.role,
        avatarUrl: user.avatar_url,
      },
    })
  } catch (err) {
    if (isHttpError(err)) {
      res.status(err.statusCode).json({ error: err.message })
    } else {
      console.error(err)
      res.status(500).json({ error: 'Erro interno' })
    }
  }
})

authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await query<{
      id: string; email: string; name: string; role: string; avatar_url: string | null
    }>('SELECT id, email, name, role, avatar_url FROM users WHERE id = $1', [req.user!.sub])

    const user = rows[0]
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' })
      return
    }

    res.json({
      id:        user.id,
      email:     user.email,
      name:      user.name,
      role:      user.role,
      avatarUrl: user.avatar_url,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro interno' })
  }
})
