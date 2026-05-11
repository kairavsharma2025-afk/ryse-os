// Raw access to the `lifeos:v1:` localStorage namespace, used by the sync engine.
// The prefix is intentionally hardcoded (it is a stable contract — see CLAUDE.md)
// to keep this module free of imports from the store layer (avoids an import cycle
// with `stores/persist.ts`, which calls into the sync engine on every write).
export const STORAGE_PREFIX = 'lifeos:v1:'

// Internal sync bookkeeping lives under this sub-namespace and is never synced.
export const SYNC_INTERNAL_PREFIX = STORAGE_PREFIX + '__sync'

/** Store keys currently present locally (e.g. `character`, `goals`, …), without the prefix. */
export function listLocalStoreKeys(): string[] {
  const out: string[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const full = localStorage.key(i)
      if (!full) continue
      if (full.startsWith(SYNC_INTERNAL_PREFIX)) continue
      if (full.startsWith(STORAGE_PREFIX)) out.push(full.slice(STORAGE_PREFIX.length))
    }
  } catch {
    /* ignore */
  }
  return out
}

export function readLocalBlob(key: string): unknown | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (raw == null) return undefined
    return JSON.parse(raw) as unknown
  } catch {
    return undefined
  }
}

export function writeLocalBlob(key: string, data: unknown): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data))
  } catch {
    /* ignore quota / private mode */
  }
}

export function removeLocalBlob(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key)
  } catch {
    /* ignore */
  }
}

/** Wipe every synced store blob (used when a different account signs in on this device). */
export function wipeLocalStores(): void {
  for (const key of listLocalStoreKeys()) removeLocalBlob(key)
}
