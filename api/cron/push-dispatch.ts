import type { VercelRequest, VercelResponse } from '@vercel/node'
import { and, eq, sql, lte, isNull } from 'drizzle-orm'
import webpush from 'web-push'
import { db } from '../../db/client.js'
import { pushSubscriptions, scheduledPushes } from '../../db/schema.js'

/**
 * Vercel cron — runs every minute (configured in vercel.json). Picks up every
 * scheduled push whose fire_at has arrived but hasn't been sent yet, dispatches
 * to all push subscriptions for that user, and marks `sent_at`. Stale
 * subscriptions (HTTP 404/410 from the push service) are dropped on the spot.
 *
 * No-op without VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY env vars set — keeps the
 * cron from crashing on freshly-cloned deploys that haven't completed setup.
 */
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
// VAPID_SUBJECT is a contact identifier the push service can ping if there's
// an issue with our app's pushes — never a recipient. URL works the same as
// a mailto: so we default to the deployed origin and keep email out of it.
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? 'https://ryse-os.vercel.app'
const MAX_PER_RUN = 500

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel cron requests include the CRON header; the optional CRON_SECRET
  // pattern adds a token check for hand-fired runs.
  const isVercelCron = req.headers['x-vercel-cron'] === '1'
  const secret = process.env.CRON_SECRET
  const authed = !secret || req.headers.authorization === `Bearer ${secret}` || isVercelCron
  if (!authed) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    res.status(200).json({ ok: true, skipped: 'vapid not configured' })
    return
  }

  try {
    const due = await db
      .select()
      .from(scheduledPushes)
      .where(and(isNull(scheduledPushes.sentAt), lte(scheduledPushes.fireAt, new Date())))
      .limit(MAX_PER_RUN)

    let sent = 0
    let failed = 0

    for (const item of due) {
      const subs = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, item.userId))

      const payload = JSON.stringify({
        title: item.title,
        body: item.body ?? '',
        url: item.url ?? '/',
      })

      let anyDelivered = false
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
          )
          anyDelivered = true
        } catch (err: unknown) {
          const status =
            (err && typeof err === 'object' && 'statusCode' in err
              ? Number((err as { statusCode?: number }).statusCode)
              : 0) ?? 0
          if (status === 404 || status === 410) {
            // Subscription expired or unsubscribed — drop it.
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.endpoint, sub.endpoint))
          } else {
            failed += 1
            console.error('[push-dispatch] send failed', { endpoint: sub.endpoint, status, err })
          }
        }
      }

      // Mark as sent regardless of whether any subscription was live — a user
      // with zero subscriptions just silently misses pushes; we don't want to
      // keep retrying every minute forever.
      await db
        .update(scheduledPushes)
        .set({ sentAt: sql`now()` })
        .where(
          and(eq(scheduledPushes.userId, item.userId), eq(scheduledPushes.ref, item.ref)),
        )

      if (anyDelivered) sent += 1
    }

    // GC: drop pushes that were sent more than 24h ago.
    await db
      .delete(scheduledPushes)
      .where(sql`${scheduledPushes.sentAt} IS NOT NULL AND ${scheduledPushes.sentAt} < now() - interval '24 hours'`)

    res.status(200).json({ ok: true, considered: due.length, sent, failed })
  } catch (err) {
    console.error('[push-dispatch]', err)
    res.status(500).json({ error: 'internal error' })
  }
}
