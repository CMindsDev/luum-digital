import { BadgeCheck, CircleCheck, CircleMinus, CircleX, Coins, MessageSquareText, RefreshCcw, TriangleAlert, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge, Button, Card, cx } from "@/design-system";
import { calcularPuntosVerificacion, claveEventoVerificacion } from "@/domain/verificacion";
import { formatearPuntosConSigno } from "@/features/rewards";
import { msg } from "@/i18n";
import type { ReglasPuntosDemo, Verificacion } from "@/types";
import { nombrePersona } from "../lib/personas";

const ETIQUETA_RESULTADO_LOCAL: Record<Verificacion["resultado"], string> = {
  reparacion_completada: msg("La reparación parece completada"),
  problema_persiste: msg("El problema persiste"),
  no_puedo_comprobar: msg("No pude comprobarlo"),
};

const ICONO_RESULTADO_LOCAL = {
  reparacion_completada: CircleCheck,
  problema_persiste: TriangleAlert,
  no_puedo_comprobar: CircleMinus,
};

const ETIQUETA_REVISION_LOCAL: Record<Verificacion["estadoRevision"], string> = {
  pendiente_revision: msg("Pendiente de revisión"),
  aprobada: msg("Aprobada"),
  rechazada: msg("No aprobada"),
  revertida: msg("Validación revertida"),
};

const TONO_REVISION_LOCAL: Record<Verificacion["estadoRevision"], "aviso" | "exito" | "peligro"> = {
  pendiente_revision: "aviso",
  aprobada: "exito",
  rechazada: "peligro",
  revertida: "peligro",
};

const ICONO_REVISION_LOCAL = {
  pendiente_revision: CircleMinus,
  aprobada: BadgeCheck,
  rechazada: CircleX,
  revertida: Undo2,
};

const CRITERIOS_CALIDAD = [
  { clave: "descripcionUtil", etiqueta: msg("Comentario útil") },
  { clave: "ubicacionConfirmada", etiqueta: msg("Ubicación confirmada") },
  { clave: "evidencia", etiqueta: msg("Foto de evidencia") },
] as const;

export interface TarjetaRevisionProps {
  verificacion: Verificacion;
  reglas: ReglasPuntosDemo | undefined;
  /** Identidad activa (no puede revisar su propia verificación). */
  actorId: string;
  bloqueado: boolean;
  repitiendo: boolean;
  onAprobar: (verificacion: Verificacion) => void;
  onRechazar: (verificacion: Verificacion) => void;
  onRevertir: (verificacion: Verificacion) => void;
  onRepetirAprobacion: (verificacion: Verificacion) => void;
}

function MovimientoAsociado({ verificacion, reglas }: { verificacion: Verificacion; reglas: ReglasPuntosDemo | undefined }) {
  const { t } = useTranslation();
  if (!reglas) return null;
  const puntos = calcularPuntosVerificacion(verificacion.resultado, verificacion.calidad, reglas);
  const texto: Record<Verificacion["estadoRevision"], string> = {
    pendiente_revision: t("{{puntos}} pendientes: no suman hasta aprobar.", { puntos: formatearPuntosConSigno(puntos) }),
    aprobada: t("{{puntos}} acreditados una sola vez.", { puntos: formatearPuntosConSigno(puntos) }),
    rechazada: t("{{puntos}} cancelados: no suman.", { puntos: formatearPuntosConSigno(puntos) }),
    revertida: t("{{positivos}} acreditados y {{negativos}} revertidos con motivo.", {
      positivos: formatearPuntosConSigno(puntos),
      negativos: formatearPuntosConSigno(-puntos),
    }),
  };

  return (
    <div className="flex items-start gap-2 rounded-control border border-borde bg-superficie-2 px-3 py-2.5 text-sm text-tinta">
      <Coins aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-marino" />
      <p className="min-w-0">
        <strong className="font-semibold">{t("Movimiento de puntos: ")}</strong>
        {texto[verificacion.estadoRevision]}{" "}
        <span className="text-tinta-suave">
          {t("Clave de evento única ")}<code className="font-mono break-all">{claveEventoVerificacion(verificacion.id)}</code>
        </span>
      </p>
    </div>
  );
}

function CriteriosCalidadLocal({ calidad }: { calidad: Verificacion["calidad"] }) {
  const { t } = useTranslation();
  return (
    <ul aria-label={t("Criterios de calidad")} className={cx("flex flex-wrap gap-x-4 gap-y-1.5")}>
      {CRITERIOS_CALIDAD.map(({ clave, etiqueta }) => {
        const cumple = calidad[clave];
        const Icono = cumple ? CircleCheck : CircleMinus;
        return (
          <li key={clave} className={cx("inline-flex items-center gap-1.5 text-sm", cumple ? "font-medium text-exito" : "text-tinta-suave")}>
            <Icono aria-hidden="true" className="size-4 shrink-0" />
            {t(etiqueta)}
            <span className="sr-only">{cumple ? t(": sí") : t(": no")}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Verificación ciudadana en revisión: quién, qué respondió, calidad, puntos y acciones permitidas. */
export function TarjetaRevision({
  verificacion,
  reglas,
  actorId,
  bloqueado,
  repitiendo,
  onAprobar,
  onRechazar,
  onRevertir,
  onRepetirAprobacion,
}: TarjetaRevisionProps) {
  const { t } = useTranslation();
  const Icono = ICONO_RESULTADO_LOCAL[verificacion.resultado];
  const IconoRevision = ICONO_REVISION_LOCAL[verificacion.estadoRevision];
  const propia = verificacion.identidadId === actorId;
  const deshabilitado = bloqueado || propia;
  const folio = verificacion.reporteFolio;

  return (
    <Card as="article" className="flex flex-col gap-3" data-verificacion-id={verificacion.id} data-folio={folio}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base leading-snug font-semibold text-marino">
          {t("Verificación de ")}<span className="font-mono tracking-wide">{folio}</span>
        </h3>
        <Badge tono={TONO_REVISION_LOCAL[verificacion.estadoRevision]} icono={IconoRevision}>
          <span className="sr-only">{t("Revisión: ")}</span>
          {t(ETIQUETA_REVISION_LOCAL[verificacion.estadoRevision])}
        </Badge>
      </div>
      <p className="text-sm text-tinta-suave">{nombrePersona(verificacion.identidadId)}</p>
      <p className="flex items-center gap-2 text-[0.9375rem] font-medium text-tinta">
        <Icono aria-hidden="true" className="size-5 shrink-0 text-marino" />
        {t(ETIQUETA_RESULTADO_LOCAL[verificacion.resultado])}
      </p>
      {verificacion.comentario ? (
        <p className="flex items-start gap-2 text-sm text-tinta">
          <MessageSquareText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tinta-suave" />
          <span className="min-w-0 break-words">«{t(verificacion.comentario)}»</span>
        </p>
      ) : (
        <p className="text-sm text-tinta-suave">{t("Sin comentario.")}</p>
      )}
      <CriteriosCalidadLocal calidad={verificacion.calidad} />
      <MovimientoAsociado verificacion={verificacion} reglas={reglas} />
      {verificacion.motivoRevision ? (
        <p className="text-sm text-tinta">
          <strong className="font-semibold">{t("Motivo registrado: ")}</strong>
          {t(verificacion.motivoRevision)}
        </p>
      ) : null}
      {propia ? <p className="text-sm font-medium text-aviso">{t("No puedes revisar una verificación que tú enviaste.")}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        {verificacion.estadoRevision === "pendiente_revision" ? (
          <>
            <Button tamano="sm" variante="exito" iconoInicio={BadgeCheck} disabled={deshabilitado} onClick={() => onAprobar(verificacion)} data-guia={`operador.aprobar_${verificacion.id}`}>
              {t("Aprobar")}
              <span className="sr-only"> {t("la verificación de {{folio}}", { folio })}</span>
            </Button>
            <Button tamano="sm" variante="fantasma" iconoInicio={CircleX} disabled={deshabilitado} onClick={() => onRechazar(verificacion)} data-guia={`operador.rechazar_${verificacion.id}`}>
              {t("Rechazar con motivo")}
              <span className="sr-only"> {t("la verificación de {{folio}}", { folio })}</span>
            </Button>
          </>
        ) : null}
        {verificacion.estadoRevision === "aprobada" ? (
          <>
            <Button tamano="sm" variante="fantasma" iconoInicio={Undo2} disabled={deshabilitado} onClick={() => onRevertir(verificacion)} data-guia={`operador.revertir_${verificacion.id}`}>
              {t("Revertir con motivo")}
              <span className="sr-only"> {t("la verificación de {{folio}}", { folio })}</span>
            </Button>
            <Button tamano="sm" variante="secundario" iconoInicio={RefreshCcw} disabled={deshabilitado} cargando={repitiendo} onClick={() => onRepetirAprobacion(verificacion)} data-guia={`operador.repetir_aprobacion_${verificacion.id}`}>
              {t("Repetir aprobación")}
              <span className="sr-only"> {t("de {{folio}}", { folio })}</span>
            </Button>
          </>
        ) : null}
        <Link to={`/reportes/${encodeURIComponent(verificacion.reporteId)}`} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-enlace underline underline-offset-2">
          {t("Ver reporte")}
          <span className="sr-only"> {folio}</span>
        </Link>
      </div>
    </Card>
  );
}
