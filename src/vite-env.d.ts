/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_ACCESS_TOKEN: string
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly VITE_HERE_API_KEY: string
  readonly VITE_APP_ENV: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_ENABLE_TRUCK_ROUTING: string
  readonly VITE_ENABLE_FILE_UPLOAD: string
  readonly VITE_ENABLE_ANALYTICS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
