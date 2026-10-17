/**
 * Llamadas Realtime abiertas en este proceso: cupo simultáneo, identificador propio aleatorio
 * (el navegador nunca ve el id del proveedor) y colgado programado al vencer.
 */
import { randomBytes } from "node:crypto";
import type { AmbitoAsistente } from "../../shared/asistente/acciones";

export interface LlamadaActiva {
  id: string;
  callId: string;
  ip: string;
  ambito: AmbitoAsistente;
  venceEn: number;
}

export interface Temporizador {
  programar(funcion: () => void, ms: number): () => void;
}

export const temporizadorNode: Temporizador = {
  programar(funcion, ms) {
    const identificador = setTimeout(funcion, ms);
    // El colgado programado no debe impedir que el proceso termine.
    identificador.unref();
    return () => clearTimeout(identificador);
  },
};

interface Registro extends LlamadaActiva {
  cancelarVencimiento: () => void;
}

export class RegistroLlamadas {
  private readonly llamadas = new Map<string, Registro>();
  private pendientes = 0;
  private readonly maxSimultaneas: number;
  private readonly maxSegundos: number;
  private readonly colgar: (callId: string) => Promise<void>;
  private readonly ahora: () => number;
  private readonly temporizador: Temporizador;

  constructor(opciones: {
    maxSimultaneas: number;
    maxSegundos: number;
    colgar: (callId: string) => Promise<void>;
    ahora?: () => number;
    temporizador?: Temporizador;
  }) {
    this.maxSimultaneas = opciones.maxSimultaneas;
    this.maxSegundos = opciones.maxSegundos;
    this.colgar = opciones.colgar;
    this.ahora = opciones.ahora ?? Date.now;
    this.temporizador = opciones.temporizador ?? temporizadorNode;
  }

  get activas(): number {
    return this.llamadas.size;
  }

  /** Aparta un lugar mientras se negocia con el proveedor; devuelve con qué liberarlo o null si no hay cupo. */
  reservar(): (() => void) | null {
    if (this.llamadas.size + this.pendientes >= this.maxSimultaneas) return null;
    this.pendientes += 1;
    let liberado = false;
    return () => {
      if (liberado) return;
      liberado = true;
      this.pendientes -= 1;
    };
  }

  registrar(datos: { callId: string; ip: string; ambito: AmbitoAsistente }): LlamadaActiva {
    const id = randomBytes(24).toString("base64url");
    const venceEn = this.ahora() + this.maxSegundos * 1000;
    const cancelarVencimiento = this.temporizador.programar(() => {
      void this.cerrar(id);
    }, this.maxSegundos * 1000);
    const registro: Registro = { id, ...datos, venceEn, cancelarVencimiento };
    this.llamadas.set(id, registro);
    return { id, callId: datos.callId, ip: datos.ip, ambito: datos.ambito, venceEn };
  }

  obtener(id: string): LlamadaActiva | null {
    const registro = this.llamadas.get(id);
    if (!registro || registro.venceEn <= this.ahora()) return null;
    return { id: registro.id, callId: registro.callId, ip: registro.ip, ambito: registro.ambito, venceEn: registro.venceEn };
  }

  /** Cuelga y olvida la llamada. Devuelve false si no existía. */
  async cerrar(id: string): Promise<boolean> {
    const registro = this.llamadas.get(id);
    if (!registro) return false;
    this.llamadas.delete(id);
    registro.cancelarVencimiento();
    await this.colgar(registro.callId);
    return true;
  }

  async cerrarTodas(): Promise<void> {
    await Promise.all([...this.llamadas.keys()].map((id) => this.cerrar(id)));
  }
}
