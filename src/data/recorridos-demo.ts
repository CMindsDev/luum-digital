import { z } from "zod";
import { codigoPostalSchema, correoSchema, nombreCompletoSchema, telefonoFicticioSchema } from "@/domain/validaciones";
import type { CampoReutilizable } from "@/types";

/**
 * Escenarios FICTICIOS de formulario para los recorridos simulados (formulario, cita y pago).
 * Los componentes genéricos (FormFlow, AppointmentFlow, PaymentFlow) los renderizan a partir de esta
 * descripción: para un trámite nuevo se agrega un escenario aquí, no un componente.
 *
 * Reglas: nunca se piden CURP, INE ni comprobantes reales; los montos son ficticios y se rotulan
 * «Monto ficticio de demostración»; los horarios son de ejemplo, no horarios oficiales.
 */

export type TipoCampoEscenario = "texto" | "texto_largo" | "numero" | "fecha" | "hora" | "seleccion" | "casilla" | "telefono" | "correo";

export interface OpcionCampo {
  valor: string;
  etiqueta: string;
}

export interface CampoEscenario {
  /** Clave del dato en `Gestion.datos`. */
  nombre: string;
  etiqueta: string;
  tipo: TipoCampoEscenario;
  ayuda?: string;
  marcador?: string;
  opciones?: readonly OpcionCampo[];
  /** Campo del Expediente Digital ficticio que puede reutilizarse (siempre con confirmación). */
  reutilizable?: CampoReutilizable["campo"];
  /** Valor del atributo autocomplete. */
  autocompletar?: string;
}

export interface MontoDemo {
  montoDemo: number;
  concepto: string;
  leyenda: "Monto ficticio de demostración";
}

export interface EscenarioDemo {
  id: string;
  titulo: string;
  tipo: "formulario" | "cita" | "pago";
  descripcion: string;
  leyenda: string;
  campos: readonly CampoEscenario[];
  /** Validación de los campos (zod). */
  esquema: z.ZodObject;
  monto?: MontoDemo;
  /** Horarios de ejemplo para citas (no son horarios oficiales). */
  horariosEjemplo?: readonly string[];
  /** Para citas: la sede se elige entre los módulos publicados en la ficha (canales presenciales). */
  sedeDesdeCanales?: boolean;
}

const LEYENDA_FORMULARIO = "Formulario ficticio de demostración: no envía nada a ningún sistema municipal.";
const LEYENDA_MONTO = "Monto ficticio de demostración" as const;

const motivoSchema = z
  .string()
  .trim()
  .min(15, "Cuéntanos tu solicitud con al menos 15 caracteres.")
  .max(300, "Usa como máximo 300 caracteres.");

const confirmacionSchema = z.literal(true, { error: "Confirma que entiendes que es una simulación." });

function fechaFuturaSchema() {
  return z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Elige una fecha.")
    .refine((valor) => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      return new Date(`${valor}T00:00:00`) > hoy;
    }, "Elige una fecha a partir de mañana.");
}

const campoNombre: CampoEscenario = {
  nombre: "nombreCompleto",
  etiqueta: "Nombre completo",
  tipo: "texto",
  ayuda: "Puedes usar el de tu Expediente Digital de ejemplo.",
  reutilizable: "nombreCompleto",
  autocompletar: "name",
};

const campoCorreo: CampoEscenario = {
  nombre: "correo",
  etiqueta: "Correo electrónico",
  tipo: "correo",
  ayuda: "Usa un correo ficticio, por ejemplo nombre@ejemplo.mx.",
  reutilizable: "correo",
  autocompletar: "email",
};

const campoTelefono: CampoEscenario = {
  nombre: "telefono",
  etiqueta: "Teléfono",
  tipo: "telefono",
  ayuda: "10 dígitos. Usa un número ficticio, por ejemplo 999 000 0000.",
  reutilizable: "telefono",
  autocompletar: "tel",
};

const campoConfirmacion: CampoEscenario = {
  nombre: "entiendoSimulacion",
  etiqueta: "Entiendo que es una simulación y que no realiza gestiones oficiales",
  tipo: "casilla",
};

export const ESCENARIOS_DEMO: readonly EscenarioDemo[] = [
  {
    id: "solicitud-en-linea-demo",
    titulo: "Solicitud en línea (simulada)",
    tipo: "formulario",
    descripcion: "Captura los datos básicos de una solicitud. Al enviarla recibirás un folio DEMO-G-… sin validez.",
    leyenda: LEYENDA_FORMULARIO,
    campos: [
      campoNombre,
      campoCorreo,
      campoTelefono,
      { nombre: "motivo", etiqueta: "¿Qué necesitas?", tipo: "texto_largo", ayuda: "Entre 15 y 300 caracteres." },
      campoConfirmacion,
    ],
    esquema: z.object({
      nombreCompleto: nombreCompletoSchema,
      correo: correoSchema,
      telefono: telefonoFicticioSchema,
      motivo: motivoSchema,
      entiendoSimulacion: confirmacionSchema,
    }),
  },
  {
    id: "apertura-negocio-demo",
    titulo: "Datos de tu negocio (simulado)",
    tipo: "formulario",
    descripcion: "Ejemplo de captura para trámites de negocio. No consulta padrones ni calcula derechos reales.",
    leyenda: LEYENDA_FORMULARIO,
    campos: [
      campoNombre,
      campoCorreo,
      { nombre: "nombreNegocio", etiqueta: "Nombre del negocio", tipo: "texto", ayuda: "Nombre comercial de ejemplo." },
      {
        nombre: "giro",
        etiqueta: "Giro",
        tipo: "seleccion",
        ayuda: "Giros de ejemplo para la demostración.",
        opciones: [
          { valor: "abarrotes", etiqueta: "Tienda de abarrotes (ejemplo)" },
          { valor: "cafeteria", etiqueta: "Cafetería (ejemplo)" },
          { valor: "papeleria", etiqueta: "Papelería (ejemplo)" },
          { valor: "otro", etiqueta: "Otro giro (ejemplo)" },
        ],
      },
      { nombre: "calle", etiqueta: "Calle del negocio", tipo: "texto", reutilizable: "calle", autocompletar: "address-line1" },
      { nombre: "colonia", etiqueta: "Colonia", tipo: "texto", reutilizable: "colonia" },
      { nombre: "codigoPostal", etiqueta: "Código postal", tipo: "texto", ayuda: "5 dígitos.", reutilizable: "codigoPostal", autocompletar: "postal-code" },
      { nombre: "superficie", etiqueta: "Superficie aproximada (m²)", tipo: "numero", ayuda: "Sólo para el ejemplo." },
      campoConfirmacion,
    ],
    esquema: z.object({
      nombreCompleto: nombreCompletoSchema,
      correo: correoSchema,
      nombreNegocio: z.string().trim().min(3, "Escribe el nombre del negocio.").max(80, "Usa como máximo 80 caracteres."),
      giro: z.enum(["abarrotes", "cafeteria", "papeleria", "otro"], { error: "Elige un giro." }),
      calle: z.string().trim().min(3, "Escribe la calle.").max(80, "Usa como máximo 80 caracteres."),
      colonia: z.string().trim().min(3, "Escribe la colonia.").max(80, "Usa como máximo 80 caracteres."),
      codigoPostal: codigoPostalSchema,
      superficie: z.coerce.number({ error: "Escribe un número." }).positive("Debe ser mayor que cero.").max(100_000, "Revisa la superficie."),
      entiendoSimulacion: confirmacionSchema,
    }),
  },
  {
    id: "demanda-ciudadana-demo",
    titulo: "Demanda ciudadana (simulada)",
    tipo: "formulario",
    descripcion:
      "Ejemplo del formulario de Demanda Ciudadana del Portal Ciudadano. En la demostración no se identifica a ninguna persona servidora pública.",
    leyenda: LEYENDA_FORMULARIO,
    campos: [
      {
        nombre: "tipoDemanda",
        etiqueta: "Tipo de demanda",
        tipo: "seleccion",
        opciones: [
          { valor: "negacion", etiqueta: "Negación de la gestión sin causa justificada" },
          { valor: "incumplimiento", etiqueta: "Alteración o incumplimiento en lo establecido" },
        ],
      },
      { nombre: "tramite", etiqueta: "Trámite o servicio", tipo: "texto", ayuda: "Nombre o clave del trámite (por ejemplo MID-CAT-039)." },
      { nombre: "hechos", etiqueta: "¿Qué pasó?", tipo: "texto_largo", ayuda: "Entre 15 y 300 caracteres. No escribas datos personales de nadie." },
      campoCorreo,
      campoConfirmacion,
    ],
    esquema: z.object({
      tipoDemanda: z.enum(["negacion", "incumplimiento"], { error: "Elige el tipo de demanda." }),
      tramite: z.string().trim().min(3, "Escribe el trámite o servicio.").max(120, "Usa como máximo 120 caracteres."),
      hechos: motivoSchema,
      correo: correoSchema,
      entiendoSimulacion: confirmacionSchema,
    }),
  },
  {
    id: "cita-presencial-demo",
    titulo: "Solicitud de cita (simulada)",
    tipo: "cita",
    descripcion:
      "Elige una sede publicada en la ficha y un horario de ejemplo. La solicitud es simulada: nadie la recibe y no reserva ningún lugar.",
    leyenda: "Solicitud de cita simulada. Los horarios son de ejemplo, no horarios oficiales.",
    campos: [
      campoNombre,
      campoTelefono,
      { nombre: "sede", etiqueta: "Sede", tipo: "seleccion", ayuda: "Sedes publicadas en la ficha oficial." },
      { nombre: "fecha", etiqueta: "Fecha", tipo: "fecha", ayuda: "A partir de mañana." },
      { nombre: "hora", etiqueta: "Horario de ejemplo", tipo: "hora" },
      campoConfirmacion,
    ],
    esquema: z.object({
      nombreCompleto: nombreCompletoSchema,
      telefono: telefonoFicticioSchema,
      sede: z.string().trim().min(1, "Elige una sede."),
      fecha: fechaFuturaSchema(),
      hora: z.string().regex(/^\d{2}:\d{2}$/, "Elige un horario."),
      entiendoSimulacion: confirmacionSchema,
    }),
    horariosEjemplo: ["09:00", "10:30", "12:00", "13:30"],
    sedeDesdeCanales: true,
  },
  {
    id: "pago-referencia-demo",
    titulo: "Pago simulado",
    tipo: "pago",
    descripcion: "Recorrido de pago de ejemplo. Nunca pidas ni escribas datos de tarjetas reales.",
    leyenda: "Pago simulado: no se cobra nada y no se genera ningún recibo fiscal.",
    campos: [
      campoNombre,
      campoCorreo,
      {
        nombre: "metodo",
        etiqueta: "Método de pago simulado",
        tipo: "seleccion",
        opciones: [
          { valor: "tarjeta_demo", etiqueta: "Tarjeta de demostración (no escribas datos reales)" },
          { valor: "referencia_demo", etiqueta: "Referencia de pago de demostración" },
        ],
      },
      campoConfirmacion,
    ],
    esquema: z.object({
      nombreCompleto: nombreCompletoSchema,
      correo: correoSchema,
      metodo: z.enum(["tarjeta_demo", "referencia_demo"], { error: "Elige un método simulado." }),
      entiendoSimulacion: confirmacionSchema,
    }),
    monto: { montoDemo: 250, concepto: "Derecho de ejemplo", leyenda: LEYENDA_MONTO },
  },
  {
    id: "pago-predial-demo",
    titulo: "Pago de predial (simulado)",
    tipo: "pago",
    descripcion:
      "Ejemplo del recorrido de pago de predial. No consulta el padrón catastral real ni calcula el impuesto: el monto es ficticio.",
    leyenda: "Pago simulado: no se cobra nada y no se genera ningún recibo fiscal.",
    campos: [
      campoNombre,
      {
        nombre: "referenciaPredio",
        etiqueta: "Referencia del predio (ejemplo)",
        tipo: "texto",
        ayuda: "Escribe cualquier texto de ejemplo. No escribas claves catastrales reales.",
        marcador: "Predio de ejemplo",
      },
      {
        nombre: "metodo",
        etiqueta: "Método de pago simulado",
        tipo: "seleccion",
        opciones: [
          { valor: "tarjeta_demo", etiqueta: "Tarjeta de demostración (no escribas datos reales)" },
          { valor: "referencia_demo", etiqueta: "Referencia de pago de demostración" },
        ],
      },
      campoConfirmacion,
    ],
    esquema: z.object({
      nombreCompleto: nombreCompletoSchema,
      referenciaPredio: z.string().trim().min(3, "Escribe una referencia de ejemplo.").max(60, "Usa como máximo 60 caracteres."),
      metodo: z.enum(["tarjeta_demo", "referencia_demo"], { error: "Elige un método simulado." }),
      entiendoSimulacion: confirmacionSchema,
    }),
    monto: { montoDemo: 1234, concepto: "Predial de ejemplo", leyenda: LEYENDA_MONTO },
  },
];

export function buscarEscenario(id: string | undefined): EscenarioDemo | null {
  if (!id) return null;
  return ESCENARIOS_DEMO.find((escenario) => escenario.id === id) ?? null;
}
