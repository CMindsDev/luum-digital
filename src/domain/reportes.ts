import { ReglaDeNegocioError } from "@/services/contracts/errors";
import type {
  Aportacion,
  CategoriaReporte,
  EstadoMunicipal,
  EventoReporte,
  FechaISO,
  MotivoCancelacion,
  NuevoReporteInput,
  Reporte,
} from "@/types";

/**
 * Máquina de estados del reporte (estado municipal, etiquetas de «Mis reportes» de Mérida Móvil):
 *
 *   registrado ──validar──▶ en_proceso ──registrar atención──▶ solucionado
 *        │                       │
 *        └──────cancelar─────────┴──▶ cancelado (con motivo)
 *
 * La verificación ciudadana es otro eje (ver verificacion.ts): un voto ciudadano nunca cambia el
 * estado municipal ni cierra un reporte.
 */

export const TRANSICIONES_REPORTE: Readonly<Record<EstadoMunicipal, readonly EstadoMunicipal[]>> = {
  registrado: ["en_proceso", "cancelado"],
  en_proceso: ["solucionado", "cancelado"],
  solucionado: [],
  cancelado: [],
};

/** Estados en los que el incidente sigue abierto (admite aportaciones y cuenta para duplicados). */
export const ESTADOS_ABIERTOS: readonly EstadoMunicipal[] = ["registrado", "en_proceso"];

export const NOMBRE_CATEGORIA_REPORTE: Record<CategoriaReporte, string> = {
  bache: "Bache",
  luminaria: "Luminaria",
  desazolve_rejilla: "Desazolve de rejilla",
  basura_via_publica: "Basura en vía pública",
  animal_muerto: "Animal muerto",
  parques_jardines: "Limpieza de parques y jardines",
  recoleccion_basura: "Queja por falta de recolección de basura",
};

export const CATEGORIAS_REPORTE: readonly CategoriaReporte[] = [
  "bache",
  "luminaria",
  "desazolve_rejilla",
  "basura_via_publica",
  "animal_muerto",
  "parques_jardines",
  "recoleccion_basura",
];

export const TEXTO_MOTIVO_CANCELACION: Record<MotivoCancelacion, string> = {
  duplicado: "Duplicado",
  no_procede: "No procede",
  fuera_de_competencia: "Fuera de competencia municipal",
  informacion_insuficiente: "Información insuficiente",
};

export function esCategoriaReporte(valor: string): valor is CategoriaReporte {
  return (CATEGORIAS_REPORTE as readonly string[]).includes(valor);
}

export function puedeTransicionar(de: EstadoMunicipal, a: EstadoMunicipal): boolean {
  return TRANSICIONES_REPORTE[de].includes(a);
}

export function estaAbierto(reporte: Pick<Reporte, "estadoMunicipal">): boolean {
  return ESTADOS_ABIERTOS.includes(reporte.estadoMunicipal);
}

function exigirTransicion(reporte: Reporte, a: EstadoMunicipal): void {
  if (!puedeTransicionar(reporte.estadoMunicipal, a)) {
    throw new ReglaDeNegocioError(
      "transicion_invalida",
      `No se puede pasar el reporte ${reporte.folio} de «${reporte.estadoMunicipal}» a «${a}».`,
    );
  }
}

function conEvento(reporte: Reporte, evento: EventoReporte, cambios: Partial<Reporte> = {}): Reporte {
  return { ...reporte, ...cambios, actualizadoEn: evento.fecha, historial: [...reporte.historial, evento] };
}

export function claveEventoReporteValidado(reporteId: string): string {
  return `reporte:${reporteId}:validado`;
}

export function crearReporte(
  input: NuevoReporteInput,
  datos: { id: string; folio: string; identidadId: string; fecha: FechaISO },
): Reporte {
  return {
    id: datos.id,
    folio: datos.folio,
    categoria: input.categoria,
    descripcion: input.descripcion.trim(),
    ubicacion: { ...input.ubicacion, referencia: input.ubicacion.referencia.trim() },
    tieneFoto: input.tieneFoto,
    riesgoDeclarado: input.riesgoDeclarado,
    identidadId: datos.identidadId,
    creadoEn: datos.fecha,
    actualizadoEn: datos.fecha,
    estadoMunicipal: "registrado",
    verificacion: "no_aplica",
    historial: [
      {
        fecha: datos.fecha,
        tipo: "creado",
        descripcion: `Reporte registrado con folio ${datos.folio} (simulado).`,
        actor: "ciudadania",
      },
    ],
    aportaciones: [],
    ...(input.asistencia ? { asistencia: input.asistencia } : {}),
  };
}

/** registrado -> en_proceso (validación del operador de demostración). */
export function validarReporte(reporte: Reporte, fecha: FechaISO): Reporte {
  exigirTransicion(reporte, "en_proceso");
  return conEvento(
    reporte,
    { fecha, tipo: "validado", descripcion: "Reporte validado: en proceso de atención (simulado).", actor: "operador" },
    { estadoMunicipal: "en_proceso" },
  );
}

/** en_proceso -> solucionado ("atención reportada"). Abre la verificación ciudadana. */
export function registrarAtencion(reporte: Reporte, nota: string, fecha: FechaISO): Reporte {
  exigirTransicion(reporte, "solucionado");
  const texto = nota.trim();
  return conEvento(
    reporte,
    {
      fecha,
      tipo: "atencion_registrada",
      descripcion: texto ? `Atención reportada por el Ayuntamiento (simulado): ${texto}` : "Atención reportada por el Ayuntamiento (simulado).",
      actor: "operador",
    },
    { estadoMunicipal: "solucionado", verificacion: "pendiente" },
  );
}

/** registrado | en_proceso -> cancelado, siempre con motivo. */
export function cancelarReporte(reporte: Reporte, motivo: MotivoCancelacion, fecha: FechaISO): Reporte {
  exigirTransicion(reporte, "cancelado");
  return conEvento(
    reporte,
    {
      fecha,
      tipo: "cancelado",
      descripcion: `Motivo de cancelación: ${TEXTO_MOTIVO_CANCELACION[motivo]} (simulado).`,
      actor: "operador",
    },
    { estadoMunicipal: "cancelado", motivoCancelacion: motivo, verificacion: "no_aplica" },
  );
}

/** Motivo que acompaña la cancelación/reversión de los puntos de un reporte cancelado. */
export function motivoPuntosCancelacion(reporte: Pick<Reporte, "folio">, motivo: MotivoCancelacion): string {
  return `Reporte cancelado: ${TEXTO_MOTIVO_CANCELACION[motivo]} (${reporte.folio})`;
}

/**
 * «Es el mismo incidente: aportar información». Añade la aportación al reporte existente:
 * no crea reporte nuevo ni genera puntos.
 */
export function agregarAportacion(reporte: Reporte, aportacion: Aportacion): Reporte {
  if (!estaAbierto(reporte)) {
    throw new ReglaDeNegocioError("reporte_cerrado", "Sólo puedes aportar información a reportes registrados o en proceso de atención.");
  }
  return conEvento(
    reporte,
    {
      fecha: aportacion.fecha,
      tipo: "aportacion",
      descripcion: "Otra persona aportó información sobre el mismo incidente.",
      actor: "ciudadania",
    },
    { aportaciones: [...reporte.aportaciones, aportacion] },
  );
}

/** Ordena del más reciente al más antiguo. */
export function ordenarPorFecha<T extends { creadoEn: string }>(lista: readonly T[]): T[] {
  return [...lista].sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : a.creadoEn > b.creadoEn ? -1 : 0));
}
