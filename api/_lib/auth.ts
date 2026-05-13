import type { VercelRequest } from '@vercel/node'

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Resolves the syncing user id from the `X-Sync-User: <uuid-v4>` header.
 *
 * Auth model: the user id itself is the credential. It's a v4 UUID (122 bits of
 * entropy, generated server-side at pairing time), so guessing is infeasible.
 * Whoever has the id on a device can sync that account — that's by design for the
 * pairing-code flow (no passwords, no third-party auth).
 *
 * Returns `null` when the header is missing or malformed — callers should 401.
 */
export async function getUserId(req: VercelRequest): Promise<string | null> {
  const raw = req.headers['x-sync-user']
  const header = Array.isArray(raw) ? raw[0] : raw
  if (typeof header !== 'string') return null
  const trimmed = header.trim()
  if (!UUID_V4.test(trimmed)) return null
  return trimmed.toLowerCase()
}
