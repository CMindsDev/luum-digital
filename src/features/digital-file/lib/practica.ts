import type { TFunction } from "i18next";
import { Mail, Phone, UserRound, type LucideIcon } from "lucide-react";
import { z } from "zod";
import { msg } from "@/i18n";
import type { CampoReutilizable } from "@/types";

/**
 * Formulario de práctica del expediente: muestra cómo se piden los datos reutilizables con
 * confirmación campo por campo. No envía ni guarda nada.
 */
export function crearEsquemaPractica(t: TFunction = ((texto: string) => texto) as TFunction) {
  return z.object({
    nombreCompleto: z.string().trim().min(3, t("Escribe el nombre completo.")).max(120, t("Usa como máximo 120 caracteres.")),
    correo: z.email({ error: t("Escribe un correo válido.") }),
    telefono: z
      .string()
      .transform((valor) => valor.replace(/\s+/g, ""))
      .pipe(z.string().regex(/^\d{10}$/, t("Escribe un teléfono de 10 dígitos."))),
  });
}

export const esquemaPractica = crearEsquemaPractica();

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
    etiqueta: msg("Nombre completo"),
    icono: UserRound,
    tipo: "text",
    autocompletar: "name",
    marcador: msg("Nombre y apellidos"),
    ayuda: msg("Como aparece en tu expediente de ejemplo."),
    reutilizable: "nombreCompleto",
  },
  {
    nombre: "correo",
    etiqueta: msg("Correo electrónico"),
    icono: Mail,
    tipo: "email",
    autocompletar: "email",
    marcador: msg("nombre@ejemplo.mx"),
    ayuda: msg("Usa un correo ficticio."),
    reutilizable: "correo",
  },
  {
    nombre: "telefono",
    etiqueta: msg("Teléfono"),
    icono: Phone,
    tipo: "tel",
    autocompletar: "tel",
    marcador: msg("999 000 0000"),
    ayuda: msg("10 dígitos. Usa un número ficticio."),
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
