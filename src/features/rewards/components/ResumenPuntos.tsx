import { useId, type ReactNode } from "react";
import { ErrorState, Skeleton, cx } from "@/design-system";
import { useBalance } from "@/services/hooks";
import { formatearPuntos } from "../lib/movimientos";

export interface ResumenPuntosProps {
  /** Título visible de la sección. */
  titulo?: string;
  /** Nivel del encabezado (h2 por omisión). */
  nivel?: 2 | 3;
  /** Enlaces o botones bajo el resumen (p. ej. «Ver recompensas»). */
  acciones?: ReactNode;
  className?: string;
}

/**
 * Resumen de puntos de demostración de la identidad activa: disponibles (aprobados), pendientes de
 * validación y canjeados, por separado. Sólo los aprobados se pueden canjear.
 */
export function ResumenPuntos({ titulo = "Tus puntos de demostración", nivel = 2, acciones, className }: ResumenPuntosProps) {
  const saldo = useBalance();
  const idTitulo = `resumen-puntos-${useId().replace(/:/g, "")}`;
  const Titulo = nivel === 2 ? "h2" : "h3";

  return (
    <section aria-labelledby={idTitulo} className={cx("flex flex-col gap-3", className)} data-guia="recompensas.saldo">
      <Titulo id={idTitulo} className="text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase">
        {titulo}
      </Titulo>

      {saldo.isPending ? (
        <div role="status" aria-label="Cargando tus puntos…" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton forma="bloque" />
          <Skeleton forma="bloque" />
          <Skeleton forma="bloque" />
        </div>
      ) : saldo.isError ? (
        <ErrorState error={saldo.error} nivel={nivel === 2 ? 3 : 2} titulo="No pudimos cargar tus puntos" onReintentar={() => void saldo.refetch()} />
      ) : (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* blanco sobre marino 12.06:1 · lima del logotipo sobre marino 8.73:1 */}
          <div className="superficie-oscura flex flex-col gap-1 rounded-tarjeta bg-marino p-4 text-white shadow-suave sm:p-5">
            <dt className="text-sm font-semibold">Disponibles</dt>
            <dd>
              <span className="text-4xl leading-none font-semibold text-lima-logo" data-saldo="disponible">
                {formatearPuntos(saldo.data.disponible)}
              </span>{" "}
              <span className="text-base font-medium">puntos</span>
            </dd>
            <dd className="text-sm">Aprobados: puedes canjearlos por beneficios de ejemplo.</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-tarjeta border border-borde bg-superficie p-4 shadow-suave sm:p-5">
            <dt className="text-sm font-semibold text-tinta-suave">Pendientes</dt>
            <dd>
              <span className="text-4xl leading-none font-semibold text-marino" data-saldo="pendientes">
                {formatearPuntos(saldo.data.pendientes)}
              </span>{" "}
              <span className="text-base font-medium text-tinta">puntos</span>
            </dd>
            <dd className="text-sm text-tinta-suave">Se suman sólo cuando el operador de demostración valida. No se pueden canjear.</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-tarjeta border border-borde bg-superficie p-4 shadow-suave sm:p-5">
            <dt className="text-sm font-semibold text-tinta-suave">Canjeados</dt>
            <dd>
              <span className="text-4xl leading-none font-semibold text-marino" data-saldo="canjeados">
                {formatearPuntos(saldo.data.totalCanjeado)}
              </span>{" "}
              <span className="text-base font-medium text-tinta">puntos</span>
            </dd>
            <dd className="text-sm text-tinta-suave">En beneficios de ejemplo, sin valor real.</dd>
          </div>
        </dl>
      )}

      {acciones ? <div className="flex flex-wrap gap-3">{acciones}</div> : null}
    </section>
  );
}
