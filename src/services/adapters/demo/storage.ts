import type { ContadoresFolio } from "@/domain/folios";
import { SinConexionError } from "@/services/contracts/errors";
import { leerControlesDemo, type RepositorioConError } from "@/services/demo-controls";
import type {
  CanjeDemo,
  CitaDemo,
  DocumentoDemo,
  Gestion,
  MovimientoPuntos,
  Notificacion,
  PagoDemo,
  PreferenciasPrivacidad,
  Reporte,
  Verificacion,
} from "@/types";
import { almacenamientoSeguro, PREFIJO_DEMO } from "@/utils/almacenamiento";
import { crearSemillaDemo } from "./semillas";

/**
 * Persistencia de la demostración: un documento JSON por colección en localStorage (o memoria si no
 * está disponible), con el prefijo «merida-demo:v1:» que borra «Restablecer demostración».
 *
 * - Se siembra en el primer uso y cuando cambia la versión de esquema. Las fechas de las semillas son
 *   relativas al momento de la siembra.
 * - No hay caché en memoria: cada lectura consulta el almacenamiento, así un restablecimiento desde
 *   /cuenta (borrarDatosDemo) se refleja de inmediato y se vuelve a sembrar.
 * - Bienestar, salud mental y Línea Mujer NO tienen colección: nunca se persisten.
 */

export const VERSION_ESQUEMA = 1;

export interface ColeccionesDemo {
  reportes: Reporte[];
  verificaciones: Verificacion[];
  movimientos: MovimientoPuntos[];
  canjes: CanjeDemo[];
  gestiones: Gestion[];
  pagos: PagoDemo[];
  citas: CitaDemo[];
  documentos: DocumentoDemo[];
  privacidad: Record<string, PreferenciasPrivacidad>;
  notificaciones: Notificacion[];
  folios: ContadoresFolio;
}

export type NombreColeccion = keyof ColeccionesDemo;

export const NOMBRES_COLECCIONES: readonly NombreColeccion[] = [
  "reportes",
  "verificaciones",
  "movimientos",
  "canjes",
  "gestiones",
  "pagos",
  "citas",
  "documentos",
  "privacidad",
  "notificaciones",
  "folios",
];

const CLAVE_META = `${PREFIJO_DEMO}datos:__meta`;
const claveColeccion = (nombre: NombreColeccion) => `${PREFIJO_DEMO}datos:${nombre}`;

interface MetaAlmacen {
  version: number;
  sembradoEn: string;
}

export interface AlmacenDemo {
  leer<K extends NombreColeccion>(nombre: K): ColeccionesDemo[K];
  escribir<K extends NombreColeccion>(nombre: K, valor: ColeccionesDemo[K]): void;
  /** Lee, transforma y escribe una colección; devuelve el resultado de la transformación. */
  modificar<K extends NombreColeccion, R>(nombre: K, cambio: (actual: ColeccionesDemo[K]) => { valor: ColeccionesDemo[K]; resultado: R }): R;
  /** Fecha de la siembra actual. */
  sembradoEn(): string;
  /** Borra y vuelve a sembrar todas las colecciones. */
  reiniciar(): void;
  ahora(): Date;
}

export interface OpcionesAlmacen {
  /** Almacenamiento a usar (por defecto localStorage con respaldo en memoria). */
  storage?: () => Storage;
  /** Reloj (inyectable en pruebas). */
  ahora?: () => Date;
  /** Semillas (inyectables en pruebas). */
  semilla?: (ahora: Date) => ColeccionesDemo;
}

export function crearAlmacenDemo(opciones: OpcionesAlmacen = {}): AlmacenDemo {
  const obtenerStorage = opciones.storage ?? almacenamientoSeguro;
  const reloj = opciones.ahora ?? (() => new Date());
  const sembrar = opciones.semilla ?? crearSemillaDemo;

  function leerMeta(storage: Storage): MetaAlmacen | null {
    try {
      const crudo = storage.getItem(CLAVE_META);
      if (!crudo) return null;
      const meta = JSON.parse(crudo) as Partial<MetaAlmacen>;
      if (typeof meta.version !== "number" || typeof meta.sembradoEn !== "string") return null;
      return { version: meta.version, sembradoEn: meta.sembradoEn };
    } catch {
      return null;
    }
  }

  function guardar(storage: Storage, clave: string, valor: unknown): void {
    try {
      storage.setItem(clave, JSON.stringify(valor));
    } catch {
      throw new Error("No se pudieron guardar los datos de demostración en este navegador (almacenamiento lleno o bloqueado).");
    }
  }

  function sembrarTodo(storage: Storage): MetaAlmacen {
    const ahora = reloj();
    const datos = sembrar(ahora);
    for (const nombre of NOMBRES_COLECCIONES) guardar(storage, claveColeccion(nombre), datos[nombre]);
    const meta: MetaAlmacen = { version: VERSION_ESQUEMA, sembradoEn: ahora.toISOString() };
    guardar(storage, CLAVE_META, meta);
    return meta;
  }

  function asegurarSiembra(storage: Storage): MetaAlmacen {
    const meta = leerMeta(storage);
    if (meta && meta.version === VERSION_ESQUEMA) return meta;
    return sembrarTodo(storage);
  }

  function leer<K extends NombreColeccion>(nombre: K): ColeccionesDemo[K] {
    const storage = obtenerStorage();
    const meta = asegurarSiembra(storage);
    const crudo = storage.getItem(claveColeccion(nombre));
    if (crudo !== null) {
      try {
        return JSON.parse(crudo) as ColeccionesDemo[K];
      } catch {
        // Dato dañado: se vuelve a sembrar sólo esta colección.
      }
    }
    const valor = sembrar(new Date(meta.sembradoEn))[nombre];
    guardar(storage, claveColeccion(nombre), valor);
    return valor;
  }

  function escribir<K extends NombreColeccion>(nombre: K, valor: ColeccionesDemo[K]): void {
    const storage = obtenerStorage();
    asegurarSiembra(storage);
    guardar(storage, claveColeccion(nombre), valor);
  }

  return {
    leer,
    escribir,
    modificar(nombre, cambio) {
      const { valor, resultado } = cambio(leer(nombre));
      escribir(nombre, valor);
      return resultado;
    },
    sembradoEn() {
      return asegurarSiembra(obtenerStorage()).sembradoEn;
    },
    reiniciar() {
      const storage = obtenerStorage();
      storage.removeItem(CLAVE_META);
      sembrarTodo(storage);
    },
    ahora: reloj,
  };
}

// --- Simulación de latencia, falta de conexión y errores --------------------------------------------

export interface ControlesSimulacion {
  sinConexion: boolean;
  latenciaMs: number;
  forzarErrorEn: RepositorioConError;
}

const NOMBRE_REPOSITORIO: Record<Exclude<RepositorioConError, "ninguno">, string> = {
  catalog: "el catálogo",
  procedures: "las gestiones",
  reports: "los reportes",
  verifications: "las verificaciones",
  rewards: "las recompensas",
  digitalFile: "el expediente",
  wellbeing: "bienestar",
  notifications: "las notificaciones",
};

export interface ContextoDemo {
  almacen: AlmacenDemo;
  controles: () => ControlesSimulacion;
  /** Identificador único para registros nuevos. */
  nuevoId: (prefijo: string) => string;
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

function nuevoIdPredeterminado(prefijo: string): string {
  const aleatorio =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefijo}-${Date.now().toString(36)}-${aleatorio}`;
}

export function crearContextoDemo(opciones: OpcionesAlmacen & { controles?: () => ControlesSimulacion; nuevoId?: (prefijo: string) => string } = {}): ContextoDemo {
  return {
    almacen: crearAlmacenDemo(opciones),
    controles: opciones.controles ?? leerControlesDemo,
    nuevoId: opciones.nuevoId ?? nuevoIdPredeterminado,
  };
}

/**
 * Ejecuta una operación de un repositorio demo aplicando los controles de la demostración:
 * latencia simulada (0 en pruebas), error forzado por repositorio (todas sus llamadas fallan) y
 * falta de conexión (sólo fallan las mutaciones; las lecturas de datos locales siguen funcionando).
 */
export async function operacionDemo<T>(
  contexto: ContextoDemo,
  repositorio: Exclude<RepositorioConError, "ninguno">,
  tipo: "lectura" | "mutacion",
  operacion: () => T | Promise<T>,
): Promise<T> {
  const controles = contexto.controles();
  const latencia = import.meta.env.MODE === "test" ? 0 : Math.max(0, controles.latenciaMs);
  if (latencia > 0) await esperar(latencia);
  if (controles.forzarErrorEn === repositorio) {
    throw new Error(`Error simulado al consultar ${NOMBRE_REPOSITORIO[repositorio]}. Lo activaste en «Cuenta de demostración».`);
  }
  if (tipo === "mutacion" && controles.sinConexion) throw new SinConexionError();
  return await operacion();
}
