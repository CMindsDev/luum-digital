import type { BeneficioDemo } from "@/types";

/**
 * Beneficios FICTICIOS de ejemplo. No hay comercios, patrocinadores ni descuentos municipales o
 * fiscales reales: canjearlos sólo genera un código DEMO-B-… sin validez.
 */
export const BENEFICIOS_DEMO: readonly BeneficioDemo[] = [
  {
    id: "insignia-vecindad",
    nombre: "Insignia «Vecindad atenta» (ejemplo)",
    descripcion: "Insignia digital de ejemplo para tu perfil de demostración. No tiene valor monetario.",
    costoPuntos: 100,
    disponible: true,
    ejemplo: true,
  },
  {
    id: "fondo-pantalla",
    nombre: "Fondo de pantalla ilustrado (ejemplo)",
    descripcion: "Descarga simulada de un fondo de pantalla de ejemplo. No se entrega ningún archivo real.",
    costoPuntos: 150,
    disponible: true,
    ejemplo: true,
  },
  {
    id: "taller-huerto",
    nombre: "Lugar en un taller de huerto urbano (ejemplo)",
    descripcion: "Reserva simulada en un taller ficticio. No existe convocatoria ni sede real.",
    costoPuntos: 300,
    disponible: true,
    ejemplo: true,
  },
  {
    id: "recorrido-parques",
    nombre: "Recorrido guiado por parques (ejemplo)",
    descripcion: "Recorrido ficticio para mostrar cómo funcionaría un canje. No hay fechas ni cupos reales.",
    costoPuntos: 500,
    disponible: true,
    ejemplo: true,
  },
  {
    id: "kit-calle",
    nombre: "Kit para cuidar tu calle (ejemplo agotado)",
    descripcion: "Beneficio de ejemplo marcado como agotado para mostrar ese estado en la demostración.",
    costoPuntos: 250,
    disponible: false,
    ejemplo: true,
  },
];
