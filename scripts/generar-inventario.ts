/**
 * Genera docs/INVENTARIO_SERVICIOS.md a partir de:
 *  - docs/investigacion/<fecha>/web-*.json  (lo observado en cada sistema de origen),
 *  - src/data/catalogo (fichas importadas del Portal Ciudadano + módulos manuales).
 *
 * Uso: npm run docs:inventario
 *
 * El inventario muestra cobertura y pendientes; no declara que estén "todos los servicios municipales".
 * El estado de implementación sale de reglas explícitas (abajo), no de suposiciones: lo que no coincide
 * con ninguna regla queda como «Pendiente».
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COBERTURA_IMPORTACION, SERVICIOS } from "../src/data/catalogo/index.ts";

const RAIZ = join(import.meta.dirname, "..");
const CARPETA_INVESTIGACION = join(RAIZ, "docs/investigacion/2026-10-17");
const FECHA_CONSULTA = "2026-10-17";

interface FilaInvestigacion {
  servicio: string;
  categoria: string;
  sistemaDeOrigen: string;
  funcionalidad: string;
  tipo: string;
  fuente: string;
  estadoVerificacion: "verificada" | "parcial" | "no_accesible" | "pendiente";
  evidencia?: string;
}

const ETIQUETA_VERIFICACION: Record<FilaInvestigacion["estadoVerificacion"], string> = {
  verificada: "Verificada",
  parcial: "Parcial",
  no_accesible: "No accesible",
  pendiente: "Pendiente",
};

const IMPLEMENTACION_POR_RECORRIDO: Record<string, string> = {
  informativo: "Ficha informativa",
  formulario: "Formulario simulado",
  cita: "Solicitud de cita simulada",
  pago: "Pago simulado",
  consulta_documental: "Consulta documental",
  consulta_territorial: "Enlace al Visor interno (sin capas oficiales)",
  reporte: "Reporte simulado",
  verificacion: "Consulta de credencial ficticia",
};

interface Regla {
  patron: RegExp;
  ruta: string;
  implementacion: string;
}

const SIN_ACCESO_OFICIAL = "Pendiente (requiere acceso autorizado; no se incorporan capas ni funciones oficiales)";

// Orden importa: la primera regla que coincide gana. Los patrones se anclan a nombres concretos para
// no declarar como implementado lo que el prototipo sólo menciona o no tiene.
const REGLAS: Regla[] = [
  { patron: /bache a la vista|bacheo/i, ruta: "/reportes/nuevo/bache", implementacion: "Implementado (simulado)" },
  { patron: /desazolve/i, ruta: "/reportes/nuevo/desazolve_rejilla", implementacion: "Implementado (simulado)" },
  { patron: /basura en v[ií]a/i, ruta: "/reportes/nuevo/basura_via_publica", implementacion: "Implementado (simulado)" },
  { patron: /luminaria|alumbrado/i, ruta: "/reportes/nuevo/luminaria", implementacion: "Implementado (simulado)" },
  { patron: /mis reportes|seguimiento de reportes/i, ruta: "/reportes/mis-reportes", implementacion: "Implementado (simulado)" },
  { patron: /reportes r[aá]pidos|cat[aá]logo de reportes|reporta en l[ií]nea|animal muerto|parques y jardines|recolecci[oó]n/i, ruta: "/reportes", implementacion: "Implementado (simulado)" },
  // Visor Urbano y Geoportal: sólo las entradas de plataforma tienen un equivalente propio (visor con incidencias de demostración).
  { patron: /^(visor urbano|geoportal)$/i, ruta: "/mapa", implementacion: "Parcial: visor propio con incidencias de demostración; no integra el visor oficial" },
  { patron: /visor urbano|geoportal/i, ruta: "—", implementacion: SIN_ACCESO_OFICIAL },
  // Expediente Digital: se simula perfil y documentos; el acceso real (CURP, celular, correo) no se reproduce.
  { patron: /expediente digital\s*[–-]\s*(iniciar sesi|crear cuenta|recupera)/i, ruta: "/cuenta", implementacion: "No aplica: el prototipo usa identidades ficticias, no autenticación municipal" },
  { patron: /^expediente digital$/i, ruta: "/expediente", implementacion: "Implementado (perfil y documentos ficticios; sin autenticación real)" },
  // Línea Mujer: la línea telefónica se informa; las apps no se integran ni se envían alertas.
  { patron: /app.*l[ií]nea mujer|l[ií]nea mujer.*app|instituto de las mujeres - l[ií]nea mujer/i, ruta: "/bienestar/linea-mujer", implementacion: "Sólo informativo: la app no se integra ni se envían alertas" },
  { patron: /l[ií]nea mujer/i, ruta: "/bienestar/linea-mujer", implementacion: "Implementado (consulta, canal oficial con confirmación y solicitud simulada)" },
  // Salud mental: orientación y derivación; no se reproduce ningún cuestionario ni servicio clínico.
  { patron: /tamizaje|primeros auxilios psicol/i, ruta: "—", implementacion: "Pendiente (no se publicó el instrumento; el prototipo no reproduce cuestionarios)" },
  { patron: /alma ?nova|apoyo psicol|atenci[oó]n psicol|salud mental/i, ruta: "/bienestar/salud-mental", implementacion: "Implementado (orientación y derivación a servicios humanos; acompañante simulado)" },
  { patron: /visitas domiciliarias|visitadoras|inspectores/i, ruta: "/servicios/registro-visitas-domiciliarias", implementacion: "Parcial: consulta con credenciales ficticias; no replica el padrón oficial" },
  { patron: /^registro de regulaciones$/i, ruta: "/servicios/registro-regulaciones", implementacion: "Parcial: consulta sobre el catálogo importado; no replica el registro oficial" },
  { patron: /^cat[aá]logo municipal\b/i, ruta: "/servicios", implementacion: "Implementado (catálogo importado)" },
  { patron: /^portal ciudadano/i, ruta: "/servicios", implementacion: "Implementado (catálogo importado)" },
  { patron: /^m[eé]rida m[oó]vil|^app m[eé]rida m[oó]vil/i, ruta: "(este prototipo)", implementacion: "Referencia de interfaz; no se integra" },
];

const CODIGO_MID = /MID-[A-Z]+-\d{3}/g;
const porId = new Map(SERVICIOS.map((s) => [s.id, s]));

function resolver(fila: FilaInvestigacion): { ruta: string; implementacion: string } {
  const codigos = `${fila.servicio} ${fila.evidencia ?? ""}`.match(CODIGO_MID) ?? [];
  for (const codigo of codigos) {
    const servicio = porId.get(codigo.toLowerCase());
    if (servicio) {
      return {
        ruta: servicio.rutaInterna.replace(/\/iniciar$/, ""),
        implementacion: IMPLEMENTACION_POR_RECORRIDO[servicio.tipoDeRecorrido] ?? "Ficha informativa",
      };
    }
  }
  const regla = REGLAS.find((r) => r.patron.test(fila.servicio));
  return regla ? { ruta: regla.ruta, implementacion: regla.implementacion } : { ruta: "—", implementacion: "Pendiente" };
}

const limpiar = (texto: string, max: number) => {
  const plano = texto.replace(/\s+/g, " ").replace(/\|/g, "¦").trim();
  return plano.length > max ? `${plano.slice(0, max - 1).trimEnd()}…` : plano;
};

const corto = (url: string) => (url.length > 80 ? `${url.slice(0, 77)}…` : url);

// --- Lectura de la investigación --------------------------------------------------------------

interface GrupoInvestigacion {
  archivo: string;
  etiqueta: string;
  filas: FilaInvestigacion[];
}

const ETIQUETAS_ARCHIVO: Record<string, string> = {
  "web-merida-movil": "Mérida Móvil y Reporta",
  "web-portal-municipal": "Portal municipal, MIDigital y catálogos por categoría",
  "web-portal-ciudadano": "Portal Ciudadano y Expediente Digital",
  "web-visor-geoportal": "Visor Urbano y Geoportal",
  "web-bienestar": "Bienestar, salud mental y Línea Mujer",
};

const grupos: GrupoInvestigacion[] = readdirSync(CARPETA_INVESTIGACION)
  .filter((nombre) => /^web-.*\.json$/.test(nombre))
  .sort()
  .map((nombre) => {
    const clave = nombre.replace(/\.json$/, "");
    const datos = JSON.parse(readFileSync(join(CARPETA_INVESTIGACION, nombre), "utf8")) as { inventory: FilaInvestigacion[] };
    return { archivo: nombre, etiqueta: ETIQUETAS_ARCHIVO[clave] ?? clave, filas: datos.inventory };
  });

// --- Resúmenes del catálogo -------------------------------------------------------------------

const porCategoria = new Map<string, { verificada: number; pendiente: number; demostracion: number }>();
const porRecorrido = new Map<string, number>();
for (const s of SERVICIOS) {
  const fila = porCategoria.get(s.categoria) ?? { verificada: 0, pendiente: 0, demostracion: 0 };
  fila[s.estadoDeInformacion] += 1;
  porCategoria.set(s.categoria, fila);
  porRecorrido.set(s.tipoDeRecorrido, (porRecorrido.get(s.tipoDeRecorrido) ?? 0) + 1);
}

const lineas: string[] = [];
const out = (texto = "") => lineas.push(texto);

out("# Inventario de servicios — merida-unificada");
out();
out("> **Generado** con `npm run docs:inventario` desde `docs/investigacion/2026-10-17/` y `src/data/catalogo/`. No lo edites a mano: cambia las fuentes y vuelve a generarlo.");
out();
out(`Fecha de consulta de las fuentes: **${FECHA_CONSULTA}** (todas de sólo lectura, sin iniciar sesión, sin evadir captchas y sin datos personales).`);
out();
out("## 1. Qué cubre y qué no");
out();
out(`- **Catálogo importado:** ${COBERTURA_IMPORTACION.totalImportado} de ${COBERTURA_IMPORTACION.totalFuente} fichas del listado público del Portal Ciudadano (\`${COBERTURA_IMPORTACION.fuente.url}\`).`);
out(`  - **${COBERTURA_IMPORTACION.verificados} verificadas**: se abrió su ficha y se copiaron requisitos, costo, tiempos, procedimientos y canales tal como se publican.`);
out(`  - **${COBERTURA_IMPORTACION.pendientes} pendientes de verificar**: sólo se tiene lo que muestra el listado (nombre, unidad, categorías, descripción, modalidad). La interfaz las rotula así y no muestra requisitos ni costos inventados.`);
out("- **Esto no es “todos los servicios municipales”.** Hay servicios fuera del Portal Ciudadano (por ejemplo predial, reportes, empleo y cultura en micrositios) y las cifras de la nota de prensa de MIDigital (11-ago-2026: 395 trámites, 274 regulaciones, 118 tipos de visitas domiciliarias) difieren de las observadas (387, 281 y 119): el catálogo cambia con el tiempo.");
out("- **Anunciado ≠ operando.** La integración “en un solo ecosistema” que describe la nota no pudo verificarse. Que un portal enlace a otro sistema no prueba una integración técnica.");
out("- **Ninguna integración es real en este prototipo.** Todo trámite, reporte, pago, cita, puntos y expediente es simulado localmente (ver `docs/INTEGRACIONES.md`).");
out();
out("## 2. Sistemas de origen y acceso");
out();
out("| Sistema | URL | Acceso durante la consulta | Cómo lo representa el prototipo |");
out("|---|---|---|---|");
const SISTEMAS: [string, string, string, string][] = [
  ["Portal municipal", "https://merida.gob.mx/municipio/portal/index.php", "Bloqueo anti-bot (Radware) tras pocas solicitudes; se complementó con capturas fechadas de Wayback Machine", "Navegación y nombres de servicios; enlaces oficiales como referencia"],
  ["Portal Ciudadano (MIDigital)", "https://portalciudadano.merida.gob.mx/", "Accesible", "Catálogo Municipal integrado (`/servicios`) con fichas internas"],
  ["Expediente Digital", "https://expedientedigital.merida.gob.mx/", "Accesible (sólo pantalla pública de acceso; no se inició sesión)", "Expediente ficticio (`/expediente`): perfil, documentos de ejemplo, reutilización con confirmación"],
  ["Visor Urbano", "https://visorurbano.merida.gob.mx/", "Bloqueo anti-bot; sin interfaz renderizada ni capturas", "Visor propio (`/mapa`) con incidencias de demostración; capas oficiales NO incluidas"],
  ["Geoportal", "https://geoportal.merida.gob.mx/", "HTML y JS en las primeras solicitudes; después bloqueo anti-bot; capas con token y sin condiciones de uso publicadas", "No se reutilizan capas ni servicios; se enlaza como referencia"],
  ["Mérida Móvil", "https://www.merida.gob.mx/app/", "Página bloqueada; fichas oficiales de App Store y Google Play accesibles (v4.0.2)", "Referencia principal de la experiencia móvil y de los nombres de reportes"],
  ["Reporta en línea", "https://merida.gob.mx/reporta/", "Bloqueo anti-bot; se usaron capturas de Wayback Machine", "Flujo de reporte (`/reportes`) con los campos y reglas observados"],
  ["Bienestar / salud mental / Línea Mujer", "https://merida.gob.mx/bienestar/", "Páginas bloqueadas; datos tomados de fichas del Portal Ciudadano, sala de prensa y capturas fechadas", "`/bienestar`, `/bienestar/salud-mental`, `/bienestar/linea-mujer`"],
  ["Sala de prensa", "https://prensa.merida.gob.mx/", "Accesible (versión /amp)", "Notas citadas con su fecha; una nota no implica vigencia"],
];
for (const [sistema, url, acceso, representacion] of SISTEMAS) out(`| ${sistema} | ${url} | ${acceso} | ${representacion} |`);
out();
out("## 3. Cobertura del catálogo importado");
out();
out("| Categoría del prototipo | Verificadas | Pendientes | Total |");
out("|---|---:|---:|---:|");
for (const [categoria, c] of [...porCategoria.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"))) {
  out(`| ${categoria} | ${c.verificada} | ${c.pendiente} | ${c.verificada + c.pendiente + c.demostracion} |`);
}
out();
out("| Tipo de recorrido | Fichas |");
out("|---|---:|");
for (const [tipo, n] of [...porRecorrido.entries()].sort((a, b) => b[1] - a[1])) out(`| ${IMPLEMENTACION_POR_RECORRIDO[tipo] ?? tipo} (\`${tipo}\`) | ${n} |`);
out();
out("El tipo de recorrido se asigna con reglas documentadas en `scripts/import-catalog.ts`; es una decisión del prototipo, no un dato oficial.");
out();
out("## 4. Módulos y servicios observados en los sistemas de origen");
out();
out("Columnas: **Servicio · Sistema de origen · Funcionalidad según la fuente · Fuente · Verificación · Ruta interna · Implementación**. La verificación es la de la investigación (“Parcial” = leído en una captura archivada o sólo en el listado; “No accesible” = bloqueado por validación anti-bot).");
out();
let total = 0;
for (const grupo of grupos) {
  out(`### ${grupo.etiqueta} (${grupo.filas.length})`);
  out();
  out("| Servicio | Sistema de origen | Funcionalidad | Fuente | Verificación | Ruta interna | Implementación |");
  out("|---|---|---|---|---|---|---|");
  for (const fila of grupo.filas) {
    const { ruta, implementacion } = resolver(fila);
    out(
      `| ${limpiar(fila.servicio, 90)} | ${limpiar(fila.sistemaDeOrigen, 50)} | ${limpiar(fila.funcionalidad, 150)} | ${corto(fila.fuente)} | ${ETIQUETA_VERIFICACION[fila.estadoVerificacion]} | ${ruta === "—" ? "—" : `\`${ruta}\``} | ${implementacion} |`,
    );
    total += 1;
  }
  out();
}
out(`Total de filas observadas: **${total}** (algunas aparecen en más de un sistema; las fichas del Portal Ciudadano se detallan en el apartado 5).`);
out();
out("## 5. Fichas del catálogo importado");
out();
out("Una fila por ficha. **Información**: verificada = ficha abierta y copiada; pendiente = sólo listado. **Implementación**: lo que hace hoy la ficha dentro del prototipo.");
out();
out("| Clave | Servicio | Categoría | Modalidad oficial | Información | Implementación | Ruta interna |");
out("|---|---|---|---|---|---|---|");
for (const s of [...SERVICIOS].sort((a, b) => (a.clave ?? a.id).localeCompare(b.clave ?? b.id, "es"))) {
  out(
    `| ${s.clave ?? "—"} | ${limpiar(s.nombre, 90)} | ${s.categoria} | ${limpiar(s.modalidadOficial ?? "—", 30)} | ${s.estadoDeInformacion === "verificada" ? "Verificada" : s.estadoDeInformacion === "pendiente" ? "Pendiente de verificar" : "Demostración"} | ${IMPLEMENTACION_POR_RECORRIDO[s.tipoDeRecorrido] ?? s.tipoDeRecorrido} | \`${s.rutaInterna}\` |`,
  );
}
out();
out("## 6. Pendientes de cobertura");
out();
out("- Verificar las fichas pendientes (requisitos, costos, tiempos, módulos) contra la fuente oficial y volver a ejecutar `npm run catalogo:importar`.");
out("- Servicios fuera del Portal Ciudadano: predial y pagos electrónicos, empleo, cultura, deporte, educación, regulaciones adicionales y atención ciudadana en micrositios (ver apartado 4, filas con implementación “Pendiente”).");
out("- Capas y datos del Visor Urbano y del Geoportal: requieren acceso autorizado y revisar sus condiciones de uso (ninguna se publicó). Mientras tanto, `/mapa` muestra sólo incidencias de demostración y ubicaciones de servicio verificadas con su dirección.");
out("- Horarios de Alma Nova: las fuentes oficiales se contradicen (ficha del 2026-09-25 vs. captura de mayo de 2026 vs. medios); se muestran como pendientes de verificar.");
out("- Línea de la Vida (800 911 2000, CONASAMA): fuente oficial identificada en gob.mx pero su contenido no pudo leerse de forma automática; se muestra con esa nota.");
out("- No se encontró ninguna línea de crisis de salud mental 24 h municipal en fuentes oficiales; el prototipo no la inventa.");
out();

writeFileSync(join(RAIZ, "docs/INVENTARIO_SERVICIOS.md"), `${lineas.join("\n")}\n`);
console.log(`docs/INVENTARIO_SERVICIOS.md generado: ${lineas.length} líneas, ${total} filas observadas, ${SERVICIOS.length} fichas.`);
