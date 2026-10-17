/**
 * Repositorios falsos para las pruebas del asistente (datos ficticios, sin red).
 */
import { vi } from "vitest";
import type { PantallaActual } from "@shared/asistente/pantalla";
import type { Gestion, IdentidadDemo, LineaAyuda, Reporte, RespuestaBusqueda, Servicio } from "@/types";
import type { RepositoriosEjecutor } from "../ejecutor";

export const ACTOR: IdentidadDemo = { id: "ana", nombre: "Ana Ek", iniciales: "AE", rol: "ciudadania", descripcion: "Ciudadana ficticia" };

const FUENTE = { nombre: "Portal Ciudadano (ficha de prueba)", url: "https://example.org/ficha", fechaConsulta: "2026-10-17" };

function servicio(cambios: Partial<Servicio> & Pick<Servicio, "id" | "nombre">): Servicio {
  return {
    categoria: "negocios",
    descripcion: "Servicio de prueba.",
    sistemaDeOrigen: "Portal Ciudadano (MIDigital)",
    fuenteOficial: FUENTE,
    fechaDeVerificacion: "2026-10-17",
    estadoDeInformacion: "verificada",
    estadoDeIntegracion: "simulada",
    rutaInterna: `/servicios/${cambios.id}`,
    tipoDeRecorrido: "formulario",
    requisitos: null,
    pasos: null,
    canalesDeAtencion: [],
    ...cambios,
  };
}

export const LICENCIA = servicio({
  id: "licencia-funcionamiento",
  nombre: "Licencia de funcionamiento (prueba)",
  requisitos: [
    { nombre: "Formato de solicitud de prueba", obligatorio: true },
    { nombre: "Croquis de ubicación de prueba", obligatorio: false },
  ],
  costo: { tipo: "variable", texto: "Según el giro (texto de prueba)" },
});

export const CULTURA = servicio({
  id: "agenda-cultural",
  nombre: "Agenda cultural (prueba)",
  categoria: "cultura",
  estadoDeInformacion: "pendiente",
  requisitos: null,
});

export const REPORTE: Reporte = {
  id: "rep-1",
  folio: "DEMO-R-0000001",
  categoria: "bache",
  descripcion: "Descripción con datos que no deben salir.",
  ubicacion: { lat: 20.97, lng: -89.62, referencia: "Referencia privada de prueba", colonia: "Centro", origen: "manual" },
  tieneFoto: false,
  riesgoDeclarado: false,
  identidadId: "ana",
  creadoEn: "2026-10-01T10:00:00.000Z",
  actualizadoEn: "2026-10-02T10:00:00.000Z",
  estadoMunicipal: "en_proceso",
  verificacion: "no_aplica",
  historial: [],
  aportaciones: [],
};

export const GESTION: Gestion = {
  id: "ges-1",
  folio: "DEMO-G-0000007",
  servicioId: LICENCIA.id,
  servicioNombre: LICENCIA.nombre,
  identidadId: "ana",
  tipo: "formulario",
  estado: "en_revision",
  datos: { nombre: "Dato capturado privado" },
  camposReutilizados: [],
  creadaEn: "2026-10-01T10:00:00.000Z",
  actualizadaEn: "2026-10-03T10:00:00.000Z",
  historial: [],
};

export const LINEAS: LineaAyuda[] = [
  {
    id: "linea-prueba",
    nombre: "Línea de prueba verificada",
    telefono: "000 000 0000",
    telefonoMarcable: "0000000000",
    descripcion: "Línea ficticia para pruebas.",
    ambito: "nacional",
    tipo: "salud_mental",
    fuente: { nombre: "Fuente de prueba", url: "https://example.org/linea", fechaConsulta: "2026-10-17" },
    verificado: true,
  },
  {
    id: "linea-sin-verificar",
    nombre: "Línea no verificada",
    telefono: "111 111 1111",
    telefonoMarcable: "1111111111",
    descripcion: "No debe mostrarse.",
    ambito: "nacional",
    tipo: "salud_mental",
    fuente: { nombre: "Fuente de prueba", url: "https://example.org/otra", fechaConsulta: "2026-10-17" },
    verificado: false,
  },
];

function respuestaBusqueda(consulta: string, servicios: Servicio[]): RespuestaBusqueda {
  return {
    consulta,
    intencion: { intencion: "general", confianza: 0.5, acciones: [] },
    resultados: servicios.map((encontrado) => ({ servicio: encontrado, puntuacion: 1, coincidencias: [] })),
  };
}

export function crearRepositorios() {
  const repositorios = {
    catalog: {
      get: vi.fn(async (id: string) => [LICENCIA, CULTURA].find((candidato) => candidato.id === id) ?? null),
      search: vi.fn(async (consulta: string) => {
        const texto = consulta.toLowerCase();
        if (texto.includes("licencia")) return respuestaBusqueda(consulta, [LICENCIA]);
        if (texto.includes("cultura")) return respuestaBusqueda(consulta, [CULTURA]);
        return respuestaBusqueda(consulta, []);
      }),
    },
    procedures: {
      list: vi.fn(async () => [GESTION]),
      findByFolio: vi.fn(async (folio: string) => (folio === GESTION.folio ? GESTION : null)),
    },
    reports: {
      list: vi.fn(async () => [REPORTE]),
      findByFolio: vi.fn(async (folio: string) => (folio === REPORTE.folio ? REPORTE : null)),
    },
    rewards: {
      getRules: vi.fn(async () => ({
        etiqueta: "Reglas de demostración" as const,
        reporteValidado: 10,
        verificacionBase: 5,
        verificacionBonoCalidad: 3,
        verificacionNoConcluyente: 2,
        longitudMinimaComentario: 20,
        aportacion: 0 as const,
        descripcion: ["Regla de prueba."],
      })),
      getBalance: vi.fn(async () => ({ disponible: 25, pendientes: 10, totalCanjeado: 0 })),
      listBenefits: vi.fn(async () => [
        { id: "b1", nombre: "Beneficio de ejemplo", descripcion: "Ficticio.", costoPuntos: 20, disponible: true, ejemplo: true as const },
      ]),
    },
    wellbeing: {
      listHelpLines: vi.fn(async () => LINEAS),
    },
  } satisfies RepositoriosEjecutor;
  return repositorios;
}

export function pantallaDe(cambios: Partial<PantallaActual> = {}): PantallaActual {
  return {
    ruta: "/",
    titulo: "Inicio",
    seccion: "inicio",
    rol: "ciudadania",
    objetivos: [
      { id: "inicio.buscador", etiqueta: "Buscar trámites y servicios" },
      { id: "navegacion.mapa", etiqueta: "Visor Urbano" },
    ],
    dialogoAbierto: null,
    formulario: null,
    ...cambios,
  };
}
