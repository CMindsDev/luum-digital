import { LIMITES_MERIDA } from "@/domain/validaciones";
import type { Coordenadas } from "@/types";

/**
 * Ubicación del dispositivo. Sólo se llama tras un toque explícito en «Usar mi ubicación».
 * Si se rechaza o falla, se explica y la persona sigue con la dirección escrita o el mapa.
 */
export type MotivoFalloUbicacion = "sin_soporte" | "denegada" | "no_disponible" | "tiempo_agotado" | "fuera_de_merida";

export type ResultadoUbicacion =
  | { ok: true; coordenadas: Coordenadas; precisionMetros: number }
  | { ok: false; motivo: MotivoFalloUbicacion; mensaje: string };

export const MENSAJE_FALLO_UBICACION: Record<MotivoFalloUbicacion, string> = {
  sin_soporte: "Este navegador no puede compartir tu ubicación. Escribe la dirección o elígela en el mapa.",
  denegada:
    "No diste permiso para usar tu ubicación (o el navegador lo tiene bloqueado). No pasa nada: escribe la dirección o elígela en el mapa.",
  no_disponible: "No pudimos obtener tu ubicación en este momento. Escribe la dirección o elígela en el mapa.",
  tiempo_agotado: "Tu ubicación tardó demasiado en llegar. Escribe la dirección o elígela en el mapa.",
  fuera_de_merida:
    "Tu ubicación parece estar fuera del municipio de Mérida. Si el problema está en Mérida, escribe la dirección o elígela en el mapa.",
};

export const TIEMPO_MAXIMO_UBICACION_MS = 12_000;

function fallo(motivo: MotivoFalloUbicacion): ResultadoUbicacion {
  return { ok: false, motivo, mensaje: MENSAJE_FALLO_UBICACION[motivo] };
}

export function dentroDeMerida({ lat, lng }: Coordenadas): boolean {
  return lat >= LIMITES_MERIDA.latMin && lat <= LIMITES_MERIDA.latMax && lng >= LIMITES_MERIDA.lngMin && lng <= LIMITES_MERIDA.lngMax;
}

/** Traduce el código de GeolocationPositionError (1 permiso, 2 no disponible, 3 tiempo). */
export function motivoDeError(codigo: number): MotivoFalloUbicacion {
  if (codigo === 1) return "denegada";
  if (codigo === 3) return "tiempo_agotado";
  return "no_disponible";
}

export function solicitarUbicacionDispositivo(
  geolocalizacion: Pick<Geolocation, "getCurrentPosition"> | undefined = typeof navigator !== "undefined" ? navigator.geolocation : undefined,
): Promise<ResultadoUbicacion> {
  if (!geolocalizacion) return Promise.resolve(fallo("sin_soporte"));
  return new Promise((resolver) => {
    try {
      geolocalizacion.getCurrentPosition(
        (posicion) => {
          const coordenadas = { lat: posicion.coords.latitude, lng: posicion.coords.longitude };
          if (!dentroDeMerida(coordenadas)) {
            resolver(fallo("fuera_de_merida"));
            return;
          }
          resolver({ ok: true, coordenadas, precisionMetros: Math.round(posicion.coords.accuracy) });
        },
        (error) => resolver(fallo(motivoDeError(error.code))),
        { enableHighAccuracy: true, timeout: TIEMPO_MAXIMO_UBICACION_MS, maximumAge: 60_000 },
      );
    } catch {
      resolver(fallo("no_disponible"));
    }
  });
}
