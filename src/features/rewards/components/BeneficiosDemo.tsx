import { CircleAlert, Gift, Info, TicketCheck } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useSinConexion } from "@/app/hooks/useSinConexion";
import {
  Button,
  ConfirmDialog,
  DemoTag,
  Dialog,
  EmptyState,
  ErrorState,
  KeyValueList,
  LoadingState,
  describirError,
  notificar,
} from "@/design-system";
import { useBalance, useBenefits, useRedeem } from "@/services/hooks";
import type { BeneficioDemo, CanjeDemo } from "@/types";
import { puntosEnTexto } from "../lib/movimientos";
import { BeneficioCard } from "./BeneficioCard";

/**
 * Beneficios de ejemplo y canje simulado: confirmación explícita (ConfirmDialog), sin dobles envíos,
 * saldo insuficiente bloqueado y código DEMO-B-… sin validez como resultado.
 */
export function BeneficiosDemo() {
  const { t } = useTranslation();
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const beneficios = useBenefits();
  const saldo = useBalance();
  const canjear = useRedeem();
  const sinConexion = useSinConexion();
  const [seleccionado, setSeleccionado] = useState<BeneficioDemo | null>(null);
  const [canje, setCanje] = useState<CanjeDemo | null>(null);

  const disponible = saldo.data?.disponible;

  const abrir = (beneficio: BeneficioDemo) => {
    canjear.reset();
    setSeleccionado(beneficio);
  };

  const cerrarConfirmacion = () => {
    if (canjear.isPending) return;
    setSeleccionado(null);
  };

  /** Al cerrar el resultado, si el botón que abrió el canje quedó deshabilitado, el foco vuelve al título. */
  const cerrarResultado = () => {
    setCanje(null);
    requestAnimationFrame(() => {
      if (document.activeElement === document.body || document.activeElement === null) tituloRef.current?.focus();
    });
  };

  const confirmar = async () => {
    if (!seleccionado || canjear.isPending) return;
    try {
      const resultado = await canjear.mutateAsync(seleccionado.id);
      setSeleccionado(null);
      setCanje(resultado);
      notificar({ tono: "exito", titulo: t("Canje simulado registrado"), descripcion: t("{{codigo}}: código de ejemplo sin validez.", { codigo: resultado.codigo }) });
    } catch {
      // El error se muestra dentro del diálogo (canjear.error) y no se descuenta nada.
    }
  };

  const envolver = (contenido: ReactNode) => (
    <section aria-labelledby="titulo-beneficios" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 id="titulo-beneficios" ref={tituloRef} tabIndex={-1} className="text-xl font-semibold text-marino outline-none">
          {t("Beneficios de ejemplo")}
        </h2>
        <p role="note" className="flex max-w-prose items-start gap-2 text-[0.9375rem] text-tinta">
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" />
          <span>
            {t("Son beneficios")} <strong className="font-semibold">{t("ficticios")}</strong>
            {t(": no hay comercios, patrocinios ni descuentos municipales, fiscales o comerciales. Canjear sólo genera un código DEMO-B sin validez.")}
          </span>
        </p>
      </div>
      {contenido}
    </section>
  );

  if (beneficios.isPending) return envolver(<LoadingState etiqueta={t("Cargando beneficios de ejemplo…")} variante="tarjetas" />);
  if (beneficios.isError) {
    return envolver(
      <ErrorState error={beneficios.error} nivel={3} titulo={t("No pudimos cargar los beneficios")} onReintentar={() => void beneficios.refetch()} />,
    );
  }
  if (beneficios.data.length === 0) {
    return envolver(
      <EmptyState
        nivel={3}
        icono={Gift}
        titulo={t("No hay beneficios de ejemplo")}
        descripcion={t("La demostración no tiene beneficios configurados.")}
      />,
    );
  }

  const errorCanje = canjear.error ? describirError(canjear.error) : null;
  const saldoDespues = seleccionado && disponible !== undefined ? disponible - seleccionado.costoPuntos : null;

  return envolver(
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Beneficios de ejemplo">
        {beneficios.data.map((beneficio) => (
          <li key={beneficio.id} className="min-w-0">
            <BeneficioCard beneficio={beneficio} disponible={disponible} bloqueado={sinConexion} onCanjear={abrir} />
          </li>
        ))}
      </ul>

      <ConfirmDialog
        abierto={seleccionado !== null}
        onCerrar={cerrarConfirmacion}
        onConfirmar={() => void confirmar()}
        titulo={t("¿Canjear este beneficio de ejemplo?")}
        descripcion={t("Es un canje simulado: genera un código DEMO-B sin validez. No hay comercio, patrocinio ni descuento real.")}
        textoConfirmar={t("Confirmar canje simulado")}
        cargando={canjear.isPending}
      >
        {seleccionado ? (
          <div className="flex flex-col gap-4">
            <KeyValueList
              disposicion="apilada"
              items={[
                { id: "beneficio", clave: t("Beneficio"), valor: t(seleccionado.nombre) },
                { id: "costo", clave: t("Costo"), valor: puntosEnTexto(seleccionado.costoPuntos) },
                ...(disponible !== undefined ? [{ id: "saldo", clave: t("Saldo disponible"), valor: puntosEnTexto(disponible) }] : []),
                ...(saldoDespues !== null && saldoDespues >= 0 ? [{ id: "despues", clave: t("Saldo después del canje"), valor: puntosEnTexto(saldoDespues) }] : []),
              ]}
            />
            {errorCanje ? (
              <p role="alert" className="flex items-start gap-2 rounded-control border border-peligro/25 bg-peligro-suave px-3 py-2.5 text-sm text-tinta">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-peligro" />
                <span>
                  <strong className="font-semibold text-peligro">{errorCanje.titulo}. </strong>
                  {errorCanje.descripcion} {t("No se descontó ningún punto.")}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}
      </ConfirmDialog>

      <Dialog
        abierto={canje !== null}
        onCerrar={cerrarResultado}
        titulo={t("Canje simulado registrado")}
        descripcion={t("Guarda el código sólo como referencia de la demostración: no tiene validez en ningún lugar.")}
        tamano="sm"
        acciones={<Button onClick={cerrarResultado}>{t("Entendido")}</Button>}
      >
        {canje ? (
          <div className="flex flex-col gap-3">
            <p className="text-[0.9375rem] text-tinta">{t(canje.beneficioNombre)}</p>
            <div className="flex flex-col items-start gap-2 rounded-control border border-dashed border-marino/40 bg-marino-suave px-4 py-3">
              <span className="text-sm font-semibold text-tinta-suave">{t("Código de ejemplo")}</span>
              <span className="flex items-center gap-2 font-mono text-xl font-semibold tracking-wide text-marino" data-codigo-canje>
                <TicketCheck aria-hidden="true" className="size-5 shrink-0" />
                {canje.codigo}
              </span>
              <DemoTag>{t("Sin validez")}</DemoTag>
            </div>
            <p className="text-sm text-tinta-suave">
              {t("Se descontaron {{puntos}} de tu saldo aprobado", { puntos: puntosEnTexto(canje.puntos) })}
              {disponible !== undefined ? t("; ahora tienes {{puntos}} disponibles", { puntos: puntosEnTexto(disponible) }) : ""}
              {t(".")}
            </p>
          </div>
        ) : null}
      </Dialog>
    </>,
  );
}
