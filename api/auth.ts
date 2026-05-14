import type { VercelRequest, VercelResponse } from '@vercel/node'
import { eq, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { verifyBearer } from './_lib/auth.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MIN_PASSWORD = 8
const TOKEN_TTL = '30d'

function authSecret(): Uint8Array {
  const v = process.env.AUTH_SECRET
  if (!v || v.length < 32) {
    throw new Error('AUTH_SECRET env var is missing or shorter than 32 chars')
  }
  return new TextEncoder().encode(v)
}

async function signToken(userId: string, email: string): Promise<string> {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(authSecret())
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  const body = (req.body ?? {}) as {
    action?: unknown
    email?: unknown
    password?: unknown
    claimUserId?: unknown
  }
  const action = typeof body.action === 'string' ? body.action : ''

  try {
    if (action === 'signup') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = typeof body.password === 'string' ? body.password : ''
      if (!EMAIL_RE.test(email)) {
        res.status(400).json({ error: 'Please enter a valid email.' })
        return
      }
      if (password.length < MIN_PASSWORD) {
        res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters.` })
        return
      }

      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.email}) = ${email}`)
        .limit(1)
      if (existing.length > 0) {
        res.status(409).json({ error: 'An account with that email already exists. Sign in instead.' })
        return
      }

      // If the caller is migrating from a pairing-code device, attach the new
      // account to their existing user_id so all of their stored data carries
      // over. Refuse if that id is already claimed by another account.
      const claim = typeof body.claimUserId === 'string' ? body.claimUserId.trim().toLowerCase() : ''
      let userId = randomUUID()
      if (UUID_V4.test(claim)) {
        const claimed = await db.select({ id: users.id }).from(users).where(eq(users.id, claim)).limit(1)
        if (claimed.length === 0) userId = claim
      }

      const passwordHash = await bcrypt.hash(password, 10)
      await db.insert(users).values({ id: userId, email, passwordHash })
      const token = await signToken(userId, email)
      res.status(200).json({ userId, email, token })
      return
    }

    if (action === 'signin') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = typeof body.password === 'string' ? body.password : ''
      if (!email || !password) {
        res.status(400).json({ error: 'Enter your email and password.' })
        return
      }
      const row = await db
        .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
        .from(users)
        .where(sql`lower(${users.email}) = ${email}`)
        .limit(1)
      const user = row[0]
      // Same response shape on missing user or bad password — don't leak which.
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        res.status(401).json({ error: 'Wrong email or password.' })
        return
      }
      const token = await signToken(user.id, user.email)
      res.status(200).json({ userId: user.id, email: user.email, token })
      return
    }

    if (action === 'signout') {
      // Stateless JWT — the client discards the token. Nothing to do server-side.
      res.status(200).json({ ok: true })
      return
    }

    if (action === 'me') {
      const session = await verifyBearer(req)
      if (!session) {
        res.status(401).json({ error: 'unauthorized' })
        return
      }
      res.status(200).json({ userId: session.userId, email: session.email })
      return
    }

    res.status(400).json({ error: 'unknown action' })
  } catch (err) {
    console.error('[api/auth]', err)
    res.status(500).json({ error: 'internal error' })
  }
}
