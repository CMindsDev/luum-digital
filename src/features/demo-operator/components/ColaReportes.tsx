import { ChevronDown, Inbox, Scale } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

  // Si el botón que abrió el diálogo desapareció (el reporte salió de la cola), el foco vuelve al título.
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
      notificar({ tono: "exito", titulo: `${actualizado.folio}: reporte validado`, descripcion: "Ahora está «En proceso de atención»." });
      registrar({
        texto: `${actualizado.folio} validado: «En proceso de atención». Los puntos pendientes de quien reportó se aprobaron una sola vez.`,
        enlace: { to: `/reportes/${encodeURIComponent(actualizado.id)}`, etiqueta: `Ver ${actualizado.folio}` },
      });
      setAccionesHechas((n) => n + 1);
    } catch {
      // El error se muestra en el diálogo.
    }
  };

  const atendido = (reporte: Reporte) => {
    setPorAtender(null);
    notificar({ tono: "exito", titulo: `${reporte.folio}: atención registrada`, descripcion: "Estado: «Solucionado» (atención reportada)." });
    registrar({
      texto: `${reporte.folio}: atención registrada. Estado «Solucionado» (atención reportada); se abrió la verificación ciudadana.`,
      enlace: { to: `/reportes/${encodeURIComponent(reporte.id)}`, etiqueta: `Ver ${reporte.folio}` },
    });
    setAccionesHechas((n) => n + 1);
  };

  const cancelado = (reporte: Reporte) => {
    setPorCancelar(null);
    notificar({ tono: "info", titulo: `${reporte.folio}: reporte cancelado`, descripcion: "Se registró el motivo y se ajustaron sus puntos." });
    registrar({
      texto: `${reporte.folio} cancelado con motivo. Sus puntos pendientes se cancelaron y los aprobados se revirtieron.`,
      enlace: { to: `/reportes/${encodeURIComponent(reporte.id)}`, etiqueta: `Ver ${reporte.folio}` },
    });
    setAccionesHechas((n) => n + 1);
  };

  return (
    <section aria-labelledby="titulo-cola" className="flex flex-col gap-4" data-guia="operador.cola_reportes">
      <div className="flex flex-col gap-2">
        <h2 id="titulo-cola" ref={tituloRef} tabIndex={-1} className="text-xl font-semibold text-marino outline-none">
          Reportes por atender{reportes.data ? <span className="font-normal text-tinta-suave"> ({filtrada.length})</span> : null}
        </h2>
        <p className="flex max-w-prose items-start gap-2 text-[0.9375rem] text-tinta">
          <Scale aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" />
          <span>{AVISO_PRIORIDAD} Criterios: riesgo declarado, antigüedad y tipo de incidente.</span>
        </p>
      </div>

      <SegmentedControl
        etiqueta="Estado municipal"
        valor={vista}
        onCambiar={(valor) => {
          setVista(valor);
          setVisibles(POR_PAGINA);
        }}
        opciones={[
          { valor: "todos", etiqueta: "Todos" },
          { valor: "registrado", etiqueta: "Registrados" },
          { valor: "en_proceso", etiqueta: "En proceso" },
        ]}
        guia="operador.filtro_cola"
      />

      {reportes.isPending ? (
        <LoadingState etiqueta="Cargando la cola de reportes…" />
      ) : reportes.isError ? (
        <ErrorState error={reportes.error} nivel={3} titulo="No pudimos cargar la cola" onReintentar={() => void reportes.refetch()} />
      ) : filtrada.length === 0 ? (
        <EmptyState nivel={3} icono={Inbox} titulo="No hay reportes en esta vista" descripcion="Cuando haya reportes registrados o en proceso de atención aparecerán aquí." />
      ) : (
        <>
          <ol className="flex flex-col gap-3" aria-label="Cola de reportes, de mayor a menor prioridad">
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
              Mostrar más ({filtrada.length - visibles} restantes)
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
        titulo={porValidar ? `¿Validar ${porValidar.folio}?` : "¿Validar el reporte?"}
        descripcion={
          <>
            Pasará a «En proceso de atención». Los{" "}
            {reglas.data ? puntosEnTexto(reglas.data.reporteValidado) : "puntos"} pendientes de quien reportó se aprueban una sola vez (la misma
            validación nunca acredita dos veces).
          </>
        }
        textoConfirmar="Validar reporte"
        cargando={validar.isPending}
      >
        <ErrorAccion error={validar.error} />
      </ConfirmDialog>
      <DialogoAtencion reporte={porAtender} onCerrar={() => setPorAtender(null)} onHecho={atendido} />
      <DialogoCancelacion reporte={porCancelar} onCerrar={() => setPorCancelar(null)} onHecho={cancelado} />
    </section>
  );
}
