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
