import type { VercelRequest, VercelResponse } from '@vercel/node'
import { and, eq, lt, sql } from 'drizzle-orm'
import { SignJWT } from 'jose'
import { db } from '../db/client.js'
import { syncPairing, users } from '../db/schema.js'
import { verifyBearer } from './_lib/auth.js'

const CODE_TTL_MS = 10 * 60_000 // 10 minutes
const TOKEN_TTL = '30d'

function newPairingCode(): string {
  return Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')
}

async function gcExpired(): Promise<void> {
  try {
    await db.delete(syncPairing).where(lt(syncPairing.expiresAt, sql`now()`))
  } catch {
    /* best-effort */
  }
}

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

  const body = (req.body ?? {}) as { action?: unknown; code?: unknown }
  const action = typeof body.action === 'string' ? body.action : ''

  try {
    if (action === 'create') {
      // Only a signed-in user can mint a code; the code links to their account.
      const session = await verifyBearer(req)
      if (!session) {
        res.status(401).json({ error: 'unauthorized' })
        return
      }
      await gcExpired()

      let code = ''
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = newPairingCode()
        try {
          await db.insert(syncPairing).values({
            code: candidate,
            userId: session.userId,
            expiresAt: new Date(Date.now() + CODE_TTL_MS),
          })
          code = candidate
          break
        } catch {
          // PK collision — retry
        }
      }
      if (!code) {
        res.status(503).json({ error: 'could not allocate code' })
        return
      }
      res.status(200).json({ code, expiresInSec: Math.floor(CODE_TTL_MS / 1000) })
      return
    }

    if (action === 'redeem') {
      const code = typeof body.code === 'string' ? body.code.trim() : ''
      if (!/^\d{6}$/.test(code)) {
        res.status(400).json({ error: 'invalid code' })
        return
      }

      // Single-use, race-safe: delete-returning so two devices entering the same
      // code at once can't both succeed.
      const rows = await db
        .delete(syncPairing)
        .where(and(eq(syncPairing.code, code), sql`${syncPairing.expiresAt} > now()`))
        .returning({ userId: syncPairing.userId })
      if (rows.length === 0) {
        res.status(404).json({ error: 'expired or unknown code' })
        return
      }
      const userId = rows[0].userId

      // Look up the user's email so we can hand back a valid JWT for them.
      const u = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1)
      if (u.length === 0) {
        // Orphaned pairing row (e.g. user deleted their account). Treat as expired.
        res.status(404).json({ error: 'expired or unknown code' })
        return
      }
      const token = await signToken(userId, u[0].email)
      res.status(200).json({ userId, email: u[0].email, token })
      return
    }

    res.status(400).json({ error: 'unknown action' })
  } catch (err) {
    console.error('[api/pair]', err)
    res.status(500).json({ error: 'internal error' })
  }
}
