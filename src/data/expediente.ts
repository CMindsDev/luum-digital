import type { DocumentoDemo, PerfilDemo, PreferenciasPrivacidad } from "@/types";

/**
 * Expediente Digital FICTICIO por identidad de demostración. Nunca contiene CURP, INE ni
 * comprobantes reales: cada documento lleva la marca «DOCUMENTO DE EJEMPLO».
 * Correos @ejemplo.mx y teléfonos 999 000 00XX ficticios.
 */

export const MARCA_DOCUMENTO = "DOCUMENTO DE EJEMPLO";

export const PERFILES_DEMO: Readonly<Record<string, PerfilDemo>> = {
  ana: {
    identidadId: "ana",
    nombreCompleto: "Ana Ek Canché",
    correo: "ana.ek@ejemplo.mx",
    telefono: "999 000 0001",
    domicilio: { calle: "Calle Ejemplo 25", numero: "000-A", colonia: "García Ginerés (ejemplo)", codigoPostal: "00000" },
    leyenda: "Datos ficticios de demostración",
  },
  bruno: {
    identidadId: "bruno",
    nombreCompleto: "Bruno Canul Pool",
    correo: "bruno.canul@ejemplo.mx",
    telefono: "999 000 0002",
    domicilio: { calle: "Calle Ejemplo 60", numero: "000", colonia: "Centro (ejemplo)", codigoPostal: "00000" },
    leyenda: "Datos ficticios de demostración",
  },
  operador: {
    identidadId: "operador",
    nombreCompleto: "Carmen Dzib (operadora de demostración)",
    correo: "operadora.demo@ejemplo.mx",
    telefono: "999 000 0003",
    domicilio: { calle: "Sin domicilio (cuenta de demostración)", numero: "—", colonia: "—", codigoPostal: "00000" },
    leyenda: "Datos ficticios de demostración",
  },
  admin: {
    identidadId: "admin",
    nombreCompleto: "Administración de demostración",
    correo: "admin.demo@ejemplo.mx",
    telefono: "999 000 0004",
    domicilio: { calle: "Sin domicilio (cuenta de demostración)", numero: "—", colonia: "—", codigoPostal: "00000" },
    leyenda: "Datos ficticios de demostración",
  },
};

const DIA = 86_400_000;

function haceDias(ahora: Date, dias: number): string {
  return new Date(ahora.getTime() - dias * DIA).toISOString();
}

export function crearDocumentosSemilla(ahora: Date): DocumentoDemo[] {
  return [
    {
      id: "doc-ana-identificacion",
      identidadId: "ana",
      titulo: "Identificación de ejemplo",
      tipo: "identificacion_ejemplo",
      fecha: haceDias(ahora, 90),
      vistaPrevia: [MARCA_DOCUMENTO, "Nombre: Ana Ek Canché", "Clave: EJEMPLO-0001", "Sin validez oficial. No es una identificación real."],
      gestionesRelacionadas: ["ges-0001"],
    },
    {
      id: "doc-ana-domicilio",
      identidadId: "ana",
      titulo: "Comprobante de domicilio de ejemplo",
      tipo: "comprobante_domicilio_ejemplo",
      fecha: haceDias(ahora, 30),
      vistaPrevia: [MARCA_DOCUMENTO, "Domicilio: Calle Ejemplo 25 núm. 000-A, García Ginerés (ejemplo)", "Sin validez oficial."],
      gestionesRelacionadas: ["ges-0001"],
    },
    {
      id: "doc-ana-recibo",
      identidadId: "ana",
      titulo: "Recibo simulado de pago",
      tipo: "recibo_simulado",
      fecha: haceDias(ahora, 4),
      vistaPrevia: [MARCA_DOCUMENTO, "Pago simulado", "Referencia: ejemplo sin folio fiscal", "No es un comprobante fiscal ni un recibo oficial."],
      gestionesRelacionadas: [],
    },
    {
      id: "doc-bruno-identificacion",
      identidadId: "bruno",
      titulo: "Identificación de ejemplo",
      tipo: "identificacion_ejemplo",
      fecha: haceDias(ahora, 120),
      vistaPrevia: [MARCA_DOCUMENTO, "Nombre: Bruno Canul Pool", "Clave: EJEMPLO-0002", "Sin validez oficial. No es una identificación real."],
      gestionesRelacionadas: ["ges-0003"],
    },
    {
      id: "doc-bruno-constancia",
      identidadId: "bruno",
      titulo: "Constancia de ejemplo",
      tipo: "constancia_ejemplo",
      fecha: haceDias(ahora, 10),
      vistaPrevia: [MARCA_DOCUMENTO, "Constancia ficticia generada por la demostración", "Sin validez oficial."],
      gestionesRelacionadas: ["ges-0003"],
    },
  ];
}

export const PRIVACIDAD_PREDETERMINADA: PreferenciasPrivacidad = {
  confirmarAntesDeReutilizar: true,
  asistentePuedeUsarNombre: true,
  notificacionesDiscretas: false,
  avisosDeVerificacion: true,
};
