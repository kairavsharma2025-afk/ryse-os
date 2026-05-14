// Thin HTTP client for the /api backend.
//
// Auth model: email + password sign-in returns a JWT, stored in localStorage and
// sent as `Authorization: Bearer <jwt>` on every request. The token's payload
// also carries the user id, which we mirror to `lifeos:v1:__sync_user_id` so the
// sync engine (built around per-user blobs in localStorage) keeps working.

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

const SYNC_USER_KEY = 'lifeos:v1:__sync_user_id'
const SYNC_TOKEN_KEY = 'lifeos:v1:__sync_token'
const SYNC_EMAIL_KEY = 'lifeos:v1:__sync_email'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function getSyncUserId(): string | null {
  try {
    const v = localStorage.getItem(SYNC_USER_KEY)
    return v && UUID_V4.test(v) ? v.toLowerCase() : null
  } catch {
    return null
  }
}

export function getSyncToken(): string | null {
  try {
    return localStorage.getItem(SYNC_TOKEN_KEY)
  } catch {
    return null
  }
}

export function getSyncEmail(): string | null {
  try {
    return localStorage.getItem(SYNC_EMAIL_KEY)
  } catch {
    return null
  }
}

/**
 * Atomically set / clear the session identity. Pass `null` to sign out.
 * `setSyncIdentity(null)` is the canonical way to wipe the device's session.
 */
export function setSyncIdentity(
  identity: { userId: string; email: string; token: string } | null
): void {
  try {
    if (identity && UUID_V4.test(identity.userId)) {
      localStorage.setItem(SYNC_USER_KEY, identity.userId.toLowerCase())
      localStorage.setItem(SYNC_TOKEN_KEY, identity.token)
      localStorage.setItem(SYNC_EMAIL_KEY, identity.email)
    } else {
      localStorage.removeItem(SYNC_USER_KEY)
      localStorage.removeItem(SYNC_TOKEN_KEY)
      localStorage.removeItem(SYNC_EMAIL_KEY)
    }
    window.dispatchEvent(new CustomEvent('ryse:sync-identity-changed'))
  } catch {
    /* localStorage unavailable — sync just stays off */
  }
}

export function syncEnabled(): boolean {
  return getSyncToken() !== null && getSyncUserId() !== null
}

function authHeaders(): Record<string, string> {
  const t = getSyncToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export interface RemoteStore {
  data: unknown
  revision: number
  updatedAt: string
}

export async function apiGetState(): Promise<Record<string, RemoteStore>> {
  const res = await fetch(`${API_BASE}/api/state`, { headers: authHeaders() })
  if (res.status === 401) throw new Error('unauthorized')
  if (!res.ok) throw new Error(`GET /api/state → ${res.status}`)
  const json = (await res.json()) as { stores?: Record<string, RemoteStore> }
  return json.stores ?? {}
}

export async function apiPutState(
  updates: Array<{ storeKey: string; data: unknown }>
): Promise<Record<string, { revision: number; updatedAt: string }>> {
  const res = await fetch(`${API_BASE}/api/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ updates }),
  })
  if (res.status === 401) throw new Error('unauthorized')
  if (!res.ok) throw new Error(`PUT /api/state → ${res.status}`)
  const json = (await res.json()) as {
    stores?: Record<string, { revision: number; updatedAt: string }>
  }
  return json.stores ?? {}
}

export async function apiDeleteState(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/state`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (res.status === 401) throw new Error('unauthorized')
  if (!res.ok) throw new Error(`DELETE /api/state → ${res.status}`)
}

// ---- Auth endpoint ----

export interface SignedInIdentity {
  userId: string
  email: string
  token: string
}

async function postAuth(payload: Record<string, unknown>): Promise<SignedInIdentity> {
  const res = await fetch(`${API_BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = (await res.json().catch(() => ({}))) as {
    error?: string
    userId?: string
    email?: string
    token?: string
  }
  if (!res.ok) throw new Error(json.error || `auth ${res.status}`)
  if (!json.userId || !json.email || !json.token) throw new Error('Invalid server response')
  return { userId: json.userId, email: json.email, token: json.token }
}

/**
 * Create an account. If the caller has an existing pairing user_id in
 * localStorage we hand it to the server as `claimUserId` so the existing
 * synced data on the server attaches to the new account.
 */
export async function apiSignUp(email: string, password: string): Promise<SignedInIdentity> {
  return await postAuth({
    action: 'signup',
    email,
    password,
    claimUserId: getSyncUserId() ?? undefined,
  })
}

export async function apiSignIn(email: string, password: string): Promise<SignedInIdentity> {
  return await postAuth({ action: 'signin', email, password })
}

export async function apiSignOut(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signout' }),
    })
  } catch {
    /* best-effort — local signout below still happens */
  }
  setSyncIdentity(null)
}

// ---- Pairing endpoint ----

export interface PairingCode {
  code: string
  expiresInSec: number
}

/** Device A (signed-in): ask the server for a 6-digit code linked to this account. */
export async function apiCreatePairing(): Promise<PairingCode> {
  const res = await fetch(`${API_BASE}/api/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ action: 'create' }),
  })
  if (res.status === 401) throw new Error('Sign in first to generate a pairing code.')
  if (!res.ok) throw new Error(`POST /api/pair create → ${res.status}`)
  return (await res.json()) as PairingCode
}

/**
 * Device B: redeem a 6-digit code, receive a signed-in session for the
 * issuing account. This is an alternative to typing email + password on the
 * second device.
 */
export async function apiRedeemPairing(code: string): Promise<SignedInIdentity> {
  const res = await fetch(`${API_BASE}/api/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'redeem', code }),
  })
  const json = (await res.json().catch(() => ({}))) as {
    error?: string
    userId?: string
    email?: string
    token?: string
  }
  if (res.status === 404) throw new Error('Code is invalid or expired')
  if (!res.ok) throw new Error(json.error || `pair redeem ${res.status}`)
  if (!json.userId || !json.email || !json.token) throw new Error('Invalid server response')
  return { userId: json.userId, email: json.email, token: json.token }
}
