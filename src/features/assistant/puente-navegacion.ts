/**
 * Puente entre el runtime del asistente (imperativo) y React Router.
 *
 * - Guarda el `navigate` vigente (cambia con cada render del router, el controlador es uno solo).
 * - Recuerda a qué pantalla llevó cada acción para ofrecer «Revisar y confirmar» más tarde.
 * - Guarda el cliente de guardas Clef (sólo si el servidor lo ofrece; si no, «sin señal»).
 */
import type { RespuestaGuardaAccion } from "@shared/asistente/servidor";
import type { EstadoNavegacionAsistente } from "@/types";
import type { ClienteGuardas } from "./runtime/guardas";

export type FuncionNavegar = (ruta: string, opciones?: { state?: EstadoNavegacionAsistente }) => unknown;

export interface NavegacionPreparada {
  ruta: string;
  estado?: EstadoNavegacionAsistente;
}

const SIN_SENAL: RespuestaGuardaAccion = { probabilidad: null, decision: "sin_senal", modo: "off", aplica: true };
const MAX_NAVEGACIONES = 30;

export class PuenteNavegacion {
  private navegarReal: FuncionNavegar | null = null;
  private guardasReal: ClienteGuardas | null = null;
  private accionEnCurso: string | null = null;
  private readonly navegaciones = new Map<string, NavegacionPreparada>();

  /** Guardas a entregar al controlador: delegan en el cliente vigente. */
  readonly guardas: ClienteGuardas = {
    evaluarAccion: (entrada) => this.guardasReal?.evaluarAccion(entrada) ?? Promise.resolve(SIN_SENAL),
    clasificarIntencion: (texto) => this.guardasReal?.clasificarIntencion(texto) ?? Promise.resolve(null),
  };

  fijarNavegar(navegar: FuncionNavegar | null): void {
    this.navegarReal = navegar;
  }

  fijarGuardas(guardas: ClienteGuardas | null): void {
    this.guardasReal = guardas;
  }

  /** La acción `id` empezó (o terminó, con null): sus navegaciones se asocian a ella. */
  fijarAccion(id: string | null): void {
    this.accionEnCurso = id;
  }

  /** Cierra la acción `id` sólo si sigue siendo la vigente. */
  terminarAccion(id: string): void {
    if (this.accionEnCurso === id) this.accionEnCurso = null;
  }

  /** `navegar` del ejecutor: recuerda la pantalla preparada y navega. */
  navegar = (ruta: string, estado?: EstadoNavegacionAsistente): void => {
    const id = this.accionEnCurso;
    if (id) {
      this.navegaciones.set(id, estado ? { ruta, estado } : { ruta });
      if (this.navegaciones.size > MAX_NAVEGACIONES) {
        const primera = this.navegaciones.keys().next().value;
        if (primera !== undefined) this.navegaciones.delete(primera);
      }
    }
    void this.navegarReal?.(ruta, estado ? { state: estado } : undefined);
  };

  /** Vuelve a abrir la pantalla que preparó una acción. Devuelve false si no se recuerda. */
  repetir(llamadaId: string, rutaActual: string): boolean {
    const navegacion = this.navegaciones.get(llamadaId);
    if (!navegacion) return false;
    if (rutaActual !== navegacion.ruta) void this.navegarReal?.(navegacion.ruta, navegacion.estado ? { state: navegacion.estado } : undefined);
    return true;
  }

  olvidar(): void {
    this.navegaciones.clear();
    this.accionEnCurso = null;
  }
}
