import { defineConfig, devices } from "@playwright/test";

// 1.63.0 usa los navegadores ya presentes en ~/Library/Caches/ms-playwright (chromium-1243, webkit-2359).
// E2E_BASE_URL permite correr specs contra un servidor ya levantado (p. ej. `npm run dev` en 5173)
// sin compilar ni levantar `vite preview`; sin la variable se usa la build de producción en modo e2e.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:4173";
const usarServidorExistente = Boolean(process.env.E2E_BASE_URL);

export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results/e2e",
  fullyParallel: true,
  retries: 0,
  workers: 3,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    locale: "es-MX",
    timezoneId: "America/Merida",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "movil",
      use: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, defaultBrowserType: "chromium" },
    },
    { name: "tableta", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    {
      name: "movimiento-reducido",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 832 }, reducedMotion: "reduce" },
    },
  ],
  webServer: usarServidorExistente
    ? undefined
    : {
    command: "npm run build -- --mode e2e && npx vite preview --mode e2e --host localhost --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
