import { ArrowUpRight, ChartNoAxesCombined, Hexagon, Search, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { AssistantComposer } from "@/components/ui/assistant-composer";
import { resumenOperativo } from "@/domain/area-operativa";
import { consultarIncidencias, normalizarConsulta } from "@/domain/consulta-operativa";
import { useCatalogSearch } from "@/services/hooks/catalog";
import type { Reporte } from "@/types";
import { ETIQUETA_CATEGORIA_REPORTE } from "../lib/categorias";

export function OperationsChat({
  reportes,
  enArea,
  onArea,
  onSeleccionar,
  onFiltrar,
}: {
  reportes: Reporte[];
  enArea: boolean;
  onArea: () => void;
  onSeleccionar: (id: string) => void;
  onFiltrar: (s: string) => void;
}) {
  const { t } = useTranslation();
  const [mas, setMas] = useState(false);
  const [pregunta, setPregunta] = useState("");
  const [visible, setVisible] = useState(false);
  const [modo, setModo] = useState("auto");
  const catalogo = useCatalogSearch(pregunta);
  const consulta = normalizarConsulta(pregunta);
  const coincidencias = consultarIncidencias(reportes, pregunta);
  const resumen = resumenOperativo(coincidencias);
  const esConsultaCasos =
    modo !== "catalogo" && /inciden|reporte|bache|riesgo|urgente|asignar|pendiente|luminaria|alumbrado|basura|rejilla|parque|jardin|cancelad|proceso|solucion|resuelt|resumen|pasando/.test(consulta);

  const enviar = ({ text }: { text: string }) => {
    setPregunta(text);
    setVisible(true);
    setMas(false);
  };

  return (
    <div className="op-chat-wrap">
      {visible ? (
        <section className="op-chat-answer" aria-label={t("Respuesta del asistente")}>
          <div className="flex items-center justify-between">
            <span className="op-eyebrow">
              <Sparkles size={14} aria-hidden="true" /> {t("Asistente de operación · Consulta local")}
            </span>
            <button aria-label={t("Cerrar conversación")} className="op-icon-button" onClick={() => setVisible(false)}>
              <X size={17} />
            </button>
          </div>
          <p className="my-3 text-sm font-semibold">{pregunta}</p>
          <div aria-live="polite" className="text-sm leading-relaxed">
            {esConsultaCasos ? (
              <>
                <p>
                  {enArea ? t("En el área seleccionada") : t("En la vista actual")} {t("según tu consulta: ")}
                  <strong>{t("{{total}} incidencias", { total: resumen.total })}</strong>; {t("{{pendientes}} registradas, {{enProceso}} en proceso; {{solucionados}} solucionadas y {{cancelados}} canceladas.", {
                    pendientes: resumen.pendientes,
                    enProceso: resumen.enProceso,
                    solucionados: resumen.solucionados,
                    cancelados: resumen.cancelados,
                  })}{" "}
                  {t("{{riesgos}} casos abiertos tienen riesgo declarado y {{sinAsignar}} siguen sin equipo.", {
                    riesgos: resumen.riesgos,
                    sinAsignar: resumen.sinAsignar,
                  })}
                </p>
                <div className="mt-3 space-y-1">
                  {coincidencias.slice(0, 3).map((reporte) => (
                    <button key={reporte.id} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-control bg-fondo px-3 text-left text-xs" onClick={() => onSeleccionar(reporte.id)}>
                      <span>
                        {t(ETIQUETA_CATEGORIA_REPORTE[reporte.categoria])} · {reporte.ubicacion.colonia}
                      </span>
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p>
                {catalogo.isFetching
                  ? t("Consultando el catálogo municipal…")
                  : catalogo.data?.resultados.length
                    ? t("Estas referencias coinciden con tu consulta en el catálogo municipal.")
                    : t("No encontré fichas con esos términos. Prueba con bacheo, predial, becas o licencia. También puedes consultar estados, riesgos y equipos de las incidencias.")}
              </p>
            )}
            {catalogo.isError ? <p className="mt-2 text-peligro">{t("No se pudo consultar el catálogo. Intenta de nuevo.")}</p> : null}
            {!esConsultaCasos
              ? catalogo.data?.resultados.slice(0, 3).map((resultado) => (
                  <Link key={resultado.servicio.id} to={resultado.servicio.rutaInterna} className="mt-2 flex min-h-11 items-center justify-between gap-2 border-t border-borde py-2 text-xs text-azul">
                    {resultado.servicio.nombre}
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                ))
              : null}
            <p className="mt-3 text-[11px] text-tinta-suave">
              {t("Datos de demostración. Respuesta calculada con los filtros actuales y el catálogo; sin IA generativa conectada. La consulta no ejecuta cambios.")}
            </p>
          </div>
        </section>
      ) : null}

      {!visible ? (
        <div className="op-chat-suggestions">
          <button onClick={() => enviar({ text: "¿Qué incidencias tienen riesgo declarado?" })}>
            {t("¿Qué requiere atención?")} <ArrowUpRight size={12} />
          </button>
          <button onClick={onArea}>
            {t("Analizar un área")} <Hexagon size={12} />
          </button>
        </div>
      ) : null}

      <div className="relative" onKeyDown={(e) => { if (e.key === "Escape") setMas(false); }}>
        {mas ? (
          <div className="op-context-menu" onKeyDown={(e) => { if (e.key === "Escape") setMas(false); }}>
            <p className="px-3 pb-2 text-xs text-tinta-suave">{t("Agregar contexto")}</p>
            <button onClick={() => { setMas(false); onArea(); }}>
              <Hexagon size={18} aria-hidden="true" />
              <span>
                <strong>{t("Área del mapa")}</strong>
                <small>{t("Traza una zona para analizarla")}</small>
              </span>
            </button>
            <button onClick={() => { setMas(false); onFiltrar(""); enviar({ text: "Resumen de incidencias" }); }}>
              <ChartNoAxesCombined size={18} aria-hidden="true" />
              <span>
                <strong>{t("Resumen operativo")}</strong>
                <small>{t("Consulta los casos de la vista")}</small>
              </span>
            </button>
          </div>
        ) : null}
        <AssistantComposer
          mode={modo}
          onModeChange={setModo}
          modes={[{ value: "auto", label: t("Resumen"), icon: Sparkles }, { value: "catalogo", label: t("Catálogo"), icon: Search }]}
          onAttach={() => setMas((v) => !v)}
          onSend={enviar}
          placeholder={enArea ? t("Pregunta sobre esta área de Mérida…") : t("¿Qué necesitas saber de Mérida?")}
          maxRows={4}
          className="op-composer"
        />
      </div>
      <p className="op-chat-caption">
        {enArea ? t("Contexto: área seleccionada") : "Mérida, Yucatán"} <span>·</span> {t("Información de demostración")}
      </p>
    </div>
  );
}
