import type { ExpertoAsistente } from "@shared/asistente/expertos";
import { normalizarTexto } from "./busqueda";
import { detectarIntencion } from "./intencion";

/** Router local: no envía la pregunta a otro servicio ni amplía las acciones del asistente. */
export function enrutarExperto(pregunta: string, actual: ExpertoAsistente = "general"): ExpertoAsistente {
  const texto = normalizarTexto(pregunta);
  const intencion = detectarIntencion(pregunta);
  if (intencion.intencion === "ayuda_inmediata" || intencion.intencion === "apoyo_psicologico" || /apoyo emocional|toj oolal/.test(texto)) return "bienestar";
  if (/\b(tu|tus)\b.*\b(favorit|preferid)|receta|programacion|capital de francia/.test(texto)) return "general";
  if (/catastro|predio|uso de suelo|construccion|urbaniz|urbano|bache|paviment|alineamiento|deslinde/.test(texto)) return "urbano";
  if (/juridic|legal|reglamento|normativ|recurso de|impugna|derechos|abogad|sancion|denuncia/.test(texto)) return "juridico";
  if (/medio ambiente|basura|residuo|recoleccion|arbol|poda|parque|jardin|alumbrado|luminaria|animal/.test(texto)) return "medio_ambiente";
  if (/tramite|requisito|documento|pago|pagar|predial|licencia|permiso|expediente|folio|cita/.test(texto)) return "tramites";
  if (/cuanto cuesta|costo/.test(texto)) return actual === "general" ? "tramites" : actual;
  if (/^(y\b|tambien\b|entonces\b|cuanto\b|donde\b|como\b|que necesito\b)|\b(eso|ese|esa|lo anterior)\b/.test(texto)) return actual;
  return "general";
}
