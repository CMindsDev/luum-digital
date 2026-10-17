import { ClipboardCheck, Info, Undo2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSinConexion } from "@/app/hooks/useSinConexion";
import { useActiveIdentity } from "@/app/session/store";
import { ConfirmDialog, EmptyState, ErrorState, LoadingState, SegmentedControl, describirError, notificar } from "@/design-system";
import { calcularPuntosVerificacion } from "@/domain/verificacion";
import { puntosEnTexto } from "@/features/rewards";
import { useApproveVerification, useRejectVerification, useRevertVerification, useRewardRules, useVerificationsForReview } from "@/services/hooks";
import type { Verificacion } from "@/types";
import type { RegistrarAccion } from "../lib/registro";
import { nombrePersona } from "../lib/personas";
import { DialogoMotivo } from "./DialogoMotivo";
import { ErrorAccion } from "./ErrorAccion";
import { TarjetaRevision } from "./TarjetaRevision";

type VistaRevision = "pendientes" | "revisadas";

/**
 * Revisión de verificaciones ciudadanas: aprobar (acredita una sola vez), rechazar con motivo y
 * revertir con motivo. «Repetir aprobación» demuestra que aprobar dos veces no duplica puntos.
 * Aprobar no cambia el estado municipal: sólo el eje de verificación ciudadana.
 */
export function RevisionVerificaciones({ registrar }: { registrar: RegistrarAccion }) {
  const actor = useActiveIdentity();
  const verificaciones = useVerificationsForReview();
  const reglas = useRewardRules();
  const aprobar = useApproveVerification();
  const rechazar = useRejectVerification();
  const revertir = useRevertVerification();
  const sinConexion = useSinConexion();
  const [vista, setVista] = useState<VistaRevision>("pendientes");
  const [porAprobar, setPorAprobar] = useState<Verificacion | null>(null);
  const [porRechazar, setPorRechazar] = useState<Verificacion | null>(null);
  const [porRevertir, setPorRevertir] = useState<Verificacion | null>(null);
  const [repitiendoId, setRepitiendoId] = useState<string | null>(null);
  const [accionesHechas, setAccionesHechas] = useState(0);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  const lista = verificaciones.data ?? [];
  const pendientes = lista.filter((v) => v.estadoRevision === "pendiente_revision");
  const revisadas = lista.filter((v) => v.estadoRevision !== "pendiente_revision");
  const visibles = vista === "pendientes" ? pendientes : revisadas;

  useEffect(() => {
    if (accionesHechas === 0) return;
    if (document.activeElement === document.body || document.activeElement === null) tituloRef.current?.focus();
  }, [accionesHechas]);

  const puntosDe = (verificacion: Verificacion) =>
    reglas.data ? puntosEnTexto(calcularPuntosVerificacion(verificacion.resultado, verificacion.calidad, reglas.data)) : "Los puntos";

  const confirmarAprobacion = async () => {
    if (!porAprobar || aprobar.isPending) return;
    const verificacion = porAprobar;
    try {
      await aprobar.mutateAsync(verificacion.id);
      setPorAprobar(null);
      aprobar.reset();
      notificar({ tono: "exito", titulo: "Verificación aprobada", descripcion: `${puntosDe(verificacion)} acreditados una sola vez.` });
      registrar({
        texto: `Verificación de ${verificacion.reporteFolio} aprobada: ${puntosDe(verificacion)} acreditados una sola vez a ${nombrePersona(verificacion.identidadId)}.`,
      });
      setAccionesHechas((n) => n + 1);
    } catch {
      // El error se muestra en el diálogo.
    }
  };

  const repetirAprobacion = async (verificacion: Verificacion) => {
    if (aprobar.isPending) return;
    setRepitiendoId(verificacion.id);
    try {
      const resultado = await aprobar.mutateAsync(verificacion.id);
      const sinCambio = resultado.estadoRevision === "aprobada";
      notificar({
        tono: "info",
        titulo: sinCambio ? "Ya estaba aprobada" : "Aprobación aplicada",
        descripcion: sinCambio ? "No se acreditaron puntos de nuevo: la clave de evento es única." : undefined,
      });
      registrar({
        texto: `Aprobación repetida de ${verificacion.reporteFolio}: ya estaba aprobada, no se acreditaron puntos de nuevo.`,
      });
    } catch (error) {
      notificar({ tono: "error", titulo: describirError(error).titulo, descripcion: describirError(error).descripcion });
    } finally {
      aprobar.reset();
      setRepitiendoId(null);
    }
  };

  const confirmarRechazo = async (motivo: string) => {
    if (!porRechazar) return;
    const verificacion = porRechazar;
    await rechazar.mutateAsync({ id: verificacion.id, motivo });
    setPorRechazar(null);
    rechazar.reset();
    notificar({ tono: "info", titulo: "Verificación rechazada", descripcion: "Sus puntos pendientes se cancelaron con tu motivo." });
    registrar({ texto: `Verificación de ${verificacion.reporteFolio} rechazada con motivo: «${motivo.trim()}». Sus puntos pendientes no suman.` });
    setAccionesHechas((n) => n + 1);
  };

  const confirmarReversion = async (motivo: string) => {
    if (!porRevertir) return;
    const verificacion = porRevertir;
    await revertir.mutateAsync({ id: verificacion.id, motivo });
    setPorRevertir(null);
    revertir.reset();
    notificar({ tono: "info", titulo: "Validación revertida", descripcion: "Se registró un movimiento de reversión con tu motivo." });
    registrar({ texto: `Validación de ${verificacion.reporteFolio} revertida con motivo: «${motivo.trim()}». Se descontaron ${puntosDe(verificacion)}.` });
    setAccionesHechas((n) => n + 1);
  };

  return (
    <section aria-labelledby="titulo-revision" className="flex flex-col gap-4" data-guia="operador.verificaciones">
      <div className="flex flex-col gap-2">
        <h2 id="titulo-revision" ref={tituloRef} tabIndex={-1} className="text-xl font-semibold text-marino outline-none">
          Verificaciones ciudadanas{verificaciones.data ? <span className="font-normal text-tinta-suave"> ({visibles.length})</span> : null}
        </h2>
        <p className="flex max-w-prose items-start gap-2 text-[0.9375rem] text-tinta">
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" />
          <span>
            Revisa la calidad, no si la respuesta es positiva. Aprobar acredita los puntos una sola vez y no cambia el estado municipal: un voto
            ciudadano nunca cierra un reporte.
          </span>
        </p>
      </div>

      <SegmentedControl
        etiqueta="Estado de revisión"
        valor={vista}
        onCambiar={setVista}
        opciones={[
          { valor: "pendientes", etiqueta: `Pendientes (${pendientes.length})` },
          { valor: "revisadas", etiqueta: `Revisadas (${revisadas.length})` },
        ]}
        guia="operador.filtro_verificaciones"
      />

      {verificaciones.isPending ? (
        <LoadingState etiqueta="Cargando verificaciones…" />
      ) : verificaciones.isError ? (
        <ErrorState error={verificaciones.error} nivel={3} titulo="No pudimos cargar las verificaciones" onReintentar={() => void verificaciones.refetch()} />
      ) : visibles.length === 0 ? (
        <EmptyState
          nivel={3}
          icono={ClipboardCheck}
          titulo={vista === "pendientes" ? "No hay verificaciones pendientes" : "Aún no hay verificaciones revisadas"}
          descripcion={
            vista === "pendientes"
              ? "Cuando alguien verifique un reporte solucionado, aparecerá aquí para revisión."
              : "Las verificaciones aprobadas, rechazadas o revertidas aparecerán aquí."
          }
        />
      ) : (
        <ul className="flex flex-col gap-3" aria-label={vista === "pendientes" ? "Verificaciones pendientes de revisión" : "Verificaciones revisadas"}>
          {visibles.map((verificacion) => (
            <li key={verificacion.id}>
              <TarjetaRevision
                verificacion={verificacion}
                reglas={reglas.data}
                actorId={actor.id}
                bloqueado={sinConexion}
                repitiendo={repitiendoId === verificacion.id}
                onAprobar={(v) => {
                  aprobar.reset();
                  setPorAprobar(v);
                }}
                onRechazar={(v) => {
                  rechazar.reset();
                  setPorRechazar(v);
                }}
                onRevertir={(v) => {
                  revertir.reset();
                  setPorRevertir(v);
                }}
                onRepetirAprobacion={(v) => void repetirAprobacion(v)}
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        abierto={porAprobar !== null}
        onCerrar={() => {
          if (!aprobar.isPending) setPorAprobar(null);
        }}
        onConfirmar={() => void confirmarAprobacion()}
        titulo={porAprobar ? `¿Aprobar la verificación de ${porAprobar.reporteFolio}?` : "¿Aprobar la verificación?"}
        descripcion={
          porAprobar ? (
            <>
              Se acreditan {puntosDe(porAprobar)} a {nombrePersona(porAprobar.identidadId)}, una sola vez. El estado municipal del reporte no
              cambia.
            </>
          ) : null
        }
        textoConfirmar="Aprobar y acreditar"
        cargando={aprobar.isPending && repitiendoId === null}
      >
        <ErrorAccion error={repitiendoId === null ? aprobar.error : null} />
      </ConfirmDialog>

      <DialogoMotivo
        abierto={porRechazar !== null}
        titulo={porRechazar ? `Rechazar la verificación de ${porRechazar.reporteFolio}` : "Rechazar la verificación"}
        descripcion="Sus puntos pendientes se cancelan (no suman). El motivo queda registrado y la persona lo verá."
        etiquetaMotivo="Motivo del rechazo"
        textoConfirmar="Rechazar verificación"
        iconoConfirmar={XCircle}
        error={rechazar.error}
        procesando={rechazar.isPending}
        guia="operador.motivo_rechazo"
        onCerrar={() => setPorRechazar(null)}
        onConfirmar={confirmarRechazo}
      />

      <DialogoMotivo
        abierto={porRevertir !== null}
        titulo={porRevertir ? `Revertir la validación de ${porRevertir.reporteFolio}` : "Revertir la validación"}
        descripcion="Se registra un movimiento negativo con tu motivo; el historial de puntos no se borra. Revertir dos veces no descuenta dos veces."
        etiquetaMotivo="Motivo de la reversión"
        textoConfirmar="Revertir validación"
        iconoConfirmar={Undo2}
        error={revertir.error}
        procesando={revertir.isPending}
        guia="operador.motivo_reversion"
        onCerrar={() => setPorRevertir(null)}
        onConfirmar={confirmarReversion}
      />
    </section>
  );
}
