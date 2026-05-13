import type { VercelRequest, VercelResponse } from '@vercel/node'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { userState } from '../db/schema.js'
import { getUserId } from './_lib/auth.js'

const MAX_KEYS_PER_REQUEST = 64
const MAX_KEY_LENGTH = 128

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  return new Date(String(value)).toISOString()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers are applied by vercel.json; just short-circuit the preflight.
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  const userId = await getUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }

  try {
    if (req.method === 'GET') {
      const rows = await db
        .select({
          storeKey: userState.storeKey,
          data: userState.data,
          revision: userState.revision,
          updatedAt: userState.updatedAt,
        })
        .from(userState)
        .where(eq(userState.userId, userId))

      const stores: Record<string, { data: unknown; revision: number; updatedAt: string }> = {}
      for (const r of rows) {
        stores[r.storeKey] = { data: r.data, revision: r.revision, updatedAt: iso(r.updatedAt) }
      }
      res.status(200).json({ stores })
      return
    }

    if (req.method === 'PUT') {
      const body = (req.body ?? {}) as { updates?: unknown }
      const updates = Array.isArray(body.updates) ? body.updates : []
      const clean = updates
        .filter(
          (u): u is { storeKey: string; data: unknown } =>
            !!u &&
            typeof (u as { storeKey?: unknown }).storeKey === 'string' &&
            (u as { storeKey: string }).storeKey.length > 0 &&
            (u as { storeKey: string }).storeKey.length <= MAX_KEY_LENGTH &&
            'data' in (u as object)
        )
        .slice(0, MAX_KEYS_PER_REQUEST)

      if (clean.length === 0) {
        res.status(400).json({ error: 'no valid updates' })
        return
      }

      await db
        .insert(userState)
        .values(
          clean.map((u) => ({ userId, storeKey: u.storeKey, data: u.data as unknown }))
        )
        .onConflictDoUpdate({
          target: [userState.userId, userState.storeKey],
          set: {
            data: sql`excluded.data`,
            revision: sql`${userState.revision} + 1`,
            updatedAt: sql`now()`,
          },
        })

      const keys = clean.map((u) => u.storeKey)
      const rows = await db
        .select({
          storeKey: userState.storeKey,
          revision: userState.revision,
          updatedAt: userState.updatedAt,
        })
        .from(userState)
        .where(and(eq(userState.userId, userId), inArray(userState.storeKey, keys)))

      const stores: Record<string, { revision: number; updatedAt: string }> = {}
      for (const r of rows) stores[r.storeKey] = { revision: r.revision, updatedAt: iso(r.updatedAt) }
      res.status(200).json({ stores })
      return
    }

    if (req.method === 'DELETE') {
      await db.delete(userState).where(eq(userState.userId, userId))
      res.status(200).json({ ok: true })
      return
    }

    res.status(405).json({ error: 'method not allowed' })
  } catch (err) {
    console.error('[api/state]', err)
    res.status(500).json({ error: 'internal error' })
  }
}
