-- Ryse — email/password user accounts.
-- Apply with `npm run db:push`, the Neon SQL editor, or
-- `psql "$DATABASE_URL" -f db/migrations/0001_users.sql`.

CREATE TABLE IF NOT EXISTS "users" (
  "id"            text        PRIMARY KEY,
  "email"         text        NOT NULL,
  "password_hash" text        NOT NULL,
  "created_at"    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" (lower("email"));
