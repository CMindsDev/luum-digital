interface ImportMetaEnv {
  readonly VITE_INTEGRATION_MODE?: "demo" | "real";
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string;
  readonly VITE_MAPBOX_STYLE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
