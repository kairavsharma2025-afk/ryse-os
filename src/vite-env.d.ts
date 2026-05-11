/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Clerk publishable key. When unset, auth + cross-device sync stay disabled. */
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string
  /** Origin for /api requests. Empty = same-origin (web). Native builds must set it. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
