import "mapbox-gl/dist/mapbox-gl.css";
import { useMemo, useRef, useState } from "react";
import MapaGL, { AttributionControl, Layer, Marker, NavigationControl, Source, type MapLib, type MapMouseEvent } from "react-map-gl/mapbox";
import { LIMITES_NAVEGACION, textosMapa, ZOOM_MAXIMO, ZOOM_MINIMO } from "./config";
import { convertirClic, crearControl, motivoDeFallo } from "./motor-comun";
import { PinMarcador } from "./PinMarcador";
import type { PropsMotorMapa } from "./tipos";

/** Promesa compartida del motor; se reinicia si la descarga falla para poder reintentar. */
let promesaMotor: Promise<MapLib> | null = null;

/**
 * Comprobación en tiempo de ejecución del módulo cargado. Los tipos del entry ESM de Mapbox se
 * declaran aparte de los del entry principal (que usa react-map-gl), así que no se comparan.
 */
function esMotorMapbox(modulo: unknown): modulo is MapLib {
  return typeof modulo === "object" && modulo !== null && "Map" in modulo && typeof modulo.Map === "function";
}

function cargarMapbox(): Promise<MapLib> {
  // Entry ESM de Mapbox GL JS (núcleo más ligero; módulos opcionales bajo demanda).
  promesaMotor ??= import("mapbox-gl/esm")
    .then((modulo: unknown) => {
      if (!esMotorMapbox(modulo)) throw new Error("No se pudo iniciar Mapbox GL JS.");
      return modulo;
    })
    .catch((error: unknown) => {
      promesaMotor = null;
      throw error;
    });
  return promesaMotor;
}

/**
 * Motor con token público (pk.) de Mapbox. El logotipo y la atribución de Mapbox se muestran siempre
 * (control por omisión); las capas propias no los tapan.
 */
export default function MotorMapbox({
  config,
  etiqueta,
  idDescripcion,
  vistaInicial,
  fuentes,
  capasInteractivas,
  marcador,
  cooperativo,
  sinAnimacion,
  onClic,
  onMovido,
  onCargado,
  onFallo,
  registrarControl,
  children,
}: PropsMotorMapa) {
  const cargado = useRef(false);
  const [cursor, setCursor] = useState("");
  const textos = useMemo(() => textosMapa(etiqueta), [etiqueta]);
  const motor = useMemo(() => cargarMapbox(), []);

  return (
    <MapaGL
      mapLib={motor}
      mapboxAccessToken={config.tokenMapbox ?? undefined}
      mapStyle={config.estilo}
      initialViewState={vistaInicial}
      minZoom={ZOOM_MINIMO}
      maxZoom={ZOOM_MAXIMO}
      maxBounds={LIMITES_NAVEGACION}
      locale={textos}
      cooperativeGestures={cooperativo}
      dragRotate={false}
      pitchWithRotate={false}
      touchPitch={false}
      attributionControl={false}
      interactiveLayerIds={capasInteractivas}
      cursor={cursor}
      style={{ width: "100%", height: "100%" }}
      onMouseEnter={() => setCursor("pointer")}
      onMouseLeave={() => setCursor("")}
      onClick={(evento: MapMouseEvent) => onClic?.(convertirClic(evento.lngLat, evento.features))}
      onMoveEnd={(evento) =>
        onMovido?.({ latitude: evento.viewState.latitude, longitude: evento.viewState.longitude, zoom: evento.viewState.zoom })
      }
      onLoad={(evento) => {
        cargado.current = true;
        const lienzo = evento.target.getCanvas();
        if (idDescripcion) lienzo.setAttribute("aria-describedby", idDescripcion);
        lienzo.addEventListener("webglcontextlost", () => onFallo("Se perdió el contexto gráfico del mapa (WebGL)."), {
          once: true,
        });
        registrarControl(crearControl(evento.target, sinAnimacion));
        onCargado();
      }}
      onRemove={() => registrarControl(null)}
      onError={(evento) => {
        // Antes de cargar, cualquier error (estilo, WebGL, motor) activa el respaldo. Después, los
        // errores de una tesela o una fuente tipográfica no impiden usar el mapa.
        if (!cargado.current) onFallo(motivoDeFallo(evento.error));
      }}
    >
      <NavigationControl position="top-right" showCompass={false} />
      {/* Atribución abajo a la izquierda: el botón flotante del asistente (abajo a la derecha) no la tapa. */}
      <AttributionControl position="bottom-left" compact={false} />
      {fuentes.map((fuente) => (
        <Source
          key={fuente.id}
          id={fuente.id}
          type="geojson"
          data={fuente.datos}
          cluster={Boolean(fuente.agrupar)}
          clusterRadius={fuente.agrupar?.radio}
          clusterMaxZoom={fuente.agrupar?.zoomMaximo}
        >
          {fuente.capas.map((capa) => (
            <Layer key={capa.id} {...capa} />
          ))}
        </Source>
      ))}
      {marcador ? (
        <Marker
          longitude={marcador.posicion.lng}
          latitude={marcador.posicion.lat}
          anchor="bottom"
          draggable={marcador.arrastrable}
          onDragEnd={(evento) => marcador.onArrastrado?.({ lat: evento.lngLat.lat, lng: evento.lngLat.lng })}
        >
          <PinMarcador etiqueta={marcador.etiqueta} />
        </Marker>
      ) : null}
      {children}
    </MapaGL>
  );
}
