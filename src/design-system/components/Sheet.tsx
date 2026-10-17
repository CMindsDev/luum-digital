import { X } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { useModalDialog } from "../lib/use-modal-dialog";
import { IconButton } from "./IconButton";

export interface SheetProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: ReactNode;
  children?: ReactNode;
  /** Pie fijo (p. ej. botones). */
  pie?: ReactNode;
  /** En tableta y escritorio el panel aparece de este lado. */
  lado?: "derecha" | "izquierda";
  /** En móvil también se muestra como panel lateral en vez de hoja inferior. */
  siemprePanel?: boolean;
  className?: string;
}

/**
 * Hoja inferior en móvil y panel lateral en tableta/escritorio. Mismo comportamiento de foco que
 * Dialog (dialog nativo con showModal, Escape, foco atrapado y devuelto).
 */
export function Sheet({ abierto, onCerrar, titulo, descripcion, children, pie, lado = "derecha", siemprePanel = false, className }: SheetProps) {
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const idTitulo = useId();
  const idDescripcion = useId();
  const { dialogoRef, manejarTeclado, manejarClic } = useModalDialog({ abierto, onCerrar, enfocarAlAbrir: tituloRef });

  const panel = lado === "derecha" ? "md:mr-0 md:ml-auto" : "md:mr-auto md:ml-0";
  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby={idTitulo}
      aria-describedby={descripcion ? idDescripcion : undefined}
      onKeyDown={manejarTeclado}
      onClick={manejarClic}
      className={cx(
        "max-h-none max-w-none overflow-visible bg-transparent p-0 text-tinta backdrop:bg-marino/45",
        siemprePanel
          ? cx("my-0 h-dvh w-[min(26rem,calc(100%-2.5rem))]", lado === "derecha" ? "mr-0 ml-auto" : "mr-auto ml-0")
          : cx("mx-0 mt-auto mb-0 w-full md:my-0 md:h-dvh md:w-[26rem]", panel),
        className,
      )}
    >
      {abierto ? (
        <div
          className={cx(
            "flex flex-col overflow-hidden bg-superficie shadow-flotante",
            siemprePanel
              ? "h-dvh motion-safe:animate-entrada-lado"
              : "max-h-[88dvh] rounded-t-tarjeta pb-[env(safe-area-inset-bottom)] motion-safe:animate-entrada-abajo md:h-dvh md:max-h-none md:rounded-none md:pb-0 md:motion-safe:animate-entrada-lado",
          )}
        >
          {siemprePanel ? null : <div aria-hidden="true" className="mx-auto mt-2.5 h-1.5 w-11 rounded-pildora bg-borde md:hidden" />}
          <div className="flex items-start gap-3 px-5 pt-4 pb-2">
            <div className="min-w-0 flex-1">
              <h2 ref={tituloRef} id={idTitulo} tabIndex={-1} className="text-lg font-semibold text-marino">
                {titulo}
              </h2>
              {descripcion ? (
                <div id={idDescripcion} className="mt-1 text-sm text-tinta-suave">
                  {descripcion}
                </div>
              ) : null}
            </div>
            <IconButton etiqueta="Cerrar" icono={X} onClick={onCerrar} className="-mt-1 -mr-2" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-5">{children}</div>
          {pie ? <div className="border-t border-borde px-5 py-4">{pie}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}
