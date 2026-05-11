// Thin HTTP client for the /api/state backend, plus the auth-token plumbing.
//
// `setTokenGetter` is called by SyncProvider (and by main.tsx's pre-render
// bootstrap) with a function that returns a fresh Clerk session JWT. When no
// getter is registered the user is signed out and sync is disabled.

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

type TokenGetter = () => Promise<string | null>

let tokenGetter: TokenGetter | null = null

export function setTokenGetter(getter: TokenGetter | null): void {
  tokenGetter = getter
}

export function syncEnabled(): boolean {
  return tokenGetter != null
}

async function authHeaders(): Promise<Record<string, string>> {
  if (!tokenGetter) return {}
  try {
    const token = await tokenGetter()
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

export interface RemoteStore {
  data: unknown
  revision: number
  updatedAt: string
}

export async function apiGetState(): Promise<Record<string, RemoteStore>> {
  const res = await fetch(`${API_BASE}/api/state`, { headers: { ...(await authHeaders()) } })
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
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ updates }),
  })
  if (res.status === 401) throw new Error('unauthorized')
  if (!res.ok) throw new Error(`PUT /api/state → ${res.status}`)
  const json = (await res.json()) as { stores?: Record<string, { revision: number; updatedAt: string }> }
  return json.stores ?? {}
}

export async function apiDeleteState(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/state`, {
    method: 'DELETE',
    headers: { ...(await authHeaders()) },
  })
  if (res.status === 401) throw new Error('unauthorized')
  if (!res.ok) throw new Error(`DELETE /api/state → ${res.status}`)
}
