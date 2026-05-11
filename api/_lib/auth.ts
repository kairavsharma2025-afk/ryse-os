import { verifyToken } from '@clerk/backend'
import type { VercelRequest } from '@vercel/node'

/**
 * Resolves the Clerk user id from a `Authorization: Bearer <session-jwt>` header.
 * The client obtains the JWT with Clerk's `getToken()` (short-lived, auto-refreshed).
 * Returns `null` when there is no valid token — callers should answer 401.
 */
export async function getUserId(req: VercelRequest): Promise<string | null> {
  const raw = req.headers.authorization ?? req.headers.Authorization
  const header = Array.isArray(raw) ? raw[0] : raw
  if (!header || !header.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  if (!token) return null

  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) {
    console.error('[auth] CLERK_SECRET_KEY is not set')
    return null
  }

  try {
    const claims = await verifyToken(token, { secretKey })
    return typeof claims.sub === 'string' && claims.sub.length > 0 ? claims.sub : null
  } catch {
    return null
  }
}
