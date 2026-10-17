import type { EstadoInformacion, FechaISO, FuenteConsultada } from "./comunes";
import type { CanalAtencion } from "./catalogo";

export type AreaBienestar = "salud" | "salud_mental" | "educacion" | "deporte" | "mujeres";

export interface ProgramaBienestar {
  id: string;
  nombre: string;
  area: AreaBienestar;
  descripcion: string;
  /** Población a la que se dirige, tal como la publica la fuente. */
  dirigidoA?: string;
  canales: CanalAtencion[];
  fuente: FuenteConsultada;
  estadoDeInformacion: EstadoInformacion;
  /** Id de servicio del catálogo relacionado (ficha interna), si existe. */
  servicioId?: string;
}

/** Línea de ayuda humana. Sólo se muestran números re-verificados contra su fuente oficial. */
export interface LineaAyuda {
  id: string;
  nombre: string;
  telefono: string;
  /** Formato marcable para enlaces tel:. */
  telefonoMarcable: string;
  descripcion: string;
  ambito: "municipal" | "estatal" | "nacional";
  /** Disponibilidad sólo si la fuente la publica literalmente. */
  disponibilidad?: string;
  tipo: "emergencia" | "salud_mental" | "violencia" | "orientacion";
  fuente: FuenteConsultada;
  verificado: boolean;
}

export interface UbicacionServicio {
  id: string;
  nombre: string;
  direccion: string;
  lat?: number;
  lng?: number;
  tipo: "salud_mental" | "salud" | "mujeres" | "atencion_ciudadana" | "deporte" | "educacion";
  fuente: FuenteConsultada;
  verificado: boolean;
}

/** Solicitud de orientación simulada. Nunca afirma que una persona profesional la recibió. */
export interface SolicitudApoyoDemo {
  id: string;
  referencia: string;
  tipo: "salud_mental" | "linea_mujer";
  fecha: FechaISO;
  leyenda: "Solicitud simulada: nadie la ha recibido";
}
