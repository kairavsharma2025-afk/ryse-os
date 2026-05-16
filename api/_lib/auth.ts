import type { VercelRequest } from '@vercel/node'
import { jwtVerify } from 'jose'

/**
 * Validates the `Authorization: Bearer <jwt>` header against AUTH_SECRET and
 * returns the signed-in user's id + email. Returns `null` if the header is
 * missing, malformed, expired, or signed with a different secret.
 */
export interface Session {
  userId: string
  email: string
}

function authSecret(): Uint8Array {
  const v = process.env.AUTH_SECRET
  if (!v || v.length < 32) {
    throw new Error('AUTH_SECRET env var is missing or shorter than 32 chars')
  }
  return new TextEncoder().encode(v)
}

export async function verifyBearer(req: VercelRequest): Promise<Session | null> {
  const raw = req.headers['authorization']
  const header = Array.isArray(raw) ? raw[0] : raw
  if (typeof header !== 'string') return null
  const m = /^Bearer\s+(.+)$/i.exec(header.trim())
  if (!m) return null
  try {
    const { payload } = await jwtVerify(m[1], authSecret(), { algorithms: ['HS256'] })
    const userId = typeof payload.sub === 'string' ? payload.sub : null
    const email = typeof payload.email === 'string' ? payload.email : null
    if (!userId || !email) return null
    return { userId, email }
  } catch {
    return null
  }
}

/**
 * Convenience wrapper for endpoints that only need the user id (most do).
 * Returns `null` when the request is unauthenticated — callers should 401.
 */
export async function getUserId(req: VercelRequest): Promise<string | null> {
  const s = await verifyBearer(req)
  return s?.userId ?? null
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Auth helper for push endpoints. Accepts either:
 *   - `Authorization: Bearer <jwt>`  → returns the signed-in user id
 *   - `X-Device-Id: <uuid>`          → returns the device uuid (anonymous push)
 *
 * Web Push needs a stable identity to attach subscriptions to so the cron knows
 * where to send. Requiring a real account just to receive background pings was
 * a usability cliff, so device-uuid auth gives every browser its own identity
 * without sign-up. Knowing the uuid is the credential — same model as the
 * existing sync pairing user_id.
 */
export async function getPushIdentity(req: VercelRequest): Promise<string | null> {
  const session = await verifyBearer(req)
  if (session?.userId) return session.userId
  const rawDevice = req.headers['x-device-id']
  const device = Array.isArray(rawDevice) ? rawDevice[0] : rawDevice
  if (typeof device === 'string' && UUID_V4.test(device.trim())) {
    return device.trim().toLowerCase()
  }
  return null
}
