import { List, MapPinOff, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { leerColoresMapa } from "@/components/mapa/colores";
import { configMapa, VISTA_CIUDAD, ZOOM_COLONIA } from "@/components/mapa/config";
import { MapaInteractivo } from "@/components/mapa/MapaInteractivo";
import type { ClicMapa, ControlMapa, EstadoCargaMapa, VistaMapa } from "@/components/mapa/tipos";
import { Button, cx } from "@/design-system";
import type { Coordenadas, DemandaAgregada, Reporte, UbicacionServicio } from "@/types";
import { capasInteractivas, construirFuentes, ID_CAPA } from "../capas";
import type { Representacion, ResolucionZonas } from "../estado-url";
import { celdasAGeoJSON, celdasDeIncidencias, conteoMaximo, incidenciasAGeoJSON, ubicacionesAGeoJSON } from "../incidencias";
import { useCamaraVisor } from "../store";

export interface MapaVisorProps {
  incidencias: readonly Reporte[];
  representacion: Representacion;
  resolucion: ResolucionZonas;
  /** Demanda de bienestar agregada (sólo operación y con la capa activa); null si no aplica. */
  bienestar: DemandaAgregada | null;
  sedes: readonly UbicacionServicio[];
  /** Si cambia, la cámara se centra ahí (p. ej. una incidencia abierta desde la URL). */
  centrarEn: Coordenadas | null;
  onSeleccionarReporte: (id: string) => void;
  onSeleccionarZona: (h3: string) => void;
  onEstado: (estado: EstadoCargaMapa) => void;
  onVerLista: () => void;
}

const ZOOM_ZONAS_COLONIA = 13;

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

/** Mapa del Visor Urbano con las capas de incidencias, zonas, bienestar agregado y sedes verificadas. */
export function MapaVisor({
  incidencias,
  representacion,
  resolucion,
  bienestar,
  sedes,
  centrarEn,
  onSeleccionarReporte,
  onSeleccionarZona,
  onEstado,
  onVerLista,
}: MapaVisorProps) {
  const control = useRef<ControlMapa | null>(null);
  const [listo, setListo] = useState(false);
  const [estado, setEstado] = useState<EstadoCargaMapa>("cargando");
  const colores = useMemo(() => leerColoresMapa(), []);
  const guardarCamara = useCamaraVisor((s) => s.guardar);
  // La cámara arranca donde se dejó (memoria de la sesión) o en la vista de ciudad.
  const [vistaInicial] = useState<VistaMapa>(() => useCamaraVisor.getState().vista ?? VISTA_CIUDAD);

  const fuentes = useMemo(() => {
    const celdas = celdasDeIncidencias(incidencias, resolucion);
    return construirFuentes({
      incidencias: incidenciasAGeoJSON(incidencias),
      celdas: celdasAGeoJSON(celdas),
      maximoCelda: conteoMaximo(celdas),
      bienestar: bienestar ? celdasAGeoJSON(bienestar.celdas) : null,
      maximoBienestar: bienestar ? conteoMaximo(bienestar.celdas) : 1,
      sedes: ubicacionesAGeoJSON(sedes),
      representacion,
      colores,
      fuentesRotulo: configMapa.fuentesRotulo,
    });
  }, [incidencias, resolucion, bienestar, sedes, representacion, colores]);

  useEffect(() => {
    if (!centrarEn || !listo) return;
    control.current?.volarA({ centro: centrarEn, zoom: Math.max(control.current.zoom(), ZOOM_COLONIA) });
  }, [centrarEn, listo]);

  // Las zonas de tamaño colonia (H3 res. 9) sólo se distinguen de cerca: se acerca la cámara.
  useEffect(() => {
    const camara = control.current;
    if (!listo || !camara || representacion !== "celdas" || resolucion !== 9 || camara.zoom() >= ZOOM_ZONAS_COLONIA) return;
    camara.volarA({ centro: camara.centro(), zoom: ZOOM_ZONAS_COLONIA });
  }, [listo, representacion, resolucion]);

  const alClic = (clic: ClicMapa) => {
    const objeto = clic.objetos[0];
    if (!objeto) return;
    if (objeto.capa === ID_CAPA.grupos) {
      const zoom = control.current?.zoom() ?? 12;
      control.current?.volarA({ centro: objeto.punto ?? clic.posicion, zoom: zoom + 2 });
      return;
    }
    if (objeto.capa === ID_CAPA.puntos) {
      const id = texto(objeto.propiedades.id);
      if (id) onSeleccionarReporte(id);
      return;
    }
    if (objeto.capa === ID_CAPA.celdasRelleno) {
      const h3 = texto(objeto.propiedades.h3);
      if (h3) onSeleccionarZona(h3);
    }
  };

  const total = incidencias.length;
  return (
    <MapaInteractivo
      etiqueta="Mapa del Visor Urbano con incidencias de demostración"
      descripcion={`El mapa muestra ${total} incidencias de demostración. Para revisarlas con teclado o lector de pantalla, usa la vista Lista; tiene los mismos filtros.`}
      vistaInicial={vistaInicial}
      fuentes={fuentes}
      capasInteractivas={capasInteractivas(representacion)}
      onClic={alClic}
      onMovido={guardarCamara}
      onEstado={(nuevo) => {
        setEstado(nuevo);
        onEstado(nuevo);
      }}
      onControl={(nuevo) => {
        control.current = nuevo;
        setListo(nuevo !== null);
      }}
      guia="mapa.mapa"
      className={cx(estado === "fallido" ? "h-auto" : "h-[62dvh] max-h-[40rem] min-h-80 lg:h-[36rem]")}
      respaldo={({ motivo, reintentar }) => (
        <div role="alert" className="flex flex-col gap-3 bg-aviso-suave p-5">
          <p className="flex items-start gap-2 text-[0.9375rem] text-tinta">
            <MapPinOff aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-aviso" />
            <span>
              <strong className="font-semibold">No pudimos cargar el mapa.</strong> {motivo} La lista de incidencias, los filtros y los
              formularios siguen funcionando: abajo tienes las mismas incidencias en lista.
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variante="secundario" tamano="sm" iconoInicio={RotateCcw} onClick={reintentar} data-guia="mapa.reintentar">
              Reintentar el mapa
            </Button>
            <Button variante="fantasma" tamano="sm" iconoInicio={List} onClick={onVerLista}>
              Cambiar a la vista Lista
            </Button>
          </div>
        </div>
      )}
    />
  );
}
