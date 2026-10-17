import { CircleAlert, PlugZap, RotateCcw, WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cx } from "../lib/cx";
import { describirError } from "../lib/errores";
import { Button } from "./Button";

export interface ErrorStateProps {
  /** Error recibido (de TanStack Query o de un límite de error). Se traduce con describirError. */
  error?: unknown;
  titulo?: string;
  descripcion?: ReactNode;
  /** Si se da y el error es reintentable, muestra «Reintentar». */
  onReintentar?: () => void;
  /** Acción adicional (p. ej. volver al inicio). */
  accion?: ReactNode;
  nivel?: 2 | 3;
  className?: string;
}

/**
 * Estado de error explícito. Para IntegracionNoDisponibleError dice que la acción no se realizó
 * (nunca un éxito ficticio); para SinConexionError explica que los datos se conservan.
 */
export function ErrorState({ error, titulo, descripcion, onReintentar, accion, nivel = 2, className }: ErrorStateProps) {
  const { t } = useTranslation();
  const descrito = describirError(error);
  const Icono = descrito.tipo === "sin_conexion" ? WifiOff : descrito.tipo === "integracion" ? PlugZap : CircleAlert;
  const Titulo = nivel === 2 ? "h2" : "h3";
  return (
    <div role="alert" className={cx("rounded-tarjeta border border-peligro/25 bg-peligro-suave px-5 py-6", className)}>
      <div className="flex items-start gap-3">
        <Icono aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-peligro" />
        <div className="min-w-0">
          <Titulo className="text-base font-semibold text-peligro">{titulo ?? descrito.titulo}</Titulo>
          <div className="mt-1 text-[0.9375rem] text-tinta">{descripcion ?? descrito.descripcion}</div>
          {(onReintentar && descrito.reintentable) || accion ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {onReintentar && descrito.reintentable ? (
                <Button variante="secundario" tamano="sm" iconoInicio={RotateCcw} onClick={onReintentar}>
                  {t("Reintentar")}
                </Button>
              ) : null}
              {accion}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
