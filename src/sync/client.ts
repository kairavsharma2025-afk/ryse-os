// Thin HTTP client for the /api/state backend.
//
// Auth model: this app uses pairing-code sync (no third-party auth provider).
// After pairing, a v4-UUID `user_id` is stored in localStorage; every request
// sends it as `X-Sync-User`. Whoever has the id on a device can sync that
// account — that's the explicit trade-off vs. password-based auth.

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

const SYNC_USER_KEY = 'lifeos:v1:__sync_user_id'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function getSyncUserId(): string | null {
  try {
    const v = localStorage.getItem(SYNC_USER_KEY)
    return v && UUID_V4.test(v) ? v.toLowerCase() : null
  } catch {
    return null
  }
}

export function setSyncUserId(id: string | null): void {
  try {
    if (id && UUID_V4.test(id)) localStorage.setItem(SYNC_USER_KEY, id.toLowerCase())
    else localStorage.removeItem(SYNC_USER_KEY)
    // Notify SyncProvider in the same tab — `storage` only fires cross-tab.
    window.dispatchEvent(new CustomEvent('ryse:sync-identity-changed'))
  } catch {
    /* localStorage unavailable — sync just stays off */
  }
}

export function syncEnabled(): boolean {
  return getSyncUserId() !== null
}

function authHeaders(): Record<string, string> {
  const id = getSyncUserId()
  return id ? { 'X-Sync-User': id } : {}
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

// ---- Pairing endpoint ----

export interface PairingCode {
  code: string
  userId: string
  expiresInSec: number
}

/** Device A: ask the server for a 6-digit code tied to this device's identity. */
export async function apiCreatePairing(): Promise<PairingCode> {
  const res = await fetch(`${API_BASE}/api/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', userId: getSyncUserId() ?? undefined }),
  })
  if (!res.ok) throw new Error(`POST /api/pair create → ${res.status}`)
  return (await res.json()) as PairingCode
}

/** Device B: hand the code to the server, receive the shared user id. */
export async function apiRedeemPairing(code: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'redeem', code }),
  })
  if (res.status === 404) throw new Error('Code is invalid or expired')
  if (!res.ok) throw new Error(`POST /api/pair redeem → ${res.status}`)
  const json = (await res.json()) as { userId?: string }
  if (!json.userId) throw new Error('Invalid server response')
  return json.userId
}
