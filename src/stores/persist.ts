// Tiny localStorage helpers used by every store.
import { noteLocalWrite } from '@/sync/engine'

const PREFIX = 'lifeos:v1:'

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    // Mirror the write to the cloud-sync engine (no-op when signed out).
    noteLocalWrite(key)
  } catch {
    // ignore quota / private mode
  }
}

export function clearAll(): void {
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(PREFIX)) localStorage.removeItem(k)
    })
  } catch {
    /* ignore */
  }
}
