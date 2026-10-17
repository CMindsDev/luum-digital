import type { ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

export interface ConfirmDialogProps {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
  titulo: string;
  descripcion?: ReactNode;
  children?: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** peligro para acciones destructivas (p. ej. restablecer la demostración). */
  tono?: "primario" | "peligro";
  /** Deshabilita el botón y muestra aria-busy mientras se procesa. */
  cargando?: boolean;
}

/** Confirmación explícita antes de una acción importante. */
export function ConfirmDialog({
  abierto,
  onCerrar,
  onConfirmar,
  titulo,
  descripcion,
  children,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  tono = "primario",
  cargando = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={titulo}
      descripcion={descripcion}
      tamano="sm"
      acciones={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={cargando}>
            {textoCancelar}
          </Button>
          <Button variante={tono} onClick={onConfirmar} cargando={cargando}>
            {textoConfirmar}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
