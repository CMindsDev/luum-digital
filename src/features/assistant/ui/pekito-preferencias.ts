import { almacenamientoSeguro, PREFIJO_DEMO } from "@/utils/almacenamiento";

const CLAVE = `${PREFIJO_DEMO}pekito`;

export type ModoPreferido = "hablar" | "escribir";

/** Lado de la pantalla donde descansa la mascota flotante. */
export type LadoPekito = "derecha" | "izquierda";

interface PreferenciasPekito {
  bienvenidaVista: boolean;
  modo: ModoPreferido;
  lado: LadoPekito;
}

const PREDETERMINADAS: PreferenciasPekito = { bienvenidaVista: false, modo: "escribir", lado: "derecha" };

/** Preferencias no sensibles de la demostración (nunca contenido de conversaciones). */
export function leerPreferenciasPekito(): PreferenciasPekito {
  try {
    const crudo = almacenamientoSeguro().getItem(CLAVE);
    if (!crudo) return PREDETERMINADAS;
    const valor = JSON.parse(crudo) as Partial<PreferenciasPekito>;
    return {
      bienvenidaVista: valor.bienvenidaVista === true,
      modo: valor.modo === "hablar" ? "hablar" : "escribir",
      lado: valor.lado === "izquierda" ? "izquierda" : "derecha",
    };
  } catch {
    return PREDETERMINADAS;
  }
}

export function guardarPreferenciasPekito(cambios: Partial<PreferenciasPekito>): void {
  try {
    almacenamientoSeguro().setItem(CLAVE, JSON.stringify({ ...leerPreferenciasPekito(), ...cambios }));
  } catch {
    // Sin almacenamiento: la bienvenida volverá a mostrarse, la demo sigue funcionando.
  }
}
