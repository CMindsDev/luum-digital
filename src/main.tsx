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
import { cambiarIdioma, iniciarI18n } from "./i18n";
import "./index.css";

const raiz = document.getElementById("root");
if (!raiz) throw new Error("No se encontró #root");

const router = crearRouter();
const root = createRoot(raiz);

function montarAplicacion() {
  root.render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  );
}

function mostrarErrorIdioma() {
  root.render(
    <main lang="es-MX" className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold">No pudimos cargar el idioma</h1>
      <p role="alert" className="my-4">Revisa tu conexión e intenta de nuevo, o continúa en español.</p>
      <button type="button" className="min-h-11 rounded-boton px-4 underline" onClick={() => window.location.reload()}>
        Reintentar
      </button>
      <button
        type="button"
        className="min-h-11 rounded-boton px-4 underline"
        onClick={() => void cambiarIdioma("es").then(montarAplicacion).catch(mostrarErrorIdioma)}
      >
        Continuar en español
      </button>
    </main>,
  );
}

// El idioma guardado (si es maya) se carga antes de pintar para que no parpadee el español.
void iniciarI18n().then(montarAplicacion).catch(mostrarErrorIdioma);
