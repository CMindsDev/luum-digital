import { LoaderCircle } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cx } from "@/design-system";
import { msg } from "@/i18n";
import type { Coordenadas } from "@/types";
import { configMapa, TIEMPO_LIMITE_CARGA_MS, VISTA_CIUDAD, type ConfigMapa } from "./config";
import { LimiteErrorMapa } from "./LimiteErrorMapa";
import type { ClicMapa, ControlMapa, EstadoCargaMapa, FuenteMapa, MarcadorMapa, MarcadorContenidoMapa, VistaMapa } from "./tipos";

/** Cada motor vive en su propio fragmento: sólo se descarga el que se usa y sólo al abrir un mapa. */
const MotorMaplibre = lazy(() => import("./MotorMaplibre"));
const MotorMapbox = lazy(() => import("./MotorMapbox"));
const MOTIVO_MAPA_LENTO = msg("El mapa tardó demasiado en cargar.");
const MOTIVO_SIN_CONEXION = msg("Sin conexión: el mapa base necesita internet.");
const ETIQUETA_CARGANDO_MAPA = msg("Cargando el mapa…");
const ETIQUETA_SIN_MAPA_BASE = msg("Mapa base omitido: pruebas automatizadas sin red externa");

function suscribirRed(aviso: () => void) {
  window.addEventListener("online", aviso);
  window.addEventListener("offline", aviso);
  return () => {
    window.removeEventListener("online", aviso);
    window.removeEventListener("offline", aviso);
  };
}

/** El mapa base necesita red real (la simulación de «sin conexión» de la demo sólo afecta a los datos). */
function useEnLinea(): boolean {
  return useSyncExternalStore(
    suscribirRed,
    () => navigator.onLine,
    () => true,
  );
}

function usePrefiereMenosMovimiento(): boolean {
  const consulta = "(prefers-reduced-motion: reduce)";
  return useSyncExternalStore(
    (aviso) => {
      if (typeof window.matchMedia !== "function") return () => undefined;
      const lista = window.matchMedia(consulta);
      lista.addEventListener("change", aviso);
      return () => lista.removeEventListener("change", aviso);
    },
    () => typeof window.matchMedia === "function" && window.matchMedia(consulta).matches,
    () => false,
  );
}

export interface FalloMapa {
  motivo: string;
  reintentar: () => void;
}

export interface MapaInteractivoProps {
  /** Nombre accesible del mapa (lienzo). */
  etiqueta: string;
  /** Descripción para lectores de pantalla (qué muestra y cómo usarlo sin el mapa). */
  descripcion?: ReactNode;
  vistaInicial?: VistaMapa;
  fuentes?: FuenteMapa[];
  capasInteractivas?: string[];
  marcador?: MarcadorMapa | null;
  marcadores?: MarcadorContenidoMapa[];
  /** Gestos cooperativos: recomendable cuando el mapa está dentro de un formulario desplazable. */
  cooperativo?: boolean;
  interaccion?: "normal" | "trazar" | "mover";
  onPuntero?: (posicion: Coordenadas | null) => void;
  onClic?: (clic: ClicMapa) => void;
  onMovido?: (vista: VistaMapa) => void;
  onEstado?: (estado: EstadoCargaMapa) => void;
  /** Recibe el control de cámara cuando el mapa está listo (y null al desmontarse). */
  onControl?: (control: ControlMapa | null) => void;
  /** Contenido del respaldo si el mapa no carga. Debe explicar qué sigue funcionando. */
  respaldo: (fallo: FalloMapa) => ReactNode;
  /** Elementos superpuestos al mapa (p. ej. una leyenda flotante). No deben tapar la atribución. */
  superposicion?: ReactNode;
  /** Tamaño del contenedor (alto obligatorio, p. ej. "h-80"). */
  className?: string;
  guia?: string;
  /** Configuración del motor (por omisión, la de la app). Útil en pruebas. */
  config?: ConfigMapa;
}

/**
 * Mapa con carga diferida, tiempo límite, manejo de error y pérdida de WebGL, y respaldo accesible.
 * Elige MapLibre + OpenFreeMap o Mapbox según `config` (src/components/mapa/config.ts). Si el mapa
 * falla, sólo se reemplaza el área del mapa: la lista y los formularios de la pantalla siguen.
 */
export function MapaInteractivo({
  etiqueta,
  descripcion,
  vistaInicial = VISTA_CIUDAD,
  fuentes = [],
  capasInteractivas = [],
  marcador = null,
  marcadores,
  cooperativo = false,
  onClic,
  interaccion = "normal",
  onPuntero,
  onMovido,
  onEstado,
  onControl,
  respaldo,
  superposicion,
  className,
  guia,
  config = configMapa,
}: MapaInteractivoProps) {
  const { t } = useTranslation();
  const idDescripcion = useId();
  const enLinea = useEnLinea();
  const sinAnimacion = usePrefiereMenosMovimiento();
  const [intento, setIntento] = useState(0);
  const [estado, setEstado] = useState<EstadoCargaMapa>("cargando");
  const [motivo, setMotivo] = useState("");

  const cambiarEstado = useCallback(
    (nuevo: EstadoCargaMapa, motivoFallo = "") => {
      setEstado((actual) => {
        // Un fallo es definitivo hasta reintentar; «listo» no revive un mapa que ya falló.
        if (actual === "fallido" && nuevo !== "cargando") return actual;
        return nuevo;
      });
      if (nuevo === "fallido") setMotivo(motivoFallo);
    },
    [],
  );

  useEffect(() => {
    onEstado?.(estado);
  }, [estado, onEstado]);

  // Sin red no hay mapa base: se muestra el respaldo de inmediato.
  const fallidoPorRed = !enLinea;

  // Tiempo límite de carga.
  useEffect(() => {
    if (estado !== "cargando" || fallidoPorRed) return;
    const temporizador = window.setTimeout(() => cambiarEstado("fallido", MOTIVO_MAPA_LENTO), TIEMPO_LIMITE_CARGA_MS);
    return () => window.clearTimeout(temporizador);
  }, [estado, intento, fallidoPorRed, cambiarEstado]);

  const reintentar = useCallback(() => {
    setMotivo("");
    setEstado("cargando");
    setIntento((n) => n + 1);
  }, []);

  const Motor = config.motor === "mapbox" ? MotorMapbox : MotorMaplibre;
  const fallido = estado === "fallido" || fallidoPorRed;

  return (
    <div className={cx("relative isolate overflow-hidden rounded-tarjeta border border-borde bg-superficie-2", className)} data-guia={guia} data-estado-mapa={fallido ? "fallido" : estado}>
      {descripcion ? (
        <div id={idDescripcion} className="sr-only">
          {descripcion}
        </div>
      ) : null}
      {fallido ? (
        <div className="h-full overflow-y-auto">
          {respaldo({ motivo: t(fallidoPorRed ? MOTIVO_SIN_CONEXION : motivo), reintentar })}
        </div>
      ) : (
        <>
          <LimiteErrorMapa key={`limite-${intento}`} onError={() => cambiarEstado("fallido", "No se pudo descargar el componente del mapa.")}>
            <Suspense fallback={null}>
              <Motor
                key={intento}
                config={config}
                etiqueta={etiqueta}
                idDescripcion={descripcion ? idDescripcion : undefined}
                vistaInicial={vistaInicial}
                fuentes={fuentes}
                capasInteractivas={capasInteractivas}
                marcador={marcador}
                marcadores={marcadores}
                cooperativo={cooperativo}
                sinAnimacion={sinAnimacion}
                onClic={onClic}
                interaccion={interaccion}
                onPuntero={onPuntero}
                onMovido={onMovido}
                onCargado={() => cambiarEstado("listo")}
                onFallo={(motivoFallo) => {
                  onControl?.(null);
                  cambiarEstado("fallido", motivoFallo);
                }}
                registrarControl={(control) => onControl?.(control)}
              />
            </Suspense>
          </LimiteErrorMapa>
          {estado === "cargando" ? (
            <div role="status" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-superficie-2/80">
              <span className="inline-flex items-center gap-2 rounded-pildora bg-superficie px-4 py-2 text-sm font-semibold text-tinta shadow-suave">
                <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                {t(ETIQUETA_CARGANDO_MAPA)}
              </span>
            </div>
          ) : null}
          {estado === "listo" ? superposicion : null}
          {estado === "listo" && config.sinMapaBase ? (
            <p className="pointer-events-none absolute top-2 left-2 z-10 rounded-pildora bg-superficie/90 px-3 py-1 text-xs font-medium text-tinta shadow-suave">
              {t(ETIQUETA_SIN_MAPA_BASE)}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
