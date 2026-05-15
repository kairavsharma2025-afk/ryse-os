import type { VercelRequest, VercelResponse } from '@vercel/node'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { pushSubscriptions, scheduledPushes } from '../db/schema.js'
import { getUserId } from './_lib/auth.js'

/**
 *   POST  /api/push        — save a push subscription for the signed-in user
 *   PUT   /api/push        — replace the user's pending schedule with the
 *                            provided list of `{ ref, fireAt, title, body, url? }`
 *   DELETE /api/push       — unsubscribe (also nukes pending schedules)
 *
 * The schedule format is "replace all": the client recomputes the next 48h of
 * reminder fires and sends the full list each time anything changes, so we
 * never need partial diffs.
 */
const MAX_PUSHES = 200
const MAX_REF_LEN = 200
const MAX_TITLE_LEN = 200
const MAX_BODY_LEN = 500
const MAX_URL_LEN = 500

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    if (req.method === 'POST') {
      const body = (req.body ?? {}) as {
        endpoint?: unknown
        keys?: { p256dh?: unknown; auth?: unknown }
      }
      const endpoint = typeof body.endpoint === 'string' ? body.endpoint : null
      const p256dh = typeof body.keys?.p256dh === 'string' ? body.keys.p256dh : null
      const auth = typeof body.keys?.auth === 'string' ? body.keys.auth : null
      if (!endpoint || !p256dh || !auth) {
        res.status(400).json({ error: 'invalid subscription' })
        return
      }

      await db
        .insert(pushSubscriptions)
        .values({ endpoint, userId, p256dh, auth })
        .onConflictDoUpdate({
          target: pushSubscriptions.endpoint,
          set: { userId, p256dh, auth },
        })

      res.status(200).json({ ok: true })
      return
    }

    if (req.method === 'PUT') {
      const body = (req.body ?? {}) as { pushes?: unknown }
      const list = Array.isArray(body.pushes) ? body.pushes : []
      const clean = list
        .filter(
          (
            p,
          ): p is {
            ref: string
            fireAt: string
            title: string
            body?: string
            url?: string
          } => {
            if (!p || typeof p !== 'object') return false
            const o = p as Record<string, unknown>
            return (
              typeof o.ref === 'string' &&
              o.ref.length > 0 &&
              o.ref.length <= MAX_REF_LEN &&
              typeof o.fireAt === 'string' &&
              typeof o.title === 'string' &&
              o.title.length > 0 &&
              o.title.length <= MAX_TITLE_LEN &&
              (o.body == null || (typeof o.body === 'string' && o.body.length <= MAX_BODY_LEN)) &&
              (o.url == null || (typeof o.url === 'string' && o.url.length <= MAX_URL_LEN))
            )
          },
        )
        .slice(0, MAX_PUSHES)

      // Replace strategy: any pending push for this user that isn't in the
      // new list goes away, while existing ones get their fields updated.
      const refs = clean.map((p) => p.ref)
      await db
        .delete(scheduledPushes)
        .where(
          and(
            eq(scheduledPushes.userId, userId),
            // sentAt IS NULL = unsent, leave history alone
            sql`${scheduledPushes.sentAt} IS NULL`,
            refs.length > 0 ? sql`NOT (${inArray(scheduledPushes.ref, refs)})` : sql`TRUE`,
          ),
        )

      if (clean.length > 0) {
        await db
          .insert(scheduledPushes)
          .values(
            clean.map((p) => ({
              userId,
              ref: p.ref,
              fireAt: new Date(p.fireAt),
              title: p.title,
              body: p.body ?? null,
              url: p.url ?? null,
              sentAt: null,
            })),
          )
          .onConflictDoUpdate({
            target: [scheduledPushes.userId, scheduledPushes.ref],
            set: {
              fireAt: sql`excluded.fire_at`,
              title: sql`excluded.title`,
              body: sql`excluded.body`,
              url: sql`excluded.url`,
              sentAt: null,
            },
          })
      }

      res.status(200).json({ ok: true, count: clean.length })
      return
    }

    if (req.method === 'DELETE') {
      const body = (req.body ?? {}) as { endpoint?: unknown }
      const endpoint = typeof body.endpoint === 'string' ? body.endpoint : null
      if (endpoint) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
      } else {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
        await db.delete(scheduledPushes).where(eq(scheduledPushes.userId, userId))
      }
      res.status(200).json({ ok: true })
      return
    }

    res.status(405).json({ error: 'method not allowed' })
  } catch (err) {
    console.error('[api/push]', err)
    res.status(500).json({ error: 'internal error' })
  }
}
