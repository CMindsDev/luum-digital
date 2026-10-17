import type { Categoria } from "@/types";

/**
 * Combinaciones de color con contraste calculado (ver tokens.css). Se escriben completas para que
 * Tailwind las detecte al compilar.
 */

/** Tonos de mosaico del Laboratorio (coinciden con `Categoria.tono`). */
export type TonoMosaico = Categoria["tono"];

/** Fondo de color + texto/ícono del mosaico del Laboratorio. */
export const CLASES_MOSAICO: Record<TonoMosaico, { fondo: string; texto: string; icono: string }> = {
  // blanco sobre azul #005BE8 5.74:1
  azul: { fondo: "bg-azul", texto: "text-white", icono: "text-white" },
  // café sobre ámbar #FFB600 6.16:1
  ambar: { fondo: "bg-ambar", texto: "text-cafe", icono: "text-cafe" },
  // blanco sobre café #533630 10.84:1
  cafe: { fondo: "bg-cafe", texto: "text-white", icono: "text-white" },
  // blanco sobre magenta-fuerte #CC1F86 5.11:1 (con texto normal no se usa #F62FA2: 3.59:1)
  magenta: { fondo: "bg-magenta-fuerte", texto: "text-white", icono: "text-white" },
  // café sobre lima #A2D200 6.07:1
  lima: { fondo: "bg-lima", texto: "text-cafe", icono: "text-cafe" },
  // blanco sobre marino 12.06:1; ícono lima del logotipo 8.73:1
  marino: { fondo: "bg-marino", texto: "text-white", icono: "text-lima-logo" },
};

/** Borde inferior de color de los accesos rápidos (estilo Mérida Móvil). Decorativo. */
export const CLASES_BORDE_ACCESO: Record<TonoMosaico, string> = {
  azul: "border-b-azul",
  ambar: "border-b-ambar",
  cafe: "border-b-cafe",
  magenta: "border-b-magenta",
  lima: "border-b-verde",
  marino: "border-b-marino",
};

/** Contenedor del ícono en los accesos rápidos: fondo suave del tono. */
export const CLASES_ICONO_ACCESO: Record<TonoMosaico, string> = {
  azul: "bg-azul-suave",
  ambar: "bg-ambar-suave",
  cafe: "bg-cafe-suave",
  magenta: "bg-magenta-suave",
  lima: "bg-lima-suave",
  marino: "bg-marino-suave",
};

export type TonoInsignia =
  | "neutro"
  | "marino"
  | "azul"
  | "ambar"
  | "cafe"
  | "magenta"
  | "lima"
  | "exito"
  | "aviso"
  | "peligro"
  | "info";

/** Fondo suave + texto oscuro (todas ≥ 4.5:1; ver tokens.css). */
export const CLASES_INSIGNIA: Record<TonoInsignia, string> = {
  neutro: "bg-superficie-2 text-tinta border-borde",
  marino: "bg-marino-suave text-marino border-marino/20",
  azul: "bg-azul-suave text-enlace border-azul/25",
  ambar: "bg-ambar-suave text-cafe border-ambar/70",
  cafe: "bg-cafe-suave text-cafe border-cafe/20",
  magenta: "bg-magenta-suave text-magenta-tinta border-magenta/40",
  lima: "bg-lima-suave text-cafe border-lima",
  exito: "bg-exito-suave text-exito border-exito/25",
  aviso: "bg-aviso-suave text-aviso border-ambar/70",
  peligro: "bg-peligro-suave text-peligro border-peligro/25",
  info: "bg-info-suave text-info border-info/25",
};

/** Color del ícono dentro de una insignia (≥ 3:1 sobre su fondo). */
export const CLASES_ICONO_INSIGNIA: Record<TonoInsignia, string> = {
  neutro: "text-tinta-suave",
  marino: "text-marino",
  azul: "text-info",
  ambar: "text-cafe",
  cafe: "text-cafe",
  magenta: "text-magenta-tinta",
  lima: "text-cafe",
  exito: "text-exito",
  aviso: "text-aviso",
  peligro: "text-peligro",
  info: "text-info",
};
