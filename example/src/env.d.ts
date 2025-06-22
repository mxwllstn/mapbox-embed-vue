/// <reference types="vite/client" />

interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict to disallow unknown keys.
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  /** Access Token for Mapbox (required) */
  readonly VITE_MAPBOX_ACCESS_TOKEN: string
  /** Custom Style url for Mapbpx (optional) */
  readonly VITE_MAPBOX_CUSTOM_STYLE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
