// Genera los íconos PNG de la PWA a partir del glifo pixelado del Laboratorio de Innovación
// (lima del logotipo #B7ED3B sobre marino #1C3174) usando el Chromium de Playwright ya instalado.
// Uso: node scripts/generate-icons.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const destino = join(raiz, "public", "icons");

const MARINO = "#1C3174";
const LIMA_LOGO = "#B7ED3B";

// Mismo dibujo que src/design-system/components/LabGlyph.tsx (cuadrícula 9 × 9).
const DIAGONALES = [
  [1, 1],
  [2, 2],
  [7, 1],
  [6, 2],
  [1, 7],
  [2, 6],
  [7, 7],
  [6, 6],
];
const glifo = [
  '<rect x="4" y="0" width="1" height="9" rx="0.16"/>',
  '<rect x="0" y="4" width="9" height="1" rx="0.16"/>',
  '<rect x="3" y="3" width="3" height="3" rx="0.2"/>',
  ...DIAGONALES.map(([x, y]) => `<rect x="${x + 0.04}" y="${y + 0.04}" width="0.92" height="0.92" rx="0.14"/>`),
].join("");

/**
 * @param {object} opciones
 * @param {number} opciones.tamano  Lado en px.
 * @param {number} opciones.escalaGlifo  Fracción del lado que ocupa el glifo.
 * @param {number} opciones.radio  Radio de las esquinas del fondo (fracción del lado); 0 = cuadrado completo.
 */
function svgIcono({ tamano, escalaGlifo, radio }) {
  const lado = 100;
  const glifoLado = lado * escalaGlifo;
  const desplazamiento = (lado - glifoLado) / 2;
  const escala = glifoLado / 9;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamano}" height="${tamano}" viewBox="0 0 ${lado} ${lado}">
  <rect width="${lado}" height="${lado}" rx="${lado * radio}" fill="${MARINO}"/>
  <g fill="${LIMA_LOGO}" transform="translate(${desplazamiento} ${desplazamiento}) scale(${escala})">${glifo}</g>
</svg>`;
}

const ICONOS = [
  // «any»: esquinas redondeadas como los mosaicos del Laboratorio.
  { archivo: "icon-192.png", tamano: 192, escalaGlifo: 0.62, radio: 0.22 },
  { archivo: "icon-512.png", tamano: 512, escalaGlifo: 0.62, radio: 0.22 },
  // «maskable»: fondo completo y glifo dentro de la zona segura (círculo central del 80 %).
  { archivo: "icon-maskable-512.png", tamano: 512, escalaGlifo: 0.5, radio: 0 },
  // iOS aplica su propia máscara: fondo completo sin transparencia.
  { archivo: "apple-touch-icon-180.png", tamano: 180, escalaGlifo: 0.6, radio: 0 },
];

await mkdir(destino, { recursive: true });
const navegador = await chromium.launch();
try {
  const pagina = await navegador.newPage({ deviceScaleFactor: 1 });
  for (const icono of ICONOS) {
    const svg = svgIcono(icono);
    await pagina.setViewportSize({ width: icono.tamano, height: icono.tamano });
    await pagina.setContent(
      `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style></head><body>${svg}</body></html>`,
    );
    const png = await pagina.locator("svg").screenshot({ omitBackground: true, type: "png" });
    await writeFile(join(destino, icono.archivo), png);
    process.stdout.write(`✓ public/icons/${icono.archivo} (${icono.tamano}×${icono.tamano})\n`);
  }
} finally {
  await navegador.close();
}
