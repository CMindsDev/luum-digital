import "@fontsource-variable/onest";
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
