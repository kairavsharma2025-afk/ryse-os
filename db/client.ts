import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL (or POSTGRES_URL) is not set. Install the Neon integration from the ' +
      'Vercel Marketplace, or set it locally in .env.local — see .env.example.'
  )
}

const sql = neon(connectionString)

export const db = drizzle(sql, { schema })
export { schema }
