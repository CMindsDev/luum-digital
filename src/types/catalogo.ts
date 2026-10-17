import type { EstadoInformacion, EstadoIntegracion, FuenteConsultada } from "./comunes";

/**
 * Categorías de navegación del Catálogo Municipal, orientadas a tareas ciudadanas.
 * El importador (scripts/import-catalog.ts) mapea las 21 categorías del Portal Ciudadano a éstas.
 */
export type CategoriaId =
  | "reportes"
  | "pagos"
  | "negocios"
  | "empleo"
  | "territorio"
  | "atencion_ciudadana"
  | "regulaciones"
  | "visitas_domiciliarias"
  | "bienestar"
  | "educacion"
  | "cultura"
  | "deporte"
  | "medio_ambiente"
  | "seguridad"
  | "turismo";

export interface Categoria {
  id: CategoriaId;
  nombre: string;
  descripcion: string;
  /** Nombre de ícono de lucide-react (resuelto en el design system). */
  icono: string;
  /** Token de color de la paleta (ver design-system/tokens.css). */
  tono: "azul" | "ambar" | "cafe" | "magenta" | "lima" | "marino";
}

/** Tipo de recorrido interno que abre la ficha. Cada uno tiene un componente reutilizable. */
export type TipoRecorrido =
  | "informativo"
  | "formulario"
  | "cita"
  | "pago"
  | "consulta_documental"
  | "consulta_territorial"
  | "reporte"
  | "verificacion";

export interface Requisito {
  nombre: string;
  /** null cuando la fuente no lo indica. */
  obligatorio: boolean | null;
  descripcion?: string;
  documentosAceptados?: string[];
  /** P. ej. "Original", "Copia simple". */
  presentacion?: string;
}

export interface PasoServicio {
  orden: number;
  titulo: string;
  descripcion?: string;
  canal?: "en_linea" | "presencial" | "telefonico";
}

export interface CanalAtencion {
  tipo: "telefono" | "presencial" | "en_linea" | "correo" | "app";
  etiqueta: string;
  /** Teléfono, URL, dirección o correo tal como aparece en la fuente. */
  valor: string;
  horario?: string;
  /** Sólo true si el dato se re-verificó contra su fuente (docs/INVENTARIO_SERVICIOS.md). */
  verificado: boolean;
  fuente?: string;
}

export interface CostoServicio {
  tipo: "gratuito" | "fijo" | "variable" | "pendiente";
  /** Texto literal de la fuente. Nunca se inventan montos. */
  texto?: string;
}

/** Ficha de servicio del catálogo integrado. Los campos siguen el brief (sección 7). */
export interface Servicio {
  id: string;
  /** Clave oficial (p. ej. MID-OBP-275) cuando proviene del Portal Ciudadano. */
  clave?: string;
  nombre: string;
  nombreCiudadano?: string;
  categoria: CategoriaId;
  categoriasSecundarias?: CategoriaId[];
  descripcion: string;
  /** Unidad administrativa responsable, tal como la publica la fuente. */
  dependencia?: string;
  /** Modalidad publicada por la fuente: "100% en línea", "100% Presencial", etc. */
  modalidadOficial?: string;
  /** Sistema donde existe hoy el servicio: "Portal Ciudadano (MIDigital)", "Mérida Móvil", ... */
  sistemaDeOrigen: string;
  fuenteOficial: FuenteConsultada;
  /** Fecha ISO de verificación por el equipo. Duplicado de fuenteOficial.fechaConsulta para filtros. */
  fechaDeVerificacion: string;
  estadoDeInformacion: EstadoInformacion;
  estadoDeIntegracion: EstadoIntegracion;
  /** Ruta interna del prototipo que abre la vista útil del servicio. */
  rutaInterna: string;
  tipoDeRecorrido: TipoRecorrido;
  /** null = la fuente no se ha contrastado: se muestra como pendiente de verificar. */
  requisitos: Requisito[] | null;
  pasos: PasoServicio[] | null;
  canalesDeAtencion: CanalAtencion[];
  costo?: CostoServicio;
  tiempoDeRespuesta?: string;
  /** Sinónimos y términos coloquiales para la búsqueda ("bache", "hoyo en la calle"). */
  palabrasClave?: string[];
  /** Escenario ficticio de formulario (ver src/data/recorridos-demo.ts), si aplica. */
  recorridoDemoId?: string;
  notas?: string;
}

export interface FiltroCatalogo {
  categoria?: CategoriaId;
  estadoDeInformacion?: EstadoInformacion;
  tipoDeRecorrido?: TipoRecorrido;
  texto?: string;
}

/** Acción concreta que ofrece un resultado de búsqueda (brief, sección 8). */
export type AccionSugerida =
  | { tipo: "abrir_servicio"; servicioId: string; etiqueta: string }
  | { tipo: "mostrar_requisitos"; servicioId: string; etiqueta: string }
  | { tipo: "abrir_formulario"; ruta: string; etiqueta: string }
  | { tipo: "consultar_gestion"; ruta: string; etiqueta: string }
  | { tipo: "abrir_mapa"; ruta: string; etiqueta: string }
  | { tipo: "abrir_ruta"; ruta: string; etiqueta: string };

export interface ResultadoBusqueda {
  servicio: Servicio;
  puntuacion: number;
  /** Por qué coincidió (para mostrar y para pruebas). */
  coincidencias: string[];
}

/** Intención detectada en lenguaje natural (reglas locales; ver src/domain/intencion.ts). */
export interface IntencionDetectada {
  intencion:
    | "reportar"
    | "requisitos"
    | "consultar_folio"
    | "apoyo_psicologico"
    | "ayuda_inmediata"
    | "negocio"
    | "cultura"
    | "mapa"
    | "pago"
    | "expediente"
    | "general";
  confianza: number;
  acciones: AccionSugerida[];
}

export interface RespuestaBusqueda {
  consulta: string;
  intencion: IntencionDetectada;
  resultados: ResultadoBusqueda[];
}

export interface CoberturaCatalogo {
  totalFuente: number;
  totalImportado: number;
  verificados: number;
  pendientes: number;
  demostracion: number;
  fuente: FuenteConsultada;
}
