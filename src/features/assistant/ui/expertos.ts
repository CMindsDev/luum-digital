import { createContext, type CSSProperties } from "react";
import type { ExpertoAsistente } from "@shared/asistente/expertos";
import { msg } from "@/i18n";

export const ExpertoPekitoContext = createContext<ExpertoAsistente | null>(null);
export const TransicionExpertoContext = createContext(false);
export const DURACION_MORPH_MS = 1_400;
export const ESTILO_TRANSICION_EXPERTO = { "--pekito-duracion-morph": `${DURACION_MORPH_MS}ms` } as CSSProperties;

export const AVATARES = {
  general: { ruta: "pekito-mascota.svg", ancho: 212.885, alto: 198.681, etiqueta: msg("Peekito · Tu guía municipal") },
  bienestar: { ruta: "alma.svg", ancho: 120.724, alto: 164, etiqueta: msg("Alma · Salud mental") },
  urbano: { ruta: "urbano.svg", ancho: 136.092, alto: 281, etiqueta: msg("Orientación urbana y catastro") },
  juridico: { ruta: "juridico.svg", ancho: 127.001, alto: 215.904, etiqueta: msg("Orientación jurídica municipal") },
  tramites: { ruta: "tortuga.svg", ancho: 200, alto: 160, etiqueta: msg("Trámites y pagos") },
  medio_ambiente: { ruta: "iguana.svg", ancho: 200, alto: 160, etiqueta: msg("Medio ambiente y servicios públicos") },
} satisfies Record<ExpertoAsistente, { ruta: string; ancho: number; alto: number; etiqueta: string }>;
