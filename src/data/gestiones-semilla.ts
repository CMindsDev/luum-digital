import { formatearFolio } from "@/domain/folios";
import type { Gestion } from "@/types";

/**
 * Gestiones simuladas iniciales («Mis gestiones»). Datos ficticios; nunca CURP, INE ni comprobantes.
 * - ges-0001 (Ana): Copia simple de cédula catastral, enviada y en revisión (DEMO-G-0000001).
 * - ges-0002 (Ana): Licencia de funcionamiento, borrador sin folio.
 * - ges-0003 (Bruno): Atención ciudadana por medios digitales, resuelta (DEMO-G-0000002).
 */

const DIA = 86_400_000;

function haceDias(ahora: Date, dias: number): string {
  return new Date(ahora.getTime() - dias * DIA).toISOString();
}

export const TOTAL_GESTIONES_CON_FOLIO = 2;

export function crearGestionesSemilla(ahora: Date): Gestion[] {
  return [
    {
      id: "ges-0001",
      folio: formatearFolio("gestion", 1),
      servicioId: "mid-cat-039",
      servicioNombre: "Copia Simple de Cédula Catastral Vigente",
      identidadId: "ana",
      tipo: "consulta_territorial",
      estado: "en_revision",
      datos: { nombreCompleto: "Ana Ek Canché", correo: "ana.ek@ejemplo.mx", motivo: "Consulta de ejemplo para la demostración." },
      camposReutilizados: ["nombreCompleto", "correo"],
      creadaEn: haceDias(ahora, 6),
      actualizadaEn: haceDias(ahora, 4),
      enviadaEn: haceDias(ahora, 6),
      historial: [
        { fecha: haceDias(ahora, 6), estado: "borrador", descripcion: "Borrador creado.", actor: "ciudadania" },
        { fecha: haceDias(ahora, 6), estado: "enviada", descripcion: "Solicitud simulada enviada con folio DEMO-G-0000001.", actor: "ciudadania" },
        { fecha: haceDias(ahora, 4), estado: "en_revision", descripcion: "En revisión (simulado).", actor: "sistema_demo" },
      ],
    },
    {
      id: "ges-0002",
      folio: null,
      servicioId: "mid-ftm-206",
      servicioNombre: "Licencia de Funcionamiento Municipal por Apertura de establecimientos comerciales (Alta).",
      identidadId: "ana",
      tipo: "formulario",
      estado: "borrador",
      datos: { nombreNegocio: "Cafetería de ejemplo", giro: "cafeteria" },
      camposReutilizados: [],
      creadaEn: haceDias(ahora, 2),
      actualizadaEn: haceDias(ahora, 2),
      historial: [{ fecha: haceDias(ahora, 2), estado: "borrador", descripcion: "Borrador guardado.", actor: "ciudadania" }],
    },
    {
      id: "ges-0003",
      folio: formatearFolio("gestion", 2),
      servicioId: "mid-pac-404",
      servicioNombre: "Atención Ciudadana por medios digitales",
      identidadId: "bruno",
      tipo: "formulario",
      estado: "resuelta",
      datos: { nombreCompleto: "Bruno Canul Pool", motivo: "Pregunta de ejemplo sobre horarios de atención." },
      camposReutilizados: ["nombreCompleto"],
      creadaEn: haceDias(ahora, 15),
      actualizadaEn: haceDias(ahora, 10),
      enviadaEn: haceDias(ahora, 15),
      historial: [
        { fecha: haceDias(ahora, 15), estado: "enviada", descripcion: "Solicitud simulada enviada con folio DEMO-G-0000002.", actor: "ciudadania" },
        { fecha: haceDias(ahora, 12), estado: "en_revision", descripcion: "En revisión (simulado).", actor: "sistema_demo" },
        { fecha: haceDias(ahora, 10), estado: "resuelta", descripcion: "Respuesta simulada enviada.", actor: "operador" },
      ],
    },
  ];
}
