import { Suspense, useLayoutEffect, useRef, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { useSinConexion } from "@/app/hooks/useSinConexion";
import { DemoRibbon, LoadingState, OfflineNotice, SkipLink, Toaster } from "@/design-system";
import { AssistantMount } from "@/features/assistant/AssistantMount";
import { AvisoTraduccion } from "./AvisoTraduccion";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { RouteAnnouncer } from "./RouteAnnouncer";
import { SideNav } from "./SideNav";
import { SelectorIdioma } from "./SelectorIdioma";

/** Publica el alto real del rótulo + encabezado en --altura-encabezado (navegación lateral y anclas). */
function useAlturaEncabezado(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    const publicar = () =>
      document.documentElement.style.setProperty("--altura-encabezado", `${Math.round(elemento.getBoundingClientRect().height)}px`);
    publicar();
    if (typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver(publicar);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [ref]);
}

/**
 * AppShell único: rótulo permanente de demostración, un solo encabezado, navegación lateral
 * (tableta y escritorio) o barra inferior con «Más» (móvil), contenido principal y asistente.
 * El contenido reserva espacio para la barra inferior y el asistente (--altura-nav-inferior,
 * --espacio-asistente) para que nada tape botones ni texto.
 */
export function AppShell() {
  const { t } = useTranslation();
  const encabezadoRef = useRef<HTMLElement>(null);
  const sinConexion = useSinConexion();
  useAlturaEncabezado(encabezadoRef);
  const panelOperador = useLocation().pathname === "/operador";

  if (panelOperador) return (
    <div className="h-dvh overflow-hidden bg-fondo text-tinta flex flex-col">
      <SkipLink />
      <DemoRibbon />
      <div className="flex justify-end bg-marino px-3">
        <SelectorIdioma />
      </div>
      <AvisoTraduccion />
      <main id="contenido" tabIndex={-1} className="relative min-h-0 flex-1 outline-none">
        {sinConexion ? <OfflineNotice /> : null}
      <Suspense fallback={<LoadingState etiqueta={t("Abriendo centro de operaciones…")} />}><Outlet /></Suspense>
      </main>
      <Toaster /><RouteAnnouncer />
    </div>
  );

  return (
    <div className="min-h-dvh bg-fondo text-tinta">
      <SkipLink />
      <header ref={encabezadoRef} className="sticky top-0 z-40 shadow-suave">
        <DemoRibbon />
        <AvisoTraduccion />
        <Header />
      </header>

      <div className="flex w-full">
        <SideNav />
        <main id="contenido" tabIndex={-1} className="@container/pagina min-w-0 flex-1 outline-none">
          <div className="mx-auto w-full max-w-6xl px-4 pt-5 pb-[calc(var(--altura-nav-inferior)+var(--espacio-asistente)+2.5rem)] sm:px-6 sm:pt-6 lg:px-10 lg:pt-8">
            {sinConexion ? <OfflineNotice className="mb-5" /> : null}
            <Suspense fallback={<LoadingState etiqueta={t("Cargando sección…")} />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      <BottomNav />
      <Toaster />
      <AssistantMount />
      <RouteAnnouncer />
      <ScrollRestoration />
    </div>
  );
}
