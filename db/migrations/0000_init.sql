-- Ryse — initial schema for cross-device sync.
-- Apply with `npm run db:push` (drizzle-kit), or paste into the Neon SQL editor,
-- or `psql "$DATABASE_URL" -f db/migrations/0000_init.sql`.

CREATE TABLE IF NOT EXISTS "user_state" (
  "user_id"    text        NOT NULL,
  "store_key"  text        NOT NULL,
  "data"       jsonb       NOT NULL,
  "revision"   integer     NOT NULL DEFAULT 1,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "user_state_pkey" PRIMARY KEY ("user_id", "store_key")
);

CREATE INDEX IF NOT EXISTS "user_state_user_id_idx" ON "user_state" ("user_id");
