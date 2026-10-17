/**
 * Construye «[Pantalla actual]» desde el DOM (portado de Alex/Marea, screen-snapshot.ts).
 *
 * Qué incluye: ruta (sin consulta), h1, sección, rol de demostración, controles visibles y usables
 * con data-guia y su etiqueta accesible, el diálogo modal abierto y los mensajes de error visibles
 * del formulario. Qué NUNCA incluye: valores de campos, contenido de textareas ni de opciones
 * elegidas, datos del expediente o texto de conversaciones.
 */
import { LIMITES_PANTALLA, PantallaActualSchema, type PantallaActual } from "@shared/asistente/pantalla";
import type { Rol } from "@/types";

const MAX = { ruta: 160, titulo: 120, seccion: 40, id: 80, etiqueta: 80, dialogo: 80, formulario: 60, paso: 60, error: 120 } as const;

/**
 * La interfaz del propio asistente (presencia, chat, llamada, bienvenida) lleva este atributo: no es
 * parte de la pantalla que la persona usa, así que nunca se informa al modelo ni cuenta como diálogo.
 */
export const ATRIBUTO_UI_ASISTENTE = "data-asistente-ui";
const SELECTOR_UI_ASISTENTE = `[${ATRIBUTO_UI_ASISTENTE}]`;

function esDelAsistente(elemento: Element): boolean {
  return elemento.closest(SELECTOR_UI_ASISTENTE) !== null;
}

/** Ids estables en minúsculas: "modulo.control" (p. ej. reportes.bache_a_la_vista). */
const ID_GUIA = /^[a-z0-9][a-z0-9_.-]{0,79}$/;

/** Elementos cuyo contenido de texto puede ser un valor capturado por la persona. */
const SIN_TEXTO = new Set(["TEXTAREA", "SELECT", "OPTION", "INPUT", "SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT", "SVG"]);

function recortar(texto: string, maximo: number): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  const caracteres = Array.from(limpio);
  return caracteres.length > maximo ? `${caracteres.slice(0, maximo - 1).join("")}…` : limpio;
}

/** Texto visible de un elemento sin valores de formularios ni nodos ocultos. */
function textoVisible(elemento: Element): string {
  const partes: string[] = [];
  const recorrer = (nodo: Node) => {
    if (nodo.nodeType === Node.TEXT_NODE) {
      partes.push(nodo.textContent ?? "");
      return;
    }
    if (!(nodo instanceof Element)) return;
    if (SIN_TEXTO.has(nodo.tagName.toUpperCase())) return;
    if (nodo.getAttribute("aria-hidden") === "true" || nodo.hasAttribute("hidden")) return;
    if (nodo instanceof HTMLElement && nodo.isContentEditable) return;
    for (const hijo of Array.from(nodo.childNodes)) recorrer(hijo);
  };
  recorrer(elemento);
  return partes.join(" ");
}

function textoPorIds(documento: Document, ids: string | null): string {
  if (!ids) return "";
  return ids
    .split(/\s+/)
    .map((id) => documento.getElementById(id))
    .filter((elemento): elemento is HTMLElement => elemento !== null)
    .map((elemento) => textoVisible(elemento))
    .join(" ");
}

/** Etiqueta accesible aproximada (aria-labelledby, aria-label, <label>, title, alt o texto). */
export function etiquetaAccesible(elemento: Element): string {
  const documento = elemento.ownerDocument;
  const porIds = textoPorIds(documento, elemento.getAttribute("aria-labelledby"));
  if (porIds.trim()) return porIds;
  const aria = elemento.getAttribute("aria-label");
  if (aria?.trim()) return aria;
  if (
    elemento instanceof HTMLInputElement ||
    elemento instanceof HTMLSelectElement ||
    elemento instanceof HTMLTextAreaElement ||
    elemento instanceof HTMLButtonElement
  ) {
    const etiquetas = Array.from(elemento.labels ?? [])
      .map((label) => textoVisible(label))
      .join(" ");
    if (etiquetas.trim()) return etiquetas;
  }
  const titulo = elemento.getAttribute("title");
  if (titulo?.trim()) return titulo;
  const alt = elemento.getAttribute("alt");
  if (alt?.trim()) return alt;
  return textoVisible(elemento);
}

function estiloOculto(elemento: Element): boolean {
  const vista = elemento.ownerDocument.defaultView;
  if (!vista) return false;
  const estilo = vista.getComputedStyle(elemento);
  return estilo.display === "none" || estilo.visibility === "hidden" || estilo.visibility === "collapse";
}

/** Visible y usable: no hidden, inert, aria-hidden, deshabilitado ni oculto por estilos. */
export function esVisibleYUsable(elemento: Element): boolean {
  if (elemento.closest("[hidden], [inert], [aria-hidden='true']")) return false;
  if (elemento.matches(":disabled") || elemento.getAttribute("aria-disabled") === "true") return false;
  if (elemento instanceof HTMLElement && typeof elemento.checkVisibility === "function") {
    return elemento.checkVisibility({ visibilityProperty: true });
  }
  for (let actual: Element | null = elemento; actual; actual = actual.parentElement) {
    if (estiloOculto(actual)) return false;
  }
  return true;
}

function esModal(elemento: Element): boolean {
  try {
    if (elemento.matches(":modal")) return true;
  } catch {
    // Navegadores o entornos sin :modal.
  }
  return elemento.getAttribute("aria-modal") === "true";
}

/** El diálogo modal abierto que está encima (el último en el DOM), si hay uno. */
function dialogoModalAbierto(documento: Document): Element | null {
  const candidatos = Array.from(documento.querySelectorAll("dialog[open], [role='dialog'], [role='alertdialog']")).filter(
    (elemento) => !esDelAsistente(elemento) && esModal(elemento) && esVisibleYUsable(elemento),
  );
  return candidatos.at(-1) ?? null;
}

function nombreDialogo(dialogo: Element): string {
  const documento = dialogo.ownerDocument;
  const porIds = textoPorIds(documento, dialogo.getAttribute("aria-labelledby"));
  if (porIds.trim()) return porIds;
  const aria = dialogo.getAttribute("aria-label");
  if (aria?.trim()) return aria;
  const encabezado = dialogo.querySelector("h1, h2, h3");
  return encabezado ? textoVisible(encabezado) : "Diálogo";
}

/** Sección a partir de la ruta (mismos nombres que las secciones del registro de acciones). */
export function seccionDeRuta(ruta: string): string {
  const partes = ruta.split("?")[0]?.split("/").filter(Boolean) ?? [];
  const [primera, segunda] = partes;
  if (!primera) return "inicio";
  if (primera === "reportes" && segunda === "mis-reportes") return "mis_reportes";
  if (primera === "bienestar" && segunda === "salud-mental") return "salud_mental";
  if (primera === "bienestar" && segunda === "linea-mujer") return "linea_mujer";
  return recortar(primera.replaceAll("-", "_"), MAX.seccion);
}

function erroresVisibles(contenedor: Element): string[] {
  const documento = contenedor.ownerDocument;
  const elementos = new Set<Element>();
  for (const elemento of Array.from(contenedor.querySelectorAll("[role='alert'], [data-error]"))) elementos.add(elemento);
  // Mensajes de error asociados a campos inválidos (aria-describedby / aria-errormessage).
  for (const campo of Array.from(contenedor.querySelectorAll("[aria-invalid='true']"))) {
    const ids = [campo.getAttribute("aria-errormessage") ?? "", campo.getAttribute("aria-describedby") ?? ""].join(" ").split(/\s+/);
    for (const id of ids) {
      if (!id) continue;
      const mensaje = documento.getElementById(id);
      if (mensaje && (/error/i.test(id) || mensaje.matches("[role='alert'], [data-error]"))) elementos.add(mensaje);
    }
  }
  const errores: string[] = [];
  for (const elemento of elementos) {
    if (!esVisibleYUsableTexto(elemento)) continue;
    const texto = recortar(textoVisible(elemento), MAX.error);
    if (texto && !errores.includes(texto)) errores.push(texto);
    if (errores.length >= LIMITES_PANTALLA.errores) break;
  }
  return errores;
}

/** Un mensaje de error no es un control: sólo importa que se vea. */
function esVisibleYUsableTexto(elemento: Element): boolean {
  if (elemento.closest("[hidden], [inert], [aria-hidden='true']")) return false;
  for (let actual: Element | null = elemento; actual; actual = actual.parentElement) {
    if (estiloOculto(actual)) return false;
  }
  return true;
}

function formularioVisible(alcance: Element): PantallaActual["formulario"] {
  const formulario = Array.from(alcance.querySelectorAll("form")).find((candidato) => !esDelAsistente(candidato) && esVisibleYUsableTexto(candidato));
  if (!formulario) return null;
  const documento = formulario.ownerDocument;
  const leyenda = formulario.querySelector("legend, h2, h3");
  const nombre =
    formulario.getAttribute("data-formulario") ||
    textoPorIds(documento, formulario.getAttribute("aria-labelledby")) ||
    formulario.getAttribute("aria-label") ||
    (leyenda ? textoVisible(leyenda) : "") ||
    "Formulario";
  const pasoElemento = formulario.querySelector("[aria-current='step']");
  const paso = formulario.getAttribute("data-paso") || (pasoElemento ? textoVisible(pasoElemento) : "");
  return {
    nombre: recortar(nombre, MAX.formulario),
    ...(paso.trim() ? { paso: recortar(paso, MAX.paso) } : {}),
    errores: erroresVisibles(formulario),
  };
}

export interface OpcionesPantalla {
  rol: Rol;
  /** Documento a leer (por defecto, el de la ventana). */
  documento?: Document;
  /** Ruta a informar; por defecto location.pathname (nunca la consulta, puede tener texto escrito). */
  ruta?: string;
}

/** Instantánea acotada y validada de lo que ve la persona. */
export function construirPantalla({ rol, documento = document, ruta }: OpcionesPantalla): PantallaActual {
  const rutaActual = (ruta ?? documento.defaultView?.location.pathname ?? "/").split(/[?#]/)[0] || "/";
  const h1 = Array.from(documento.querySelectorAll("h1")).find((encabezado) => !esDelAsistente(encabezado) && esVisibleYUsableTexto(encabezado));
  const titulo = recortar(h1 ? textoVisible(h1) : documento.title, MAX.titulo);

  // Detrás de un diálogo modal nada se puede tocar: sólo cuenta lo que hay dentro de él.
  const dialogo = dialogoModalAbierto(documento);
  const alcance: Element = dialogo ?? documento.body;

  const objetivos: PantallaActual["objetivos"] = [];
  const vistos = new Set<string>();
  for (const elemento of Array.from(alcance.querySelectorAll("[data-guia]"))) {
    if (objetivos.length >= LIMITES_PANTALLA.objetivos) break;
    const id = (elemento.getAttribute("data-guia") ?? "").trim();
    if (!ID_GUIA.test(id) || vistos.has(id) || esDelAsistente(elemento) || !esVisibleYUsable(elemento)) continue;
    const etiqueta = recortar(etiquetaAccesible(elemento), MAX.etiqueta) || id;
    vistos.add(id);
    objetivos.push({ id, etiqueta });
  }

  const pantalla: PantallaActual = {
    ruta: recortar(rutaActual, MAX.ruta),
    titulo,
    seccion: seccionDeRuta(rutaActual),
    rol,
    objetivos,
    dialogoAbierto: dialogo ? recortar(nombreDialogo(dialogo), MAX.dialogo) || "Diálogo" : null,
    formulario: formularioVisible(alcance),
  };
  // Nunca debería fallar; si falla, se envía lo mínimo para no bloquear la conversación.
  const validada = PantallaActualSchema.safeParse(pantalla);
  return validada.success ? validada.data : pantallaMinima(rutaActual, rol);
}

export function pantallaMinima(ruta: string, rol: Rol): PantallaActual {
  return {
    ruta: recortar(ruta || "/", MAX.ruta),
    titulo: "",
    seccion: seccionDeRuta(ruta || "/"),
    rol,
    objetivos: [],
    dialogoAbierto: null,
    formulario: null,
  };
}

export interface OpcionesObservarPantalla {
  obtenerRol: () => Rol;
  /** Espera tras el último cambio antes de releer (por defecto 300 ms). */
  debounceMs?: number;
  documento?: Document;
}

/**
 * Observa el DOM y la navegación; llama a `alCambiar` (con debounce) sólo cuando la instantánea
 * cambió. Devuelve la función para dejar de observar.
 */
export function observarPantalla(alCambiar: (pantalla: PantallaActual) => void, opciones: OpcionesObservarPantalla): () => void {
  const documento = opciones.documento ?? document;
  const ventana = documento.defaultView;
  const espera = opciones.debounceMs ?? 300;
  let temporizador: ReturnType<typeof setTimeout> | null = null;
  let ultima = "";

  const leer = () => {
    temporizador = null;
    const pantalla = construirPantalla({ rol: opciones.obtenerRol(), documento });
    const serializada = JSON.stringify(pantalla);
    if (serializada === ultima) return;
    ultima = serializada;
    alCambiar(pantalla);
  };
  const programar = () => {
    if (temporizador) clearTimeout(temporizador);
    temporizador = setTimeout(leer, espera);
  };

  const observador = new MutationObserver(programar);
  observador.observe(documento.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["hidden", "inert", "aria-hidden", "open", "data-guia", "aria-invalid", "disabled", "aria-disabled", "aria-current", "class", "style"],
  });
  ventana?.addEventListener("popstate", programar);
  programar();

  return () => {
    observador.disconnect();
    ventana?.removeEventListener("popstate", programar);
    if (temporizador) clearTimeout(temporizador);
    temporizador = null;
  };
}
