import { History } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge, Card, EmptyState, ErrorState, LoadingState, cx, formatearFechaHora } from "@/design-system";
import { useMovements } from "@/services/hooks";
import { ETIQUETA_TIPO_MOVIMIENTO, describirEstadoMovimiento, formatearPuntosConSigno } from "../lib/movimientos";

/**
 * Historial de movimientos de la identidad activa, del más reciente al más antiguo: cada uno con
 * motivo, tipo, estado (ícono + texto) y puntos. Sólo los «Aprobado» cuentan en el saldo.
 */
export function HistorialMovimientos() {
  const { t } = useTranslation();
  const movimientos = useMovements();

  return (
    <Card as="section" aria-labelledby="titulo-movimientos" relleno="lg" data-guia="recompensas.historial">
      <h2 id="titulo-movimientos" className="text-xl font-semibold text-marino">
        {t("Historial de movimientos")}
      </h2>
      <p className="mt-1 max-w-prose text-sm text-tinta-suave">
        {t("Cada movimiento tiene un motivo. Los créditos nacen pendientes y sólo cuentan al aprobarse; una reversión siempre explica por qué.")}
      </p>

      <div className="mt-4">
        {movimientos.isPending ? (
          <LoadingState etiqueta={t("Cargando tus movimientos…")} />
        ) : movimientos.isError ? (
          <ErrorState error={movimientos.error} nivel={3} titulo={t("No pudimos cargar tus movimientos")} onReintentar={() => void movimientos.refetch()} />
        ) : movimientos.data.length === 0 ? (
          <EmptyState
            nivel={3}
            icono={History}
            titulo={t("Aún no tienes movimientos")}
            descripcion={t("Cuando reportes o verifiques una reparación, verás aquí los puntos pendientes y aprobados.")}
          />
        ) : (
          <ul className="divide-y divide-borde" aria-label={t("Movimientos de puntos")}>
            {movimientos.data.map((movimiento) => {
              const estado = describirEstadoMovimiento(movimiento);
              const noCuenta = movimiento.estado !== "aprobado";
              return (
                <li key={movimiento.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0" data-movimiento={movimiento.tipo}>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold break-words text-tinta">{movimiento.motivo}</p>
                    <p className="mt-0.5 text-sm text-tinta-suave">
                      {t(ETIQUETA_TIPO_MOVIMIENTO[movimiento.tipo])} · <time dateTime={movimiento.fecha}>{formatearFechaHora(movimiento.fecha)}</time>
                    </p>
                    <Badge tono={estado.tono} icono={estado.icono} className="mt-1.5">
                      {t(estado.etiqueta)}
                    </Badge>
                  </div>
                  <p
                    className={cx(
                      "shrink-0 text-right font-mono text-lg font-semibold whitespace-nowrap",
                      movimiento.puntos < 0 ? "text-peligro" : noCuenta ? "text-tinta-suave" : "text-exito",
                      movimiento.estado === "cancelado" && "line-through",
                    )}
                  >
                    {formatearPuntosConSigno(movimiento.puntos)}
                    <span className="sr-only">
                      {t(" puntos")}
                      {noCuenta ? t(" (no cuentan en el saldo)") : ""}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
