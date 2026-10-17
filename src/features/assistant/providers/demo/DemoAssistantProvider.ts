/**
 * Proveedor de demostración: respuestas programadas, reproducibles y etiquetadas como tales.
 * Funciona sin claves ni servidor. Atiende los dos ámbitos con escenarios distintos y aislados:
 * - "general": catálogo, reportes, folios, mapa, beneficios, señalar y navegar.
 * - "bienestar": acompañante de demostración (sin diagnóstico; ayuda humana primero).
 */
import type { AssistantProvider, OpcionesSesion, SesionAsistente } from "@/services/contracts";
import { escenariosBienestar } from "./escenarios-bienestar";
import { escenariosGeneral } from "./escenarios-general";
import { SesionDemo } from "./sesion-demo";

export const ETIQUETA_DEMO = "Respuestas programadas (demostración)";

export interface OpcionesProveedorDemo {
  /** Pausa antes de cada respuesta (por defecto 450 ms; 0 en pruebas). */
  retrasoMs?: number;
  /** Espera máxima de un recibo de acción (por defecto 15 s). */
  tiempoReciboMs?: number;
}

export class DemoAssistantProvider implements AssistantProvider {
  readonly modo = "demostracion" as const;
  readonly etiqueta = ETIQUETA_DEMO;
  readonly admiteVoz = false;
  private readonly retrasoMs: number;
  private readonly tiempoReciboMs: number;

  constructor(opciones: OpcionesProveedorDemo = {}) {
    this.retrasoMs = opciones.retrasoMs ?? 450;
    this.tiempoReciboMs = opciones.tiempoReciboMs ?? 15_000;
  }

  async iniciar(opciones: OpcionesSesion): Promise<SesionAsistente> {
    return this.crearSesion(opciones);
  }

  /** Igual que `iniciar`, pero devuelve la clase concreta (útil en pruebas: `await sesion.enviarTexto()`). */
  crearSesion(opciones: OpcionesSesion): SesionDemo {
    return new SesionDemo({
      ambito: opciones.ambito,
      pantalla: opciones.pantalla,
      escenarios: opciones.ambito === "bienestar" ? escenariosBienestar : escenariosGeneral,
      retrasoMs: this.retrasoMs,
      tiempoReciboMs: this.tiempoReciboMs,
    });
  }
}
