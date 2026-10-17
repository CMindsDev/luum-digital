import { Activity, ArrowDownToLine, MapPin, Pencil, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/design-system";
import { superficieArea, resumenOperativo } from "@/domain/area-operativa";
import type { Coordenadas, Reporte } from "@/types";
import { COLORES_TEMA, ETIQUETA_CATEGORIA_REPORTE, TONO_REPORTE } from "../lib/categorias";

export function AreaReport({
  vertices,
  reportes,
  nombre,
  onNombre,
  onEditar,
  onCerrar,
  onSeleccionar,
  actualizado,
}: {
  vertices: Coordenadas[];
  reportes: Reporte[];
  nombre: string;
  onNombre: (s: string) => void;
  onEditar: () => void;
  onCerrar: () => void;
  onSeleccionar: (id: string) => void;
  actualizado: number;
}) {
  const { t } = useTranslation();
  const resumen = resumenOperativo(reportes);
  const categorias = Object.entries(ETIQUETA_CATEGORIA_REPORTE)
    .map(([id, nombreCategoria]) => ({ id, nombre: nombreCategoria, total: reportes.filter((r) => r.categoria === id).length }))
    .filter((c) => c.total > 0);

  const descargar = () => {
    const texto = [
      `# ${nombre || t("Área de análisis")}`,
      t("Reporte de demostración · Integración simulada"),
      t("Actualizado: {{fecha}}", { fecha: new Date(actualizado).toLocaleString("es-MX") }),
      t("Superficie aproximada: {{superficie}} km²", { superficie: superficieArea(vertices).toFixed(3) }),
      t("Incidencias: {{total}} · Registradas: {{pendientes}} · En proceso: {{enProceso}} · Solucionadas: {{solucionados}} · Canceladas: {{cancelados}}", {
        total: resumen.total,
        pendientes: resumen.pendientes,
        enProceso: resumen.enProceso,
        solucionados: resumen.solucionados,
        cancelados: resumen.cancelados,
      }),
      "",
      t("Vértices (latitud, longitud):"),
      ...vertices.map((v) => `${v.lat}, ${v.lng}`),
      "",
      ...reportes.map((r) => `${r.folio} | ${t(ETIQUETA_CATEGORIA_REPORTE[r.categoria])} | ${r.estadoMunicipal} | ${r.equipoAsignado ?? t("Sin asignar")}`),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "reporte-area-demo.txt";
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const narracion = resumen.total
    ? t(
        "{{pendientes}} casos registrados, {{enProceso}} en atención y {{solucionados}} solucionados y {{cancelados}} cancelados. {{mensaje}}",
        {
          pendientes: resumen.pendientes,
          enProceso: resumen.enProceso,
          solucionados: resumen.solucionados,
          cancelados: resumen.cancelados,
          mensaje: resumen.sinAsignar
            ? t("Revisa los casos abiertos que aún no tienen equipo.")
            : t("Los casos abiertos cuentan con equipo asignado."),
        },
      )
    : t("No hay incidencias en esta área con los filtros actuales. Amplía el área o revisa los filtros.");

  return (
    <section className="op-area-report" aria-label={t("Reporte vivo del área")}>
      <div className="flex items-center justify-between">
        <span className="op-eyebrow">
          <Activity size={14} aria-hidden="true" /> {t("Reporte vivo · Demo")}
        </span>
        <button className="op-icon-button" aria-label={t("Cerrar reporte de área")} onClick={onCerrar}>
          <X size={18} />
        </button>
      </div>

      <label className="sr-only" htmlFor="nombre-area">
        {t("Nombre del área")}
      </label>
      <input
        id="nombre-area"
        className="mt-2 w-full bg-transparent text-2xl font-semibold outline-none focus-visible:ring-2 focus-visible:ring-foco"
        maxLength={80}
        value={nombre}
        onChange={(e) => onNombre(e.target.value)}
      />

      <p className="mt-2 flex items-center gap-1 text-xs text-tinta-suave">
        <MapPin size={13} aria-hidden="true" />
        {t("Delimitación de análisis · {{superficie}} km² aprox.", { superficie: superficieArea(vertices).toFixed(3) })}
      </p>

      <div className="op-area-stats">
        <div>
          <strong>{resumen.total}</strong>
          <span>{t("incidencias")}</span>
        </div>
        <div>
          <strong>{resumen.sinAsignar}</strong>
          <span>{t("sin asignar")}</span>
        </div>
        <div>
          <strong>{resumen.riesgos}</strong>
          <span>{t("con riesgo")}</span>
        </div>
      </div>

      <h3 className="text-sm font-semibold">{t("Lo que está pasando")}</h3>
      <p className="mt-2 text-sm leading-relaxed text-tinta-suave">{narracion}</p>

      <div className="my-5 space-y-3">
        {categorias.map((categoria) => (
          <div key={categoria.id}>
            <div className="flex justify-between text-xs">
              <span>{t(categoria.nombre)}</span>
              <strong>{categoria.total}</strong>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-superficie-2">
              <div
                className={`h-full rounded-full ${COLORES_TEMA[TONO_REPORTE[categoria.id as Reporte["categoria"]]]}`}
                style={{ width: `${(categoria.total / Math.max(resumen.total, 1)) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <h3 className="mb-2 text-sm font-semibold">{t("Casos en esta área")}</h3>
      <div className="max-h-40 overflow-auto">
        {reportes.map((reporte) => (
          <button
            key={reporte.id}
            onClick={() => onSeleccionar(reporte.id)}
            className="flex min-h-11 w-full items-center justify-between gap-3 border-b border-borde text-left text-xs hover:text-azul"
          >
            <span>{t(ETIQUETA_CATEGORIA_REPORTE[reporte.categoria])}</span>
            <span>{reporte.folio} ↗</span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variante="secundario" tamano="sm" iconoInicio={Pencil} onClick={onEditar}>
          {t("Editar área")}
        </Button>
        <Button tamano="sm" iconoInicio={ArrowDownToLine} onClick={descargar}>
          {t("Descargar reporte")}
        </Button>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-tinta-suave">
        {t("Se actualiza con los reportes de esta demostración. Corte: {{hora}}. No representa límites oficiales ni datos municipales en tiempo real.", {
          hora: new Date(actualizado).toLocaleTimeString("es-MX"),
        })}
      </p>
    </section>
  );
}
