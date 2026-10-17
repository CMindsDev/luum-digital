/**
 * Lista los textos de la interfaz que aún no tienen traducción al maya y valida las existentes
 * (que conserven los {{marcadores}}).
 * Uso: npm run i18n:faltantes [-- --modulo=src/features/reports]
 */
import { clavesDelCodigo, marcadores, traduccionesMaya } from "./lib/i18n-claves";

const filtro = process.argv.find((arg) => arg.startsWith("--modulo="))?.slice("--modulo=".length);
const claves = clavesDelCodigo(filtro);
const traducciones = traduccionesMaya();

const faltantes = [...claves].filter(([clave]) => !traducciones.get(clave)?.trim());
const mal = [...traducciones].filter(([clave, valor]) => valor.trim() && marcadores(clave) !== marcadores(valor));
console.log(`Claves en el código: ${claves.size} · traducidas: ${claves.size - faltantes.length} · faltantes: ${faltantes.length}`);
for (const [clave, archivo] of faltantes.slice(0, 200)) console.log(`  FALTA  ${archivo}  «${clave.slice(0, 90)}»`);
if (faltantes.length > 200) console.log(`  … y ${faltantes.length - 200} más`);
for (const [clave] of mal) console.log(`  MARCADORES DISTINTOS  «${clave.slice(0, 90)}»`);
if (mal.length > 0) process.exitCode = 1;
