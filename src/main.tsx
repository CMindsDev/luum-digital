// Tipografía del Laboratorio (autoalojada): Host Grotesk (interfaz), Instrument Serif itálica (acento),
// IBM Plex Mono (rótulos y folios), Unbounded (sólo el saludo del asistente) y Poppins de respaldo.
import "@fontsource-variable/host-grotesk";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "@fontsource/unbounded/latin-400.css";
import "@fontsource/unbounded/latin-800.css";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-600.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { AppProviders } from "./app/providers";
import { crearRouter } from "./app/router";
import "./index.css";

const raiz = document.getElementById("root");
if (!raiz) throw new Error("No se encontró #root");

const router = crearRouter();

createRoot(raiz).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
