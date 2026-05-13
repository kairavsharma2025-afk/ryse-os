import { pgTable, text, jsonb, integer, timestamp, primaryKey, index } from 'drizzle-orm/pg-core'

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
