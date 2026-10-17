import { Mail, Phone, UserRound, type LucideIcon } from "lucide-react";
import { z } from "zod";
import { correoSchema, nombreCompletoSchema, telefonoFicticioSchema } from "@/domain/validaciones";
import type { CampoReutilizable } from "@/types";

/**
 * Formulario de práctica del expediente: muestra cómo se piden los datos reutilizables con
 * confirmación campo por campo. No envía ni guarda nada.
 */
export const esquemaPractica = z.object({
  nombreCompleto: nombreCompletoSchema,
  correo: correoSchema,
  telefono: telefonoFicticioSchema,
});

export type EntradaPractica = z.input<typeof esquemaPractica>;
export type CampoPractica = keyof EntradaPractica;

export interface DefinicionCampoPractica {
  nombre: CampoPractica;
  etiqueta: string;
  icono: LucideIcon;
  tipo: "text" | "email" | "tel";
  autocompletar: string;
  marcador: string;
  ayuda: string;
  /** Dato del expediente que puede copiarse aquí. */
  reutilizable: CampoReutilizable["campo"];
}

export const CAMPOS_PRACTICA: readonly DefinicionCampoPractica[] = [
  {
    nombre: "nombreCompleto",
    etiqueta: "Nombre completo",
    icono: UserRound,
    tipo: "text",
    autocompletar: "name",
    marcador: "Nombre y apellidos",
    ayuda: "Como aparece en tu expediente de ejemplo.",
    reutilizable: "nombreCompleto",
  },
  {
    nombre: "correo",
    etiqueta: "Correo electrónico",
    icono: Mail,
    tipo: "email",
    autocompletar: "email",
    marcador: "nombre@ejemplo.mx",
    ayuda: "Usa un correo ficticio.",
    reutilizable: "correo",
  },
  {
    nombre: "telefono",
    etiqueta: "Teléfono",
    icono: Phone,
    tipo: "tel",
    autocompletar: "tel",
    marcador: "999 000 0000",
    ayuda: "10 dígitos. Usa un número ficticio.",
    reutilizable: "telefono",
  },
];

export const VALORES_VACIOS_PRACTICA: EntradaPractica = { nombreCompleto: "", correo: "", telefono: "" };

/** Campos copiados del expediente que siguen con el valor copiado (si la persona los editó, ya no cuentan). */
export function copiadosVigentes(copiados: Readonly<Record<string, string>>, valores: Readonly<Partial<Record<string, unknown>>>): string[] {
  return Object.entries(copiados)
    .filter(([nombre, valor]) => valores[nombre] === valor)
    .map(([nombre]) => nombre);
}
