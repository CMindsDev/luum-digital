/**
 * Traduce al maya yucateco (Maaya t'aan) los textos que faltan, con un modelo de OpenAI, y los escribe en
 * src/i18n/locales/yua/<módulo>.json. NO sobrescribe traducciones existentes (las revisadas por
 * hablantes quedan intactas) salvo con --forzar. Las traducciones son PRELIMINARES: deben revisarlas
 * hablantes de maya antes de presentarlas como oficiales.
 *
 * Uso: npm run i18n:traducir [-- --modulo=src/features/reports] [--forzar]
 * Requiere OPENAI_API_KEY en .env.local. Modelo: I18N_MODELO (por defecto gpt-6-sol).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CARPETA_YUA, clavesDelCodigo, marcadores, modulo, traduccionesMaya } from "./lib/i18n-claves";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const apiKey = process.env.OPENAI_API_KEY?.trim();
if (!apiKey) throw new Error("Falta OPENAI_API_KEY en .env.local");
const MODELO = process.env.I18N_MODELO?.trim() || "gpt-6-sol";
const LOTE = 30;
const CONCURRENCIA = 4;

const filtro = process.argv.find((arg) => arg.startsWith("--modulo="))?.slice("--modulo=".length);
const forzar = process.argv.includes("--forzar");

const SISTEMA = `Traduces textos de una plataforma de servicios del Ayuntamiento de Mérida, Yucatán, del español al maya yucateco (Maaya t'aan, ISO 639-3 yua).
Normas:
- Ortografía moderna del maya yucateco (Academia de la Lengua Maya): apóstrofo para la oclusiva glotal (k'áat, t'aan), vocales largas con doble letra (aa, ee, ii, oo, uu), tono alto con tilde (á, é, í, ó, ú).
- Frases sencillas, claras y respetuosas, como las diría una persona hablante en Yucatán. Los botones y títulos, breves.
- Si NO conoces un término establecido en maya para algo técnico o administrativo (trámite, reporte, folio, expediente, CURP, INE, predial…), conserva la palabra en español (préstamo) en vez de inventar una. Nunca inventes palabras.
- Conserva EXACTAMENTE: {{marcadores}}, números, URLs, siglas (911, DEMO, CURP, INE, RFC), nombres propios y de marca (Pekito, Mérida, Ayuntamiento de Mérida, Línea Mujer, Mérida Móvil, MIDigital, Visor Urbano) y la puntuación inicial/final («¿», «¡» pueden omitirse en maya).
- Glosario fijo: Gracias = Dios bo'otik · Hola = Bix a beel · Sí = Je'el · No = Ma' · Ayuda = Áantaj · Salud = Toj óolal · Bienestar = Utsil kuxtal · Inicio = Káajbal · Buscar = Kaxtik · Servicios = Meyajo'ob · Idioma = T'aan.
- No añadas explicaciones. Devuelve SOLO un JSON {"traducciones": [ ... ]} con una cadena por cada texto, en el mismo orden.`;

async function traducirLote(textos: string[]): Promise<string[]> {
  for (let intento = 1; intento <= 3; intento += 1) {
    try {
      const respuesta = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODELO,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SISTEMA },
            { role: "user", content: JSON.stringify(textos) },
          ],
        }),
        signal: AbortSignal.timeout(180_000),
      });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      const cuerpo = (await respuesta.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const salida = (JSON.parse(cuerpo.choices?.[0]?.message?.content ?? "{}") as { traducciones?: unknown }).traducciones;
      if (!Array.isArray(salida) || salida.length !== textos.length || salida.some((x) => typeof x !== "string")) throw new Error("formato");
      return salida as string[];
    } catch (error) {
      if (intento === 3) throw error;
    }
  }
  return [];
}

const existentes = traduccionesMaya();
const claves = clavesDelCodigo(filtro);
const pendientes = [...claves].filter(([clave]) => forzar || !existentes.get(clave)?.trim());
console.log(`Por traducir: ${pendientes.length} de ${claves.size} (modelo ${MODELO})`);

const lotes: Array<Array<[string, string]>> = [];
for (let i = 0; i < pendientes.length; i += LOTE) lotes.push(pendientes.slice(i, i + LOTE));

const resultados = new Map<string, string>();
let siguiente = 0;
async function trabajador(): Promise<void> {
  while (siguiente < lotes.length) {
    const indice = siguiente;
    siguiente += 1;
    const lote = lotes[indice] as Array<[string, string]>;
    try {
      const traducidos = await traducirLote(lote.map(([clave]) => clave));
      lote.forEach(([clave], i) => {
        const valor = (traducidos[i] ?? "").trim();
        if (valor && marcadores(valor) === marcadores(clave)) resultados.set(clave, valor);
        else console.warn(`  sin traducción válida: «${clave.slice(0, 60)}»`);
      });
    } catch (error) {
      console.warn(`  lote ${indice + 1} falló: ${error instanceof Error ? error.message : "error"}`);
    }
    console.log(`  lote ${indice + 1}/${lotes.length}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCIA }, trabajador));

const porArchivo = new Map<string, Record<string, string>>();
for (const [clave, valor] of resultados) {
  const archivo = modulo(claves.get(clave) ?? "src/comun");
  const ruta = join(CARPETA_YUA, `${archivo}.json`);
  const actual = porArchivo.get(ruta) ?? (existsSync(ruta) ? (JSON.parse(readFileSync(ruta, "utf8")) as Record<string, string>) : {});
  actual[clave] = valor;
  porArchivo.set(ruta, actual);
}
for (const [ruta, datos] of porArchivo) {
  const ordenado = Object.fromEntries(Object.entries(datos).sort(([a], [b]) => a.localeCompare(b, "es")));
  writeFileSync(ruta, `${JSON.stringify(ordenado, null, 1)}\n`);
}
console.log(`Escritas ${resultados.size} traducciones en ${porArchivo.size} archivos de ${CARPETA_YUA}.`);
