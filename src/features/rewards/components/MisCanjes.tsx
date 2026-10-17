import { Ticket } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, DemoTag, ErrorState, LoadingState, formatearFechaHora } from "@/design-system";
import { useRedemptions } from "@/services/hooks";
import { puntosEnTexto } from "../lib/movimientos";

/** Canjes simulados de la identidad activa con su código DEMO-B-… (sin validez). */
export function MisCanjes() {
  const { t } = useTranslation();
  const canjes = useRedemptions();

  return (
    <Card as="section" aria-labelledby="titulo-canjes" relleno="lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-canjes" className="text-xl font-semibold text-marino">
          {t("Mis canjes de ejemplo")}
        </h2>
        <DemoTag>{t("Sin validez")}</DemoTag>
      </div>
      <div className="mt-4">
        {canjes.isPending ? (
          <LoadingState etiqueta={t("Cargando tus canjes…")} variante="compacto" />
        ) : canjes.isError ? (
          <ErrorState error={canjes.error} nivel={3} titulo={t("No pudimos cargar tus canjes")} onReintentar={() => void canjes.refetch()} />
        ) : canjes.data.length === 0 ? (
          <p className="text-[0.9375rem] text-tinta-suave">{t("Aún no canjeas beneficios de ejemplo.")}</p>
        ) : (
          <ul className="divide-y divide-borde" aria-label={t("Canjes de ejemplo")}>
            {canjes.data.map((canje) => (
              <li key={canje.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <Ticket aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono font-semibold tracking-wide text-marino">{canje.codigo}</p>
                  <p className="break-words text-tinta">{t(canje.beneficioNombre)}</p>
                  <p className="text-sm text-tinta-suave">
                    {puntosEnTexto(canje.puntos)} · <time dateTime={canje.fecha}>{formatearFechaHora(canje.fecha)}</time>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
