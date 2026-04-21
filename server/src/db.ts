import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

export const pool = new Pool({
  host:     config.db.host,
  port:     config.db.port,
  user:     config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 10,
})

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params as never)
}

export async function waitForDb(maxRetries = 20, delayMs = 1000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await pool.query('SELECT 1')
      return
    } catch {
      console.log(`[db] waiting for database… (${i + 1}/${maxRetries})`)
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
  throw new Error('Database never became available')
}
