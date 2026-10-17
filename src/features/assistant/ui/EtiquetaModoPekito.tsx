import { Loader, MessageSquareText, Radio } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cx } from "@/design-system";
import type { EtiquetaModo } from "./etiqueta-modo";

export interface EtiquetaModoPekitoProps {
  etiqueta: EtiquetaModo;
  /** Sobre el tema noche del asistente. */
  oscuro?: boolean;
  className?: string;
}

const ICONOS = { demo: MessageSquareText, real: Radio, pendiente: Loader } as const;

/** Etiqueta breve de estado; se oculta cuando no aporta contexto útil. */
export function EtiquetaModoPekito({ etiqueta, oscuro = false, className }: EtiquetaModoPekitoProps) {
  const { t } = useTranslation();
  if (!etiqueta.texto.trim()) return null;
  const Icono = ICONOS[etiqueta.tono];
  return (
    <p
      data-guia="asistente.modo"
      data-modo={etiqueta.tono}
      className={cx(
        "inline-flex max-w-full items-center gap-1.5 rounded-pildora px-2.5 py-1 text-xs leading-tight font-semibold",
        oscuro
          ? "bg-(--pk-chip) text-(--pk-texto)"
          : etiqueta.tono === "real"
            ? "bg-azul-suave text-enlace"
            : "bg-ambar-suave text-cafe",
        className,
      )}
    >
      <Icono aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="sr-only">{t("Estado de Pekito: ")}</span>
      <span className="min-w-0">{t(etiqueta.texto)}</span>
    </p>
  );
}
