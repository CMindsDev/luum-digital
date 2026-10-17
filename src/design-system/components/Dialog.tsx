import { X } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { useModalDialog } from "../lib/use-modal-dialog";
import { IconButton } from "./IconButton";

export interface DialogProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: ReactNode;
  children?: ReactNode;
  /** Botones del pie (alineados a la derecha en escritorio, apilados en móvil). */
  acciones?: ReactNode;
  tamano?: "sm" | "md" | "lg";
  /** Cerrar al tocar el fondo oscurecido (por omisión sí). */
  cerrarAlTocarFondo?: boolean;
  /** Oculta el botón ✕ (p. ej. cuando hay que elegir explícitamente). */
  sinBotonCerrar?: boolean;
  className?: string;
}

const ANCHOS = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl" } as const;

/**
 * Diálogo modal sobre <dialog> nativo con showModal(): foco al título al abrir, foco atrapado,
 * Escape cierra y el foco vuelve al elemento que lo abrió.
 */
export function Dialog({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  children,
  acciones,
  tamano = "md",
  cerrarAlTocarFondo = true,
  sinBotonCerrar = false,
  className,
}: DialogProps) {
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const idTitulo = useId();
  const idDescripcion = useId();
  const { dialogoRef, manejarTeclado, manejarClic } = useModalDialog({
    abierto,
    onCerrar,
    enfocarAlAbrir: tituloRef,
    cerrarAlTocarFondo,
  });

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby={idTitulo}
      aria-describedby={descripcion ? idDescripcion : undefined}
      onKeyDown={manejarTeclado}
      onClick={manejarClic}
      className={cx(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] overflow-visible rounded-tarjeta bg-transparent p-0 text-tinta backdrop:bg-marino/45",
        ANCHOS[tamano],
        className,
      )}
    >
      {abierto ? (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-tarjeta bg-superficie shadow-flotante motion-safe:animate-entrada">
          <div className="flex items-start gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
            <div className="min-w-0 flex-1">
              <h2 ref={tituloRef} id={idTitulo} tabIndex={-1} className="text-xl font-semibold text-marino">
                {titulo}
              </h2>
              {descripcion ? (
                <div id={idDescripcion} className="mt-1.5 text-[0.9375rem] text-tinta-suave">
                  {descripcion}
                </div>
              ) : null}
            </div>
            {sinBotonCerrar ? null : <IconButton etiqueta="Cerrar" icono={X} onClick={onCerrar} className="-mt-1.5 -mr-2" />}
          </div>
          {children ? <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-1 sm:px-6">{children}</div> : null}
          {acciones ? (
            <div className="flex flex-col-reverse gap-2 px-5 pt-4 pb-5 sm:flex-row sm:justify-end sm:px-6 sm:pb-6">{acciones}</div>
          ) : (
            <div className="pb-5 sm:pb-6" />
          )}
        </div>
      ) : null}
    </dialog>
  );
}
