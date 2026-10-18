import { normalizar } from "./texto";

/** Rechazo explícito adicional a las instrucciones y al clasificador; no pretende clasificar todo. */
export function preguntaPorPreferenciasDelAsistente(consulta: string): boolean {
  const texto = normalizar(consulta);
  return /\b(?:tu|tus)\s+(?:comida|platillo|plato|color|pelicula|musica|deporte|equipo|animal|cancion)(?:s)?\s+(?:favorit|preferid)[oa]s?\b/.test(texto)
    || /\b(?:que|cual)\b.*\b(?:te gusta comer|te gusta mas|prefieres comer)\b/.test(texto)
    || /\byour (?:favou?rite|preferred) (?:food|dish|colou?r|movie|music|sport|team|animal|song)\b/.test(texto);
}
