import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// `.env.local` (where `vercel env pull` writes secrets, gitignored) takes precedence
// over a committed `.env`; dotenv doesn't override already-set vars, so load it first.
loadEnv({ path: '.env.local' })
loadEnv()

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
