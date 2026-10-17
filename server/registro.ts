/**
 * Registro operativo del servidor. Política: sólo nombres de rutas, estados, tipos de error,
 * modos y probabilidades. Nunca contenido de mensajes, pantallas, SDP, argumentos ni claves.
 * Por eso sólo acepta valores primitivos y quien llama decide qué campos (acotados) registra.
 */
export type ValorRegistro = string | number | boolean | null;
export type Registrador = (evento: string, datos?: Readonly<Record<string, ValorRegistro>>) => void;

const EVENTOS_DE_AVISO = /fallid|rechazad|no_disponible|error|invalid/;

/** Líneas JSON en stdout (stderr para fallos), una por evento. */
export function crearRegistradorConsola(): Registrador {
  return (evento, datos = {}) => {
    const linea = `${JSON.stringify({ hora: new Date().toISOString(), evento, ...datos })}\n`;
    if (EVENTOS_DE_AVISO.test(evento)) process.stderr.write(linea);
    else process.stdout.write(linea);
  };
}

export const registradorSilencioso: Registrador = () => undefined;
