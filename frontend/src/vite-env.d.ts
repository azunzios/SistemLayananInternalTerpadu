/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API: string
  readonly VITE_API_TIMEOUT?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_ENV?: string
  readonly VITE_DEBUG?: string
  readonly VITE_LOG_LEVEL?: string
  readonly VITE_ENABLE_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
