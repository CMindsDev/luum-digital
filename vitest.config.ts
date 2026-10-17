import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "shared/**/*.test.ts", "server/**/*.test.ts"],
    // Las pruebas de pantalla montan árboles grandes en jsdom; con muchos archivos en paralelo
    // (o con otros procesos pesados) el margen por defecto de 5 s puede quedarse corto.
    testTimeout: 20_000,
    css: false,
    restoreMocks: true,
  },
});
