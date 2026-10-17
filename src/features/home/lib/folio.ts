import { t } from "i18next";
import { esFolioDemo, normalizarFolio, tipoDeFolio } from "@/domain/folios";

export type ResultadoFolio = { ok: true; folio: string; ruta: string; destino: string } | { ok: false; error: string };

/**
 * Interpreta un folio de demostración escrito por la persona y devuelve la pantalla donde se
 * consulta: los reportes (DEMO-R-…) en «Mis reportes» y el resto de gestiones en «Mis gestiones».
 * Nunca inventa folios: sólo acepta el formato DEMO del prototipo.
 */
export function rutaDeFolio(entrada: string): ResultadoFolio {
  const texto = entrada.trim();
  if (!texto) return { ok: false, error: t("Escribe tu folio, por ejemplo DEMO-R-0000001.") };
  const folio = normalizarFolio(texto);
  if (!esFolioDemo(folio)) {
    return {
      ok: false,
      error: t("Ese folio no tiene el formato de demostración (DEMO-R-…, DEMO-G-…, DEMO-P-…, DEMO-C-… o DEMO-B-…)."),
    };
  }
  const tipo = tipoDeFolio(folio);
  if (tipo === "reporte") {
    return { ok: true, folio, ruta: `/reportes/mis-reportes?folio=${encodeURIComponent(folio)}`, destino: t("Mis reportes") };
  }
  if (tipo === "canje") {
    return { ok: true, folio, ruta: `/participacion/recompensas?folio=${encodeURIComponent(folio)}`, destino: t("Recompensas") };
  }
  if (tipo === "apoyo") {
    return { ok: false, error: t("Las solicitudes de orientación de bienestar no se guardan y no se pueden consultar con un folio.") };
  }
  return { ok: true, folio, ruta: `/gestiones?folio=${encodeURIComponent(folio)}`, destino: t("Mis gestiones") };
}
