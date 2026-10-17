import type { ReactNode } from "react";
import { cx } from "../lib/cx";

export interface ParClaveValor {
  id?: string;
  clave: ReactNode;
  valor: ReactNode;
}

export interface KeyValueListProps {
  items: ParClaveValor[];
  /** columnas: clave y valor lado a lado desde sm; apilada: siempre una debajo de otra. */
  disposicion?: "columnas" | "apilada";
  className?: string;
}

/** Lista de descripción (dl) para datos de una ficha, gestión o reporte. */
export function KeyValueList({ items, disposicion = "columnas", className }: KeyValueListProps) {
  return (
    <dl className={cx("divide-y divide-borde", className)}>
      {items.map((item, indice) => (
        <div
          key={item.id ?? indice}
          className={cx("py-3 first:pt-0 last:pb-0", disposicion === "columnas" && "sm:grid sm:grid-cols-[minmax(8rem,14rem)_1fr] sm:gap-4")}
        >
          <dt className="text-sm font-semibold text-tinta-suave">{item.clave}</dt>
          <dd className="mt-0.5 break-words text-tinta sm:mt-0">{item.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
