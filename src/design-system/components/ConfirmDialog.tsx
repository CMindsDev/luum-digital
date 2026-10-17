import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
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
  textoConfirmar,
  textoCancelar,
  tono = "primario",
  cargando = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
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
            {textoCancelar ?? t("Cancelar")}
          </Button>
          <Button variante={tono} onClick={onConfirmar} cargando={cargando}>
            {textoConfirmar ?? t("Confirmar")}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
