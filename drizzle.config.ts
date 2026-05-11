import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL

if (!url) {
  throw new Error(
    'DATABASE_URL (or POSTGRES_URL) is not set. Add it to .env.local — see .env.example.'
  )
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
})
