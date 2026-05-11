import { SYNC_INTERNAL_PREFIX } from './localStore'

// Per-store last-known timestamp (ISO string), used for last-write-wins reconciliation.
const META_KEY = SYNC_INTERNAL_PREFIX + ':meta'
// The Clerk user id that this device's data currently belongs to.
const OWNER_KEY = SYNC_INTERNAL_PREFIX + ':owner'

type Meta = Record<string, string>

export function readMeta(): Meta {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Meta) : {}
  } catch {
    return {}
  }
}

export function writeMeta(meta: Meta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta))
  } catch {
    /* ignore */
  }
}

export function getKeyTimestamp(key: string): string | null {
  return readMeta()[key] ?? null
}

export function setKeyTimestamp(key: string, iso: string): void {
  const meta = readMeta()
  meta[key] = iso
  writeMeta(meta)
}

/** Stamp a key as locally-modified right now. */
export function touchKey(key: string): void {
  setKeyTimestamp(key, new Date().toISOString())
}

export function getOwner(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY)
  } catch {
    return null
  }
}

export function setOwner(userId: string): void {
  try {
    localStorage.setItem(OWNER_KEY, userId)
  } catch {
    /* ignore */
  }
}

export function clearOwner(): void {
  try {
    localStorage.removeItem(OWNER_KEY)
  } catch {
    /* ignore */
  }
}
