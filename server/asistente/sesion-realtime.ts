/**
 * Arma la configuración de la sesión Realtime de un ámbito: instrucciones, pantalla inicial y
 * herramientas (sólo las del registro compartido y del ámbito). Empieza en modo texto; el navegador
 * cambia a audio con session.update cuando la persona activa la voz.
 */
import { definicionesParaModelo, type AmbitoAsistente } from "../../shared/asistente/acciones";
import { describirPantalla, type PantallaActual } from "../../shared/asistente/pantalla";
import { INSTRUCCIONES_BIENESTAR } from "../instrucciones/bienestar";
import { INSTRUCCIONES_GENERAL } from "../instrucciones/general";

export const MODELO_TRANSCRIPCION = "gpt-4o-mini-transcribe";

export interface DefinicionHerramienta {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/** Herramientas del ámbito sin metadatos de JSON Schema que el proveedor no necesita ("$schema"). */
export function herramientasDelAmbito(ambito: AmbitoAsistente): DefinicionHerramienta[] {
  return definicionesParaModelo(ambito).map((definicion) => {
    const parametros: Record<string, unknown> = {};
    for (const [clave, valor] of Object.entries(definicion.parameters)) {
      if (clave !== "$schema") parametros[clave] = valor;
    }
    return { type: "function", name: definicion.name, description: definicion.description, parameters: parametros };
  });
}

/** Sólo letras, espacios y guiones: el nombre ficticio nunca debe colar instrucciones. */
function nombreSeguro(nombre: string | undefined): string | null {
  const limpio = (nombre ?? "").replace(/[^\p{L}\s'-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 40);
  return limpio.length >= 2 ? limpio : null;
}

export function instruccionesDeSesion(ambito: AmbitoAsistente, pantalla: PantallaActual, nombreParaSaludo?: string): string {
  const base = ambito === "bienestar" ? INSTRUCCIONES_BIENESTAR : INSTRUCCIONES_GENERAL;
  const nombre = nombreSeguro(nombreParaSaludo);
  const saludo = nombre ? `\n\nPuedes llamar a la persona «${nombre}» (nombre ficticio de demostración).` : "";
  return [
    `${base}${saludo}`,
    "La pantalla de abajo es la de cuando empezó la conversación. Si en la conversación hay un ítem «[Pantalla actual]» más reciente, ése es el vigente.",
    describirPantalla(pantalla),
  ].join("\n\n");
}

export function armarSesionRealtime(opciones: {
  ambito: AmbitoAsistente;
  pantalla: PantallaActual;
  modelo: string;
  voz: string;
  nombreParaSaludo?: string;
}): Record<string, unknown> {
  return {
    type: "realtime",
    model: opciones.modelo,
    output_modalities: ["text"],
    instructions: instruccionesDeSesion(opciones.ambito, opciones.pantalla, opciones.nombreParaSaludo),
    tools: herramientasDelAmbito(opciones.ambito),
    tool_choice: "auto",
    audio: {
      input: {
        transcription: { model: MODELO_TRANSCRIPCION, language: "es" },
        noise_reduction: { type: "near_field" },
        // Sin detección de turnos hasta que la persona active la voz.
        turn_detection: null,
      },
      output: { voice: opciones.voz },
    },
  };
}
