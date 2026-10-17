import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest sin globals: Testing Library no limpia sola el DOM entre pruebas.
afterEach(() => {
  cleanup();
  // Las pruebas del servidor corren en entorno node (sin window).
  if (typeof window !== "undefined") window.localStorage.clear();
});
