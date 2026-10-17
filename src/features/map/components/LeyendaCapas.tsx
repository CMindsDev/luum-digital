import { Ban, Eye, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Badge, ButtonLink, cx, DemoTag, SegmentedControl, StatusBadge } from "@/design-system";
import type { CapaMapa, CapaMapaId, Rol } from "@/types";
import { CAPAS_VISOR, LEYENDA_DEMANDA_REPORTADA } from "../catalogo-capas";
import { ESTADOS_MUNICIPALES, type ModoVista, type Representacion, type ResolucionZonas } from "../estado-url";

/** Fuentes oficiales externas de información territorial (un enlace no es una integración). */
const SITIOS_TERRITORIALES = [
  { nombre: "Visor Urbano de Mérida", url: "https://visorurbano.merida.gob.mx/" },
  { nombre: "Geoportal de Mérida", url: "https://geoportal.merida.gob.mx/" },
] as const;

export interface LeyendaCapasProps {
  rol: Rol;
  vista: ModoVista;
  representacion: Representacion;
  resolucion: ResolucionZonas;
  onResolucion: (resolucion: ResolucionZonas) => void;
  /** Conteos de sedes verificadas (undefined mientras cargan). */
  sedes: { conCoordenadas: number; sinCoordenadas: number } | undefined;
  /** Contenido de la capa de bienestar agregada (sólo operación). */
  bienestar?: ReactNode;
  className?: string;
}

const REPRESENTACION_DE_CAPA: Partial<Record<CapaMapaId, Representacion>> = {
  incidencias_puntos: "puntos",
  incidencias_calor: "calor",
  incidencias_celdas: "celdas",
};

function Naturaleza({ capa }: { capa: CapaMapa }) {
  if (capa.id === "territorial_ilustrativa") {
    return (
      <Badge tono="neutro" icono={Ban}>
        No disponible
      </Badge>
    );
  }
  if (capa.naturaleza === "oficial") {
    return (
      <Badge tono="exito" icono={ShieldCheck}>
        Fuente oficial
      </Badge>
    );
  }
  return <DemoTag>{capa.id === "demanda_bienestar_agregada" ? "Datos ficticios" : "Demostración"}</DemoTag>;
}

function Muestra({ capa, props }: { capa: CapaMapa; props: LeyendaCapasProps }) {
  switch (capa.id) {
    case "incidencias_puntos":
      return (
        <div className="mt-2 space-y-2">
          <ul className="flex flex-wrap gap-1.5" aria-label="Colores por estado municipal">
            {ESTADOS_MUNICIPALES.map((estado) => (
              <li key={estado}>
                <StatusBadge estado={estado} />
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-2 text-sm text-tinta-suave">
            <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-lima-logo bg-marino text-xs font-semibold text-white">
              12
            </span>
            Grupo de incidencias cercanas. Un punto más grande indica riesgo declarado.
          </p>
        </div>
      );
    case "incidencias_calor":
      return (
        <div className="mt-2" aria-hidden="true">
          <div className="h-2.5 rounded-pildora bg-linear-to-r from-azul-suave via-ambar to-magenta-fuerte" />
          <div className="mt-1 flex justify-between text-xs text-tinta-suave">
            <span>Menos reportes</span>
            <span>Más reportes</span>
          </div>
        </div>
      );
    case "incidencias_celdas":
      return (
        <div className="mt-2 space-y-2">
          <div aria-hidden="true">
            <div className="h-2.5 rounded-pildora bg-linear-to-r from-ambar-suave via-ambar to-cafe" />
            <div className="mt-1 flex justify-between text-xs text-tinta-suave">
              <span>1 reporte</span>
              <span>Más reportes</span>
            </div>
          </div>
          <p className="text-sm font-medium text-tinta">{LEYENDA_DEMANDA_REPORTADA}</p>
          <SegmentedControl<"8" | "9">
            etiqueta="Tamaño de las zonas"
            guia="mapa.resolucion"
            valor={String(props.resolucion) === "9" ? "9" : "8"}
            onCambiar={(valor) => props.onResolucion(valor === "9" ? 9 : 8)}
            opciones={[
              { valor: "8", etiqueta: "Ciudad" },
              { valor: "9", etiqueta: "Colonia" },
            ]}
          />
        </div>
      );
    case "servicios_verificados":
      return (
        <p className="mt-2 text-sm text-tinta">
          {props.sedes
            ? `${props.sedes.conCoordenadas} en el mapa · ${props.sedes.sinCoordenadas} sólo con dirección publicada. `
            : "Cargando sedes… "}
          <a href="#ubicaciones-atencion" className="font-medium text-enlace underline underline-offset-2">
            Ver la lista de ubicaciones
          </a>
        </p>
      );
    case "territorial_ilustrativa":
      return (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-tinta">
            Para consultar predios, zonificación o usos de suelo, usa los sitios oficiales. Su información es de carácter informativo y la
            aclaración de datos de un predio corresponde a la Dirección de Catastro Municipal.
          </p>
          <div className="flex flex-wrap gap-2">
            {SITIOS_TERRITORIALES.map((sitio) => (
              <ButtonLink key={sitio.url} href={sitio.url} variante="secundario" tamano="sm">
                {sitio.nombre}
              </ButtonLink>
            ))}
          </div>
          <p className="text-xs text-tinta-suave">Sitios consultados el 17 de octubre de 2026. Abrir un sitio oficial no es una integración.</p>
        </div>
      );
    case "demanda_bienestar_agregada":
      return props.bienestar ? <div className="mt-2">{props.bienestar}</div> : null;
    default:
      return null;
  }
}

/**
 * Leyenda del Visor: cada capa por separado, con su naturaleza (demostración, fuente oficial o no
 * disponible) y su explicación. La capa de bienestar agregada sólo aparece para operación.
 */
export function LeyendaCapas(props: LeyendaCapasProps) {
  const { rol, vista, representacion, className } = props;
  const capas = CAPAS_VISOR.filter((capa) => capa.visiblePara.includes(rol));
  return (
    <section aria-labelledby="titulo-leyenda" data-guia="mapa.leyenda" className={cx("rounded-tarjeta border border-borde bg-superficie p-4", className)}>
      <h2 id="titulo-leyenda" className="text-lg font-semibold text-marino">
        Capas y leyenda
      </h2>
      <p className="mt-1 text-sm text-tinta-suave">Cada capa se rotula por separado. Ninguna decide la prioridad de atención.</p>
      <ul className="mt-3 divide-y divide-borde">
        {capas.map((capa) => {
          const activa = vista === "mapa" && REPRESENTACION_DE_CAPA[capa.id] === representacion;
          return (
            <li key={capa.id} className="py-3 first:pt-1 last:pb-0" data-capa={capa.id}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-tinta">{capa.nombre}</h3>
                <Naturaleza capa={capa} />
                {activa ? (
                  <Badge tono="marino" icono={Eye}>
                    En el mapa
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-tinta-suave">{capa.descripcion}</p>
              <Muestra capa={capa} props={props} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
