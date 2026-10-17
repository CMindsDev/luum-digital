import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/design-system";
import { leerColoresMapa } from "@/components/mapa/colores";
import { configMapa } from "@/components/mapa/config";
import { MapaInteractivo } from "@/components/mapa/MapaInteractivo";
import type { ColeccionGeo, ControlMapa, FuenteMapa, GeometriaPoligono, MarcadorContenidoMapa } from "@/components/mapa/tipos";
import { diagnosticoArea } from "@/domain/area-operativa";
import type { Coordenadas, Reporte } from "@/types";
import { COLORES_TEMA, ETIQUETA_CATEGORIA_REPORTE, ICONO_REPORTE, TONO_REPORTE } from "../lib/categorias";

interface OperationalMapProps {
  reportes: readonly Reporte[];
  vertices: Coordenadas[];
  trazando: boolean;
  modoTrazo: "trazar" | "mover";
  seleccionado: number | null;
  onPunto: (punto: Coordenadas) => void;
  onSeleccionar: (id: string) => void;
  onSeleccionarVertice: (indice: number) => void;
  onIniciarArrastre: (indice: number) => void;
  onMoverVertice: (indice: number, punto: Coordenadas, provisional?: boolean) => void;
  onTerminarArrastre: (indice: number, punto: Coordenadas) => void;
  onCerrarArea: () => void;
}

export function OperationalMap({
  reportes,
  vertices,
  trazando,
  modoTrazo,
  seleccionado,
  onPunto,
  onSeleccionar,
  onSeleccionarVertice,
  onIniciarArrastre,
  onMoverVertice,
  onTerminarArrastre,
  onCerrarArea,
}: OperationalMapProps) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(11.4);
  const [puntero, setPuntero] = useState<Coordenadas | null>(null);
  const control = useRef<ControlMapa | null>(null);
  const arrastrando = useRef(false);
  const ultimoArrastre = useRef(0);

  const incidencias = useMemo(() => {
    const colores = leerColoresMapa();
    const fuentes: FuenteMapa[] = ["ambar", "magenta", "azul", "lima"].map((tono) => ({
      id: `operacion-${tono}`,
      agrupar: { radio: 44, zoomMaximo: 13 },
      datos: {
        type: "FeatureCollection",
        features: reportes
          .filter((r) => TONO_REPORTE[r.categoria] === tono)
          .map((r) => ({ type: "Feature", properties: { id: r.id }, geometry: { type: "Point", coordinates: [r.ubicacion.lng, r.ubicacion.lat] } })),
      },
      capas: [
        { id: `halo-${tono}`, type: "circle", paint: { "circle-color": colores[tono as "ambar" | "magenta" | "azul" | "lima"], "circle-radius": ["case", ["has", "point_count"], 29, 14], "circle-opacity": trazando ? 0.04 : 0.16 } },
        { id: `puntos-${tono}`, type: "circle", paint: { "circle-color": colores[tono as "ambar" | "magenta" | "azul" | "lima"], "circle-radius": ["case", ["has", "point_count"], 21, 8], "circle-stroke-color": colores.superficie, "circle-stroke-width": 3, "circle-opacity": trazando ? 0.3 : 1 } },
        { id: `cuenta-${tono}`, type: "symbol", filter: ["has", "point_count"], layout: { visibility: trazando ? "none" : "visible", "text-field": "{point_count_abbreviated}", "text-font": configMapa.fuentesRotulo, "text-size": 13, "text-allow-overlap": true }, paint: { "text-color": tono === "azul" ? colores.superficie : colores.cafe } },
      ],
    }));
    return fuentes;
  }, [reportes, trazando]);

  const fuentes = useMemo(() => {
    const colores = leerColoresMapa();
    const color = vertices.length >= 3 && diagnosticoArea(vertices) ? colores.peligro : colores.azul;
    const coords: [number, number][] = vertices.map((p) => [p.lng, p.lat]);
    const capasArea: FuenteMapa[] = [];
    if (coords.length >= 2) {
      capasArea.push({ id: "trazo-abierto", datos: { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } }] }, capas: [{ id: "trazo-linea", type: "line", layout: { "line-join": "round" }, paint: { "line-color": color, "line-width": 3 } }] });
    }
    if (coords.length >= 3) {
      const poligono: ColeccionGeo<GeometriaPoligono> = { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...coords, coords[0]!]] } }] };
      capasArea.push({ id: "area-seleccionada", datos: poligono, capas: [
        { id: "area-fondo", type: "fill", paint: { "fill-color": color, "fill-opacity": trazando ? 0.1 : 0.16 } },
        { id: "area-borde", type: "line", paint: { "line-color": color, "line-width": 3, ...(trazando ? { "line-dasharray": [2, 2] } : {}) } },
      ] });
    }
    if (trazando && modoTrazo === "trazar" && puntero && coords.length) {
      capasArea.push({ id: "siguiente-punto", datos: { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [coords.at(-1)!, [puntero.lng, puntero.lat]] } }] }, capas: [{ id: "siguiente-linea", type: "line", paint: { "line-color": colores.azul, "line-width": 2, "line-dasharray": [2, 2], "line-opacity": 0.7 } }] });
    }
    return [...incidencias, ...capasArea];
  }, [incidencias, vertices, puntero, trazando, modoTrazo]);

  const marcadores: MarcadorContenidoMapa[] = trazando
    ? vertices.map((posicion, indice) => ({
        id: `vertice-${indice}`,
        posicion,
        arrastrable: true,
        onArrastreIniciado: () => {
          arrastrando.current = true;
          setPuntero(null);
          onIniciarArrastre(indice);
        },
        onArrastrando: (punto) => onMoverVertice(indice, punto, true),
        onArrastrado: (punto) => {
          arrastrando.current = false;
          ultimoArrastre.current = Date.now();
          onTerminarArrastre(indice, punto);
        },
        contenido: (
          <button
            type="button"
            aria-label={indice === 0 && vertices.length >= 3 ? t("Punto 1: cerrar y analizar área") : t("Punto {{numero}}: arrastra para mover", { numero: indice + 1 })}
            aria-pressed={seleccionado === indice}
            title={indice === 0 && vertices.length >= 3 ? t("Toca para cerrar el área, o arrastra para corregir") : t("Arrastra para corregir. Usa las flechas del teclado para mover.")}
            className={`op-draw-vertex ${indice === 0 ? "op-draw-vertex-first" : ""}`}
            onFocus={() => onSeleccionarVertice(indice)}
            onClick={(e) => {
              e.stopPropagation();
              if (Date.now() - ultimoArrastre.current < 300) return;
              if (indice === 0 && vertices.length >= 3) onCerrarArea();
              else onSeleccionarVertice(indice);
            }}
            onKeyDown={(e) => {
              const movimientos: Record<string, Coordenadas> = { ArrowUp: { lat: 1, lng: 0 }, ArrowDown: { lat: -1, lng: 0 }, ArrowLeft: { lat: 0, lng: -1 }, ArrowRight: { lat: 0, lng: 1 } };
              const delta = movimientos[e.key];
              if (delta) {
                e.preventDefault();
                e.stopPropagation();
                const paso = 0.00001 * 2 ** (14 - zoom) * (e.shiftKey ? 5 : 1);
                onMoverVertice(indice, { lat: posicion.lat + delta.lat * paso, lng: posicion.lng + delta.lng * paso });
              }
            }}
          >
            {indice + 1}
            {indice === 0 && vertices.length >= 3 ? <span className="op-draw-close-label" aria-hidden="true">{t("Cerrar área")}</span> : null}
          </button>
        ),
      }))
    : zoom >= 14
      ? reportes.map((reporte) => ({
          id: reporte.id,
          posicion: reporte.ubicacion,
          contenido: (
            <button
              aria-label={t("Abrir {{categoria}} {{folio}}", { categoria: t(ETIQUETA_CATEGORIA_REPORTE[reporte.categoria]), folio: reporte.folio })}
              className={`op-map-pin ${COLORES_TEMA[TONO_REPORTE[reporte.categoria]]}`}
              onClick={(e) => {
                e.stopPropagation();
                onSeleccionar(reporte.id);
              }}
            >
              <img alt="" src={`/brand/tramites/${ICONO_REPORTE[reporte.categoria]}.svg`} />
            </button>
          ),
        }))
      : [];

  return (
    <MapaInteractivo
      etiqueta={t("Mapa operativo de Mérida")}
      descripcion={t("Incidencias ficticias agrupadas por categoría. La lista ofrece los mismos casos y acciones. Durante el trazado, haz clic para colocar los vértices.")}
      className="op-map h-full !rounded-none !border-0"
      fuentes={fuentes}
      capasInteractivas={trazando ? [] : ["ambar", "magenta", "azul", "lima"].map((tono) => `puntos-${tono}`)}
      onControl={(c) => {
        control.current = c;
      }}
      onMovido={(vista) => setZoom(vista.zoom)}
      marcadores={marcadores}
      interaccion={trazando ? modoTrazo : "normal"}
      onPuntero={trazando && modoTrazo === "trazar" ? (punto) => { if (!arrastrando.current) setPuntero(punto); } : undefined}
      onClic={(clic) => {
        if (trazando) {
          if (Date.now() - ultimoArrastre.current < 300) return;
          if (modoTrazo === "trazar") onPunto(clic.posicion);
          return;
        }
        const objeto = clic.objetos[0];
        if (typeof objeto?.propiedades.id === "string") onSeleccionar(objeto.propiedades.id);
        else if (objeto?.propiedades.cluster) control.current?.volarA({ centro: clic.posicion, zoom: (control.current.zoom() ?? 11) + 2 });
      }}
      respaldo={({ motivo, reintentar }) => (
        <div className="op-map-fallback flex h-full items-center justify-center p-8">
          <div className="max-w-sm rounded-tarjeta border border-borde bg-superficie p-6 shadow-elevada">
            <h2 className="font-semibold">{t("El mapa no está disponible")}</h2>
            <p className="my-3 text-sm text-tinta-suave">
              {motivo} {t("Puedes atender los casos desde la lista. Para delimitar un área, usa la captura de coordenadas.")}
            </p>
            <Button onClick={reintentar}>{t("Reintentar mapa")}</Button>
          </div>
        </div>
      )}
    />
  );
}
