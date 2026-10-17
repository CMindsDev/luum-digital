import { useQuery } from "@tanstack/react-query";
import { IntegracionNoDisponibleError } from "@/services/contracts/errors";
import { modoIntegracionConfigurado } from "@/services/registry";
import type { TipoRecorrido } from "@/types";
import type { CampoEscenario, EscenarioDemo, OpcionCampo } from "@/data/recorridos-demo";
import type { VisitadorDemo } from "@/data/visitadores-demo";

export type { CampoEscenario, EscenarioDemo, OpcionCampo, VisitadorDemo };

/*
 * PUENTE TEMPORAL (pendiente de mover a src/services/hooks): la capa de servicios aún no expone
 * los escenarios ficticios de formulario (src/data/recorridos-demo.ts) ni el padrón ficticio de
 * visitadores (src/data/visitadores-demo.ts). Este archivo es el ÚNICO de los módulos de catálogo
 * y gestiones que los carga, en diferido y a través de TanStack Query, para que las pantallas
 * manejen carga y error igual que con los demás hooks.
 */

/** Escenario genérico por tipo de recorrido cuando la ficha no declara uno propio. */
const ESCENARIO_POR_TIPO: Partial<Record<TipoRecorrido, string>> = {
  formulario: "solicitud-en-linea-demo",
  cita: "cita-presencial-demo",
  pago: "pago-referencia-demo",
};

export function escenarioIdPara(tipo: TipoRecorrido, recorridoDemoId?: string): string | undefined {
  return recorridoDemoId ?? ESCENARIO_POR_TIPO[tipo];
}

/** Descripción ficticia de un formulario simulado (campos y esquema zod). */
export function useEscenarioDemo(id: string | undefined) {
  return useQuery({
    queryKey: ["catalogo", "escenario-demo", id],
    queryFn: async (): Promise<EscenarioDemo | null> => {
      const { buscarEscenario } = await import("@/data/recorridos-demo");
      return buscarEscenario(id);
    },
    enabled: Boolean(id),
    staleTime: Infinity,
  });
}

export interface ConsultaCredencial {
  /** Código normalizado que se consultó. */
  codigo: string;
  /** El código tiene el formato de las credenciales de ejemplo (EJEMPLO-V-####). */
  esCodigoDeEjemplo: boolean;
  visitador: VisitadorDemo | null;
}

export const PATRON_CREDENCIAL_EJEMPLO = /^EJEMPLO-V-\d{4}$/;

export function normalizarCredencial(texto: string): string {
  return texto.trim().toUpperCase().replace(/\s+/g, "").replace(/[–—_]/g, "-");
}

/**
 * Consulta en el padrón FICTICIO de la demostración. Nunca valida identificaciones reales.
 * En modo de integración real no hay adaptador: falla con IntegracionNoDisponibleError.
 */
export function useConsultaCredencialDemo(codigo: string | null) {
  return useQuery({
    queryKey: ["catalogo", "credencial-demo", codigo],
    queryFn: async (): Promise<ConsultaCredencial> => {
      if (modoIntegracionConfigurado() === "real") throw new IntegracionNoDisponibleError("VerificacionDeVisitadores");
      const normalizado = normalizarCredencial(codigo ?? "");
      const esCodigoDeEjemplo = PATRON_CREDENCIAL_EJEMPLO.test(normalizado);
      if (!esCodigoDeEjemplo) return { codigo: normalizado, esCodigoDeEjemplo, visitador: null };
      const { VISITADORES_DEMO } = await import("@/data/visitadores-demo");
      return { codigo: normalizado, esCodigoDeEjemplo, visitador: VISITADORES_DEMO.find((v) => v.credencial === normalizado) ?? null };
    },
    enabled: Boolean(codigo?.trim()),
    staleTime: Infinity,
  });
}
