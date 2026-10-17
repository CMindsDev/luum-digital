import { ChevronDown, Inbox, Scale } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSinConexion } from "@/app/hooks/useSinConexion";
import { AVISO_PRIORIDAD } from "@/domain/prioridad";
import { Button, ConfirmDialog, EmptyState, ErrorState, LoadingState, SegmentedControl, notificar } from "@/design-system";
import { puntosEnTexto } from "@/features/rewards";
import { useReports, useRewardRules, useValidateReport } from "@/services/hooks";
import type { Reporte } from "@/types";
import { FILTRO_COLA, ordenarCola } from "../lib/cola";
import type { RegistrarAccion } from "../lib/registro";
import { DialogoAtencion } from "./DialogoAtencion";
import { DialogoCancelacion } from "./DialogoCancelacion";
import { ErrorAccion } from "./ErrorAccion";
import { TarjetaReporteCola } from "./TarjetaReporteCola";

type VistaCola = "todos" | "registrado" | "en_proceso";
const POR_PAGINA = 8;

/**
 * Cola de reportes por atender, ordenada por prioridad sugerida con criterios explícitos (nunca por
 * popularidad ni puntos). Acciones: validar, registrar atención y cancelar con motivo.
 */
export function ColaReportes({ registrar }: { registrar: RegistrarAccion }) {
  const { t } = useTranslation();
  const reportes = useReports(FILTRO_COLA);
  const reglas = useRewardRules();
  const validar = useValidateReport();
  const sinConexion = useSinConexion();
  const [ahora] = useState(() => new Date());
  const [vista, setVista] = useState<VistaCola>("todos");
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [porValidar, setPorValidar] = useState<Reporte | null>(null);
  const [porAtender, setPorAtender] = useState<Reporte | null>(null);
  const [porCancelar, setPorCancelar] = useState<Reporte | null>(null);
  const [accionesHechas, setAccionesHechas] = useState(0);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  const cola = useMemo(() => ordenarCola(reportes.data ?? [], ahora), [reportes.data, ahora]);
  const filtrada = vista === "todos" ? cola : cola.filter((elemento) => elemento.reporte.estadoMunicipal === vista);

  useEffect(() => {
    if (accionesHechas === 0) return;
    if (document.activeElement === document.body || document.activeElement === null) tituloRef.current?.focus();
  }, [accionesHechas]);

  const confirmarValidacion = async () => {
    if (!porValidar || validar.isPending) return;
    try {
      const actualizado = await validar.mutateAsync(porValidar.id);
      setPorValidar(null);
      validar.reset();
      notificar({ tono: "exito", titulo: t("{{folio}}: reporte validado", { folio: actualizado.folio }), descripcion: t("Ahora está «En proceso de atención».") });
      registrar({
        texto: t("{{folio}} validado: «En proceso de atención». Los puntos pendientes de quien reportó se aprobaron una sola vez.", { folio: actualizado.folio }),
        enlace: { to: `/reportes/${encodeURIComponent(actualizado.id)}`, etiqueta: t("Ver {{folio}}", { folio: actualizado.folio }) },
      });
      setAccionesHechas((n) => n + 1);
    } catch {
      // El error se muestra en el diálogo.
    }
  };

  const atendido = (reporte: Reporte) => {
    setPorAtender(null);
    notificar({ tono: "exito", titulo: t("{{folio}}: atención registrada", { folio: reporte.folio }), descripcion: t("Estado: «Solucionado» (atención reportada).") });
    registrar({
      texto: t("{{folio}}: atención registrada. Estado «Solucionado» (atención reportada); se abrió la verificación ciudadana.", { folio: reporte.folio }),
      enlace: { to: `/reportes/${encodeURIComponent(reporte.id)}`, etiqueta: t("Ver {{folio}}", { folio: reporte.folio }) },
    });
    setAccionesHechas((n) => n + 1);
  };

  const cancelado = (reporte: Reporte) => {
    setPorCancelar(null);
    notificar({ tono: "info", titulo: t("{{folio}}: reporte cancelado", { folio: reporte.folio }), descripcion: t("Se registró el motivo y se ajustaron sus puntos.") });
    registrar({
      texto: t("{{folio}} cancelado con motivo. Sus puntos pendientes se cancelaron y los aprobados se revirtieron.", { folio: reporte.folio }),
      enlace: { to: `/reportes/${encodeURIComponent(reporte.id)}`, etiqueta: t("Ver {{folio}}", { folio: reporte.folio }) },
    });
    setAccionesHechas((n) => n + 1);
  };

  return (
    <section aria-labelledby="titulo-cola" className="flex flex-col gap-4" data-guia="operador.cola_reportes">
      <div className="flex flex-col gap-2">
        <h2 id="titulo-cola" ref={tituloRef} tabIndex={-1} className="text-xl font-semibold text-marino outline-none">
          {t("Reportes por atender")}
          {reportes.data ? <span className="font-normal text-tinta-suave"> ({filtrada.length})</span> : null}
        </h2>
        <p className="flex max-w-prose items-start gap-2 text-[0.9375rem] text-tinta">
          <Scale aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" />
          <span>
            {t(AVISO_PRIORIDAD)} {t("Criterios: riesgo declarado, antigüedad y tipo de incidente.")}
          </span>
        </p>
      </div>

      <SegmentedControl
        etiqueta={t("Estado municipal")}
        valor={vista}
        onCambiar={(valor) => {
          setVista(valor);
          setVisibles(POR_PAGINA);
        }}
        opciones={[
          { valor: "todos", etiqueta: t("Todos") },
          { valor: "registrado", etiqueta: t("Registrados") },
          { valor: "en_proceso", etiqueta: t("En proceso") },
        ]}
        guia="operador.filtro_cola"
      />

      {reportes.isPending ? (
        <LoadingState etiqueta={t("Cargando la cola de reportes…")} />
      ) : reportes.isError ? (
        <ErrorState error={reportes.error} nivel={3} titulo={t("No pudimos cargar la cola")} onReintentar={() => void reportes.refetch()} />
      ) : filtrada.length === 0 ? (
        <EmptyState nivel={3} icono={Inbox} titulo={t("No hay reportes en esta vista")} descripcion={t("Cuando haya reportes registrados o en proceso de atención aparecerán aquí.")} />
      ) : (
        <>
          <ol className="flex flex-col gap-3" aria-label={t("Cola de reportes, de mayor a menor prioridad")}>
            {filtrada.slice(0, visibles).map((elemento) => (
              <li key={elemento.reporte.id}>
                <TarjetaReporteCola
                  elemento={elemento}
                  bloqueado={sinConexion}
                  onValidar={(reporte) => {
                    validar.reset();
                    setPorValidar(reporte);
                  }}
                  onAtender={setPorAtender}
                  onCancelar={setPorCancelar}
                />
              </li>
            ))}
          </ol>
          {filtrada.length > visibles ? (
            <Button variante="fantasma" iconoInicio={ChevronDown} className="self-start" onClick={() => setVisibles((n) => n + POR_PAGINA)}>
              {t("Mostrar más ({{restantes}} restantes)", { restantes: filtrada.length - visibles })}
            </Button>
          ) : null}
        </>
      )}

      <ConfirmDialog
        abierto={porValidar !== null}
        onCerrar={() => {
          if (!validar.isPending) setPorValidar(null);
        }}
        onConfirmar={() => void confirmarValidacion()}
        titulo={porValidar ? t("¿Validar {{folio}}?", { folio: porValidar.folio }) : t("¿Validar el reporte?")}
        descripcion={
          porValidar
            ? t("Pasará a «En proceso de atención». Los {{puntos}} pendientes de quien reportó se aprueban una sola vez.", {
                puntos: reglas.data ? puntosEnTexto(reglas.data.reporteValidado) : t("puntos"),
              })
            : undefined
        }
        textoConfirmar={t("Validar reporte")}
        cargando={validar.isPending}
      >
        <ErrorAccion error={validar.error} />
      </ConfirmDialog>
      <DialogoAtencion reporte={porAtender} onCerrar={() => setPorAtender(null)} onHecho={atendido} />
      <DialogoCancelacion reporte={porCancelar} onCerrar={() => setPorCancelar(null)} onHecho={cancelado} />
    </section>
  );
}
