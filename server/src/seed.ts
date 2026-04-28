import bcrypt from 'bcryptjs'
import { query } from './db.js'
import { config } from './config.js'

export async function seedAdmin(): Promise<void> {
  const { rows } = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users')
  const count = Number(rows[0]?.count ?? 0)

  if (count > 0) {
    console.log('[seed] admin user already exists — skipping')
    return
  }

  const hash = await bcrypt.hash(config.admin.password, 12)
  const avatar = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(config.admin.name)}&backgroundColor=b8c9c0`

  await query(
    `INSERT INTO users (email, password_hash, name, role, avatar_url)
     VALUES ($1, $2, $3, $4, $5)`,
    [config.admin.email, hash, config.admin.name, config.admin.role, avatar],
  )

  console.log(`[seed] admin created for ${config.admin.email}`)
}
