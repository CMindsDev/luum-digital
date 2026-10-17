/**
 * Sesión del proveedor de demostración: respuestas programadas y reproducibles.
 * Emite texto y llamadas de acción con el mismo contrato que el proveedor Realtime; espera el
 * recibo de cada acción (entregarRecibo) para redactar la respuesta siguiente con los datos y
 * fuentes devueltos. Nunca simula ser un modelo real.
 */
import type { AmbitoAsistente, ArgumentosAccion, NombreAccion, ReciboAccion } from "@shared/asistente/acciones";
import type { PantallaActual } from "@shared/asistente/pantalla";
import type { EventoAsistente, FuenteCitada, SesionAsistente } from "@/services/contracts";
import { normalizar } from "./texto";

/** Memoria de la conversación programada (sólo en memoria, se pierde al cerrar). */
export interface MemoriaDemo {
  /** Propuesta pendiente de confirmar con «sí». */
  propuesta: { tipo: "requisitos"; servicioId: string; nombre: string } | { tipo: "atencion" } | null;
  /** Se preguntó «¿de qué trámite?» y la respuesta siguiente es el nombre. */
  esperandoTramite: boolean;
  /** Bienestar: la persona eligió conversar sobre cómo se siente. */
  escuchando: boolean;
  turnosEscucha: number;
}

export interface HerramientasEscenario {
  readonly pantalla: PantallaActual;
  readonly memoria: MemoriaDemo;
  decir(texto: string, fuentes?: FuenteCitada[]): void;
  /** Emite la llamada y espera su recibo (o uno «fallida» si no llega a tiempo). */
  accion<N extends NombreAccion>(accion: N, argumentos: ArgumentosAccion<N>): Promise<ReciboAccion>;
}

export type Escenarios = (texto: string, normalizado: string, herramientas: HerramientasEscenario) => Promise<void>;

export interface OpcionesSesionDemo {
  ambito: AmbitoAsistente;
  pantalla: PantallaActual;
  escenarios: Escenarios;
  /** Pausa antes de responder, para que se lea natural (0 en pruebas). */
  retrasoMs: number;
  /** Tiempo máximo de espera de un recibo. */
  tiempoReciboMs: number;
}

const espera = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

export class SesionDemo implements SesionAsistente {
  readonly ambito: AmbitoAsistente;
  private pantalla: PantallaActual;
  private readonly escenarios: Escenarios;
  private readonly retrasoMs: number;
  private readonly tiempoReciboMs: number;
  private readonly oyentes = new Set<(evento: EventoAsistente) => void>();
  private readonly recibosPendientes = new Map<string, (recibo: ReciboAccion) => void>();
  private readonly memoria: MemoriaDemo = { propuesta: null, esperandoTramite: false, escuchando: false, turnosEscucha: 0 };
  private cadena: Promise<void> = Promise.resolve();
  private contador = 0;
  private cerrada = false;

  constructor(opciones: OpcionesSesionDemo) {
    this.ambito = opciones.ambito;
    this.pantalla = opciones.pantalla;
    this.escenarios = opciones.escenarios;
    this.retrasoMs = opciones.retrasoMs;
    this.tiempoReciboMs = opciones.tiempoReciboMs;
  }

  suscribir(oyente: (evento: EventoAsistente) => void): () => void {
    this.oyentes.add(oyente);
    return () => {
      this.oyentes.delete(oyente);
    };
  }

  /** Los turnos se atienden en orden. La promesa devuelta termina con el turno (útil en pruebas). */
  enviarTexto(texto: string): Promise<void> {
    const limpio = texto.trim();
    if (!limpio || this.cerrada) return this.cadena;
    this.cadena = this.cadena.then(() => this.turno(limpio)).catch(() => undefined);
    return this.cadena;
  }

  actualizarPantalla(pantalla: PantallaActual): void {
    this.pantalla = pantalla;
  }

  entregarRecibo(recibo: ReciboAccion): void {
    const resolver = this.recibosPendientes.get(recibo.llamadaId);
    if (!resolver) return;
    this.recibosPendientes.delete(recibo.llamadaId);
    resolver(recibo);
  }

  cerrar(): void {
    if (this.cerrada) return;
    this.cerrada = true;
    for (const [llamadaId, resolver] of this.recibosPendientes) {
      resolver({ llamadaId, accion: "navegar", estado: "fallida", mensaje: "La conversación se cerró." });
    }
    this.recibosPendientes.clear();
    this.emitir({ tipo: "estado", estado: "cerrado" });
    this.oyentes.clear();
  }

  private emitir(evento: EventoAsistente) {
    for (const oyente of [...this.oyentes]) {
      try {
        oyente(evento);
      } catch {
        // Un oyente con error no detiene la conversación.
      }
    }
  }

  private siguienteId(prefijo: string): string {
    this.contador += 1;
    return `demo-${this.ambito}-${prefijo}-${this.contador}`;
  }

  private async turno(texto: string) {
    if (this.cerrada) return;
    this.emitir({ tipo: "estado", estado: "pensando" });
    if (this.retrasoMs > 0) await espera(this.retrasoMs);
    const leerPantalla = () => this.pantalla;
    const herramientas: HerramientasEscenario = {
      // Siempre la pantalla vigente: una acción puede haber navegado durante el turno.
      get pantalla() {
        return leerPantalla();
      },
      memoria: this.memoria,
      decir: (contenido, fuentes) => {
        if (this.cerrada) return;
        this.emitir({
          tipo: "texto_final",
          mensajeId: this.siguienteId("mensaje"),
          texto: contenido,
          ...(fuentes && fuentes.length > 0 ? { fuentes } : {}),
        });
      },
      accion: (accion, argumentos) => this.llamar(accion, argumentos),
    };
    try {
      await this.escenarios(texto, normalizar(texto), herramientas);
    } finally {
      if (!this.cerrada) this.emitir({ tipo: "estado", estado: "listo" });
    }
  }

  private llamar<N extends NombreAccion>(accion: N, argumentos: ArgumentosAccion<N>): Promise<ReciboAccion> {
    const llamadaId = this.siguienteId("llamada");
    if (this.cerrada) return Promise.resolve({ llamadaId, accion, estado: "fallida", mensaje: "La conversación se cerró." });
    return new Promise<ReciboAccion>((resolver) => {
      const temporizador = setTimeout(() => {
        if (!this.recibosPendientes.has(llamadaId)) return;
        this.recibosPendientes.delete(llamadaId);
        resolver({ llamadaId, accion, estado: "fallida", mensaje: "No llegó el resultado de la acción." });
      }, this.tiempoReciboMs);
      this.recibosPendientes.set(llamadaId, (recibo) => {
        clearTimeout(temporizador);
        resolver(recibo);
      });
      this.emitir({ tipo: "accion", llamada: { llamadaId, accion, argumentos } });
    });
  }
}
