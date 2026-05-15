import { pgTable, text, jsonb, integer, timestamp, primaryKey, index, uniqueIndex } from 'drizzle-orm/pg-core'

/**
 * Web Push subscriptions — one row per (user, browser). The `endpoint` is the
 * push service URL the browser handed us; together with `p256dh`/`auth` it's
 * what the `web-push` library needs to encrypt and dispatch a notification.
 * Users can be subscribed from multiple devices, so we index by `userId`
 * rather than uniquing on it.
 */
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    endpoint: text('endpoint').primaryKey(),
    userId: text('user_id').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUser: index('push_subscriptions_user_idx').on(t.userId),
  })
)

export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect

/**
 * Pending background pushes the client has asked us to fire at a specific
 * time. The client computes its next 48h of reminder fires (using the same
 * remindersEngine the in-app poll uses) and PUTs them here; the Vercel cron
 * dispatches whatever's due. `(userId, ref)` is unique so re-PUT-ing replaces
 * the schedule for that ref without duplicates — `ref` is typically the
 * `<reminderId>:<isoDate>` pair.
 */
export const scheduledPushes = pgTable(
  'scheduled_pushes',
  {
    userId: text('user_id').notNull(),
    ref: text('ref').notNull(),
    fireAt: timestamp('fire_at', { withTimezone: true }).notNull(),
    title: text('title').notNull(),
    body: text('body'),
    url: text('url'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.ref] }),
    byFireAt: index('scheduled_pushes_fire_idx').on(t.fireAt),
  })
)

export type ScheduledPushRow = typeof scheduledPushes.$inferSelect

/**
 * Email/password user accounts. `id` is the same uuid string used as `user_state.user_id`,
 * so the existing per-user blob rows attach to it without any migration step.
 */
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byEmail: uniqueIndex('users_email_idx').on(t.email),
  })
)

export type UserRow = typeof users.$inferSelect

/**
 * One row per (Clerk user, localStorage store key).
 *
 * Ryse keeps all of its state as JSON blobs under the `lifeos:v1:` localStorage
 * prefix (one blob per Zustand store: `character`, `goals`, `quests`, …). Rather
 * than model every entity relationally, cross-device sync mirrors those blobs:
 * the client pushes a blob whenever it changes and pulls everyone's blobs on
 * launch, resolving conflicts last-write-wins by `updatedAt`.
 *
 * `revision` is a monotonically-increasing counter (handy for debugging / future
 * conflict UIs); the authoritative ordering for sync is `updatedAt`, which is set
 * by the database clock on every write.
 */
export const userState = pgTable(
  'user_state',
  {
    userId: text('user_id').notNull(),
    storeKey: text('store_key').notNull(),
    data: jsonb('data').notNull(),
    revision: integer('revision').notNull().default(1),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.storeKey] }),
  })
)

export type UserStateRow = typeof userState.$inferSelect

/**
 * Short-lived device-pairing codes. Device A POSTs to /api/pair to create a new
 * (code, user_id) pair; device B POSTs to /api/pair with the code to receive the
 * user_id and stop using its own. The row is single-use (deleted on redeem) and
 * also expires after a few minutes if unredeemed.
 *
 * No password or session token — the user_id itself (a v4 UUID with 122 bits of
 * entropy) is the credential. Whoever has it on a device can sync that account.
 */
export const syncPairing = pgTable(
  'sync_pairing',
  {
    code: text('code').primaryKey(),
    userId: text('user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => ({
    byExpiry: index('sync_pairing_expires_idx').on(t.expiresAt),
  })
)

export type SyncPairingRow = typeof syncPairing.$inferSelect
