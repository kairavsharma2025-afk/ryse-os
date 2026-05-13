import type { VercelRequest, VercelResponse } from '@vercel/node'
import { and, eq, lt, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '../db/client'
import { syncPairing } from '../db/schema'

const CODE_TTL_MS = 10 * 60_000 // 10 minutes

function newPairingCode(): string {
  // 6-digit zero-padded numeric code, easy to read aloud.
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0')
}

async function gcExpired(): Promise<void> {
  try {
    await db.delete(syncPairing).where(lt(syncPairing.expiresAt, sql`now()`))
  } catch {
    /* best-effort */
  }
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

  const body = (req.body ?? {}) as { action?: unknown; code?: unknown; userId?: unknown }
  const action = typeof body.action === 'string' ? body.action : ''

  try {
    if (action === 'create') {
      await gcExpired()

      // If the caller already has a user_id (they're sharing it from device A),
      // reuse it; otherwise mint a fresh one.
      const incomingUserId = typeof body.userId === 'string' ? body.userId.trim().toLowerCase() : ''
      const userId =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(incomingUserId)
          ? incomingUserId
          : randomUUID()

      // Tiny collision-retry loop on the 6-digit code.
      let code = ''
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = newPairingCode()
        try {
          await db.insert(syncPairing).values({
            code: candidate,
            userId,
            expiresAt: new Date(Date.now() + CODE_TTL_MS),
          })
          code = candidate
          break
        } catch {
          // PK collision — try again
        }
      }
      if (!code) {
        res.status(503).json({ error: 'could not allocate code' })
        return
      }

      res.status(200).json({ code, userId, expiresInSec: Math.floor(CODE_TTL_MS / 1000) })
      return
    }

    if (action === 'redeem') {
      const code = typeof body.code === 'string' ? body.code.trim() : ''
      if (!/^\d{6}$/.test(code)) {
        res.status(400).json({ error: 'invalid code' })
        return
      }

      // Single-use: read the live row, then delete it. Use a delete-returning so
      // there's no race between two devices entering the same code at once.
      const rows = await db
        .delete(syncPairing)
        .where(and(eq(syncPairing.code, code), sql`${syncPairing.expiresAt} > now()`))
        .returning({ userId: syncPairing.userId })

      if (rows.length === 0) {
        res.status(404).json({ error: 'expired or unknown code' })
        return
      }
      res.status(200).json({ userId: rows[0].userId })
      return
    }

    res.status(400).json({ error: 'unknown action' })
  } catch (err) {
    console.error('[api/pair]', err)
    res.status(500).json({ error: 'internal error' })
  }
}
