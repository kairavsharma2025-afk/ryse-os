-- Web Push: subscriptions per device and a queue of pending dispatches.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS scheduled_pushes (
  user_id TEXT NOT NULL,
  ref TEXT NOT NULL,
  fire_at TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  sent_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, ref)
);
CREATE INDEX IF NOT EXISTS scheduled_pushes_fire_idx ON scheduled_pushes(fire_at);
