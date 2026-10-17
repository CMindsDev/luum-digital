import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// El servidor ligero (server/) guarda las claves de proveedores; el navegador sólo habla con /api.
const API_TARGET = "http://127.0.0.1:8787";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["favicon.svg", "icons/*.png", "brand/*.svg"],
      manifest: {
        name: "Mérida · Servicios digitales (prototipo)",
        short_name: "Mérida demo",
        description:
          "Prototipo de demostración que unifica servicios digitales del Ayuntamiento de Mérida. No realiza gestiones oficiales.",
        lang: "es-MX",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#1C3174",
        background_color: "#FEF8EE",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Sólo recursos estáticos de la aplicación. Nada de /api, teselas de mapas,
        // conversaciones, documentos ni respuestas privadas (ver docs/PRIVACIDAD_Y_SEGURIDAD.md).
        globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
    },
  },
  // En e2e no se leen credenciales locales (.env.local).
  ...(mode === "e2e" ? { envDir: false as const } : {}),
  // Pre-optimiza las librerías del mapa (carga diferida) para que la primera visita a /mapa
  // no provoque una recarga del servidor de desarrollo.
  optimizeDeps: { include: ["maplibre-gl", "react-map-gl/maplibre", "react-map-gl/mapbox", "h3-js"] },
  server: { port: 5173, proxy: { "/api": API_TARGET } },
  preview: { port: 4173, proxy: { "/api": API_TARGET } },
  build: { chunkSizeWarningLimit: 1800 },
}));
