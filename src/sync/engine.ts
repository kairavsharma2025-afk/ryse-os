// Cross-device sync engine.
//
// State lives as JSON blobs in localStorage under `lifeos:v1:<storeKey>`. We mirror
// those blobs to Postgres (via /api/state), one row per (user, storeKey), and resolve
// conflicts last-write-wins on a timestamp:
//   • every local write stamps the key's timestamp = now (`touchKey`, called from
//     `stores/persist.ts`) and queues a debounced push;
//   • on launch / sign-in `bootstrapSync` pulls every remote blob, keeps whichever
//     side is newer per key, and pushes back anything the server is missing/stale on.
//
// All of this is best-effort: any failure leaves the local-first app fully usable.

import { apiDeleteState, apiGetState, apiPutState, syncEnabled } from './client'
import {
  clearOwner,
  getKeyTimestamp,
  getOwner,
  readMeta,
  setKeyTimestamp,
  setOwner,
} from './meta'
import { listLocalStoreKeys, readLocalBlob, wipeLocalStores, writeLocalBlob } from './localStore'
import { useSync } from './syncStore'

const PUSH_DEBOUNCE_MS = 1500

const dirty = new Set<string>()
let pushTimer: ReturnType<typeof setTimeout> | null = null
let inFlight = false
let bootstrapPromise: Promise<BootstrapResult> | null = null

function ts(value: string | null | undefined): number {
  if (!value) return 0
  const n = new Date(value).getTime()
  return Number.isFinite(n) ? n : 0
}

/** Called from `stores/persist.ts` on every `saveJSON`. Best-effort; never throws. */
export function noteLocalWrite(storeKey: string): void {
  try {
    if (storeKey.startsWith('__sync')) return
    setKeyTimestamp(storeKey, new Date().toISOString())
    if (!syncEnabled()) return
    dirty.add(storeKey)
    schedulePush()
  } catch {
    /* sync is best-effort — never break local persistence */
  }
}

function schedulePush(): void {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    void flushDirty()
  }, PUSH_DEBOUNCE_MS)
}

async function flushDirty(): Promise<void> {
  if (!syncEnabled() || dirty.size === 0) return
  if (inFlight) {
    schedulePush()
    return
  }
  inFlight = true
  const keys = [...dirty]
  dirty.clear()
  useSync.getState().setPhase('syncing')
  try {
    const updates = keys
      .map((k) => ({ storeKey: k, data: readLocalBlob(k) }))
      .filter((u): u is { storeKey: string; data: unknown } => u.data !== undefined)
    if (updates.length > 0) {
      const result = await apiPutState(updates)
      for (const [k, v] of Object.entries(result)) setKeyTimestamp(k, v.updatedAt)
    }
    useSync.getState().markSynced()
  } catch (err) {
    for (const k of keys) dirty.add(k) // retry on the next change / push tick
    useSync.getState().setError(errMessage(err))
  } finally {
    inFlight = false
    if (dirty.size > 0) schedulePush()
  }
}

export interface BootstrapResult {
  /** Local store blobs that were overwritten by remote (callers may need to rehydrate / reload). */
  changedKeys: string[]
  /** True if local data was wiped because a different account signed in on this device. */
  wipedLocal: boolean
  ok: boolean
}

/**
 * Reconcile this device with the server for `userId`. Safe to call before the app
 * renders (main.tsx) — in that case stores pick up the merged localStorage on import.
 *
 * Concurrent callers share the same in-flight promise, so awaiting from multiple
 * places (e.g. the pairing UI + SyncProvider mounting at the same time) all see
 * the same merged result.
 */
export function bootstrapSync(userId: string): Promise<BootstrapResult> {
  if (bootstrapPromise) return bootstrapPromise
  bootstrapPromise = (async () => {
    if (!syncEnabled()) return { changedKeys: [], wipedLocal: false, ok: false }
    inFlight = true
    useSync.getState().setPhase('syncing')

    const changedKeys: string[] = []
    let wipedLocal = false

    try {
      const remote = await apiGetState()
      const remoteHasData = Object.keys(remote).length > 0
      const prevOwner = getOwner()

      // The account wins over local data when either: a *different* account is taking
      // over this device, or this device is joining an account that already has data
      // (e.g. you went through onboarding locally, then signed into an existing account).
      if (prevOwner ? prevOwner !== userId : remoteHasData) {
        wipeLocalStores()
        wipedLocal = true
      }

      const meta = wipedLocal ? {} : readMeta()
      const allKeys = new Set<string>([...listLocalStoreKeys(), ...Object.keys(remote)])
      const toPush: Array<{ storeKey: string; data: unknown }> = []

      for (const key of allKeys) {
        if (key.startsWith('__sync')) continue
        const r = remote[key]
        const localTs = meta[key] ?? null
        const localData = readLocalBlob(key)
        const hasLocal = localData !== undefined

        const remoteWins = r && (!hasLocal || ts(r.updatedAt) > ts(localTs))
        if (remoteWins) {
          writeLocalBlob(key, r.data)
          setKeyTimestamp(key, r.updatedAt)
          changedKeys.push(key)
        } else if (hasLocal) {
          // local is newer, or the server doesn't have it yet → push it up
          toPush.push({ storeKey: key, data: localData })
        }
      }

      if (toPush.length > 0) {
        const result = await apiPutState(toPush)
        for (const [k, v] of Object.entries(result)) setKeyTimestamp(k, v.updatedAt)
      }

      setOwner(userId)
      useSync.getState().markSynced()
      return { changedKeys, wipedLocal, ok: true }
    } catch (err) {
      useSync.getState().setError(errMessage(err))
      return { changedKeys, wipedLocal, ok: false }
    } finally {
      inFlight = false
      bootstrapPromise = null
    }
  })()
  return bootstrapPromise
}

/**
 * Pull remote state and apply any keys where remote is newer than local.
 * Unlike `bootstrapSync`, this never wipes local data, never pushes back, and
 * never changes the owner. Safe to call periodically (focus/visibility/poll).
 *
 * Returns the list of store keys that were overwritten — callers typically
 * reload the page so Zustand stores rehydrate from the updated localStorage.
 */
export async function pullRemote(): Promise<string[]> {
  if (!syncEnabled()) return []
  // Push any pending local edits up first, so a same-second focus pull doesn't
  // wipe a fresh local write the user just made (they'd get the older server
  // version back). flushNow handles its own in-flight gate.
  if (pushTimer || dirty.size > 0) {
    await flushNow()
  }
  if (inFlight) return []
  inFlight = true
  useSync.getState().setPhase('syncing')
  const changedKeys: string[] = []
  try {
    const remote = await apiGetState()
    const meta = readMeta()
    for (const [key, r] of Object.entries(remote)) {
      if (key.startsWith('__sync')) continue
      const localTs = meta[key] ?? null
      const localData = readLocalBlob(key)
      const hasLocal = localData !== undefined
      const remoteWins = !hasLocal || ts(r.updatedAt) > ts(localTs)
      if (remoteWins) {
        writeLocalBlob(key, r.data)
        setKeyTimestamp(key, r.updatedAt)
        changedKeys.push(key)
      }
    }
    useSync.getState().markSynced()
  } catch (err) {
    useSync.getState().setError(errMessage(err))
  } finally {
    inFlight = false
  }
  return changedKeys
}

/** Force-flush any pending changes immediately (e.g. before a manual reset). */
export async function flushNow(): Promise<void> {
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
  await flushDirty()
}

/** Best-effort: forget that this device belongs to an account (used on sign-out). */
export function forgetOwner(): void {
  clearOwner()
}

/** Delete every blob this account has on the server (called by Settings → Reset). */
export async function wipeRemoteState(): Promise<void> {
  if (!syncEnabled()) return
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
  dirty.clear()
  try {
    await apiDeleteState()
  } catch {
    /* best-effort */
  }
}

// Re-exported for convenience.
export { getKeyTimestamp }

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}
