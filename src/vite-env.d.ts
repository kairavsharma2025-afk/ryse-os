/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin for /api requests. Empty = same-origin (web). Native builds must set it. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
