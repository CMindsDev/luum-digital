import "maplibre-gl/dist/maplibre-gl.css";
import type * as MaplibreGL from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { useMemo, useRef, useState } from "react";
import MapaGL, { AttributionControl, Layer, Marker, NavigationControl, Source, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import { msg } from "@/i18n";
import { leerColoresMapa } from "./colores";
import { LIMITES_NAVEGACION, textosMapa, ZOOM_MAXIMO, ZOOM_MINIMO, type ConfigMapa } from "./config";
import { convertirClic, crearControl, motivoDeFallo } from "./motor-comun";
import { PinMarcador } from "./PinMarcador";
import type { PropsMotorMapa } from "./tipos";

type ModuloMaplibre = typeof MaplibreGL;

/** Promesa compartida del motor; se reinicia si la descarga falla para poder reintentar. */
let promesaMotor: Promise<ModuloMaplibre> | null = null;

function cargarMaplibre(): Promise<ModuloMaplibre> {
  promesaMotor ??= import("maplibre-gl")
    .then((modulo) => {
      // MapLibre 6 es sólo ESM: el worker se sirve como recurso propio (CSP worker-src 'self').
      modulo.setWorkerUrl(workerUrl);
      return modulo;
    })
    .catch((error: unknown) => {
      promesaMotor = null;
      throw error;
    });
  return promesaMotor;
}

/** Estilo sin red (pruebas automatizadas): sólo un fondo liso con el color de superficie del design system. */
function estiloDe(config: ConfigMapa): string | MaplibreGL.StyleSpecification {
  if (!config.sinMapaBase) return config.estilo;
  return {
    version: 8,
    name: "Sin mapa base",
    sources: {},
    layers: [{ id: "fondo", type: "background", paint: { "background-color": leerColoresMapa()["superficie-2"] } }],
  };
}

/** Motor sin clave: MapLibre GL JS 6 + estilo de OpenFreeMap (atribución automática). */
export default function MotorMaplibre({
  config,
  etiqueta,
  idDescripcion,
  vistaInicial,
  fuentes,
  capasInteractivas,
  marcador,
  marcadores,
  cooperativo,
  sinAnimacion,
  onClic,
  interaccion = "normal",
  onPuntero,
  onMovido,
  onCargado,
  onFallo,
  registrarControl,
  children,
}: PropsMotorMapa) {
  const cargado = useRef(false);
  const [cursor, setCursor] = useState("");
  const textos = useMemo(() => textosMapa(etiqueta), [etiqueta]);
  const motor = useMemo(() => cargarMaplibre(), []);
  const estilo = useMemo(() => estiloDe(config), [config]);

  return (
    <MapaGL
      mapLib={motor}
      mapStyle={estilo}
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
      cursor={interaccion === "trazar" ? "crosshair" : interaccion === "mover" ? "grab" : cursor}
      dragPan={interaccion !== "trazar"}
      doubleClickZoom={interaccion === "normal"}
      style={{ width: "100%", height: "100%" }}
      onMouseEnter={() => setCursor("pointer")}
      onMouseLeave={() => { setCursor(""); onPuntero?.(null); }}
      onMouseMove={evento => onPuntero?.({ lat: evento.lngLat.lat, lng: evento.lngLat.lng })}
      onClick={(evento: MapLayerMouseEvent) => onClic?.(convertirClic(evento.lngLat, evento.features))}
      onMoveEnd={(evento) =>
        onMovido?.({ latitude: evento.viewState.latitude, longitude: evento.viewState.longitude, zoom: evento.viewState.zoom })
      }
      onLoad={(evento) => {
        cargado.current = true;
        const lienzo = evento.target.getCanvas();
        if (idDescripcion) lienzo.setAttribute("aria-describedby", idDescripcion);
        lienzo.addEventListener("webglcontextlost", () => onFallo(msg("Se perdió el contexto gráfico del mapa (WebGL).")), {
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
      {marcadores?.map(pin => <Marker key={pin.id} longitude={pin.posicion.lng} latitude={pin.posicion.lat} anchor="center" draggable={pin.arrastrable}
        onDragStart={() => pin.onArrastreIniciado?.()}
        onDrag={evento => pin.onArrastrando?.({ lat: evento.lngLat.lat, lng: evento.lngLat.lng })}
        onDragEnd={evento => pin.onArrastrado?.({ lat: evento.lngLat.lat, lng: evento.lngLat.lng })}>{pin.contenido}</Marker>)}
      {children}
    </MapaGL>
  );
}
