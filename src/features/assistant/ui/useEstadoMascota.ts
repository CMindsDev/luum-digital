import { useEffect, useState } from "react";
import { useAsistenteStore } from "../runtime/store";
import { derivarEstadoMascota, type EstadoMascota } from "./estado-mascota";

/** Cuánto dura el gesto de «feliz» o «triste» tras una acción o un error. */
export const DURACION_MOMENTO_MS = 2_400;

/**
 * true durante `ms` cada vez que `clave` cambia a un valor nuevo. No dispara con el valor que ya
 * existía al montar (un recibo viejo no debe hacer brincar a Pekito).
 */
function useDestello(clave: string | null, ms: number): boolean {
  const [previa, setPrevia] = useState(clave);
  const [activo, setActivo] = useState(false);
  if (clave !== previa) {
    setPrevia(clave);
    setActivo(clave !== null);
  }
  useEffect(() => {
    if (!activo) return;
    const temporizador = setTimeout(() => setActivo(false), ms);
    return () => clearTimeout(temporizador);
  }, [activo, clave, ms]);
  return activo;
}

/**
 * Estado visual de la mascota según la conversación general: conectando, escuchando, pensando,
 * trabajando, hablando, y los gestos breves feliz (acción lista) y triste (error o acción fallida).
 * Con `saludaEnReposo`, el reposo se muestra como «saludando» (saludo único al aparecer).
 */
export function useEstadoMascota(opciones: { silenciado?: boolean; saludaEnReposo?: boolean } = {}): EstadoMascota {
  const estadoSesion = useAsistenteStore("general", (estado) => estado.estadoSesion);
  const vozActiva = useAsistenteStore("general", (estado) => estado.vozActiva);
  const accionesEnCurso = useAsistenteStore("general", (estado) => estado.accionesEnCurso);
  const mensajes = useAsistenteStore("general", (estado) => estado.mensajes);
  const recibos = useAsistenteStore("general", (estado) => estado.recibos);
  const avisos = useAsistenteStore("general", (estado) => estado.avisos);

  const ultimoRecibo = recibos.at(-1);
  const ultimoAvisoCritico = avisos.findLast((aviso) => aviso.tono === "critico");
  const claveFeliz = ultimoRecibo && ultimoRecibo.estado !== "fallida" ? `${ultimoRecibo.llamadaId}:${ultimoRecibo.estado}` : null;
  const claveTriste = ultimoRecibo?.estado === "fallida" ? `r:${ultimoRecibo.llamadaId}` : ultimoAvisoCritico ? `a:${ultimoAvisoCritico.id}` : null;

  const feliz = useDestello(claveFeliz, DURACION_MOMENTO_MS);
  const triste = useDestello(claveTriste, DURACION_MOMENTO_MS);

  const estado = derivarEstadoMascota({
    estadoSesion,
    vozActiva,
    silenciado: opciones.silenciado ?? false,
    accionesEnCurso,
    mensajes,
    momento: triste ? "triste" : feliz ? "feliz" : null,
  });
  // Pantallas que acaban de abrirse (lanzador, conversación vacía): saluda una vez en lugar de quedarse quieta.
  return estado === "reposo" && opciones.saludaEnReposo ? "saludando" : estado;
}
