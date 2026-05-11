import { pgTable, text, jsonb, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core'

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
