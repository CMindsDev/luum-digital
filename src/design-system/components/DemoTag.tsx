import { FlaskConical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "./Badge";

export interface DemoTagProps {
  /** Texto de la etiqueta. Por omisión «Demostración». */
  children?: string;
  className?: string;
}

/** Marca contenido ficticio o simulado («Demostración», «Pago simulado», «Ejemplo»…). */
export function DemoTag({ children, className }: DemoTagProps) {
  const { t } = useTranslation();
  return (
    <Badge tono="ambar" icono={FlaskConical} className={className}>
      {children ?? t("Demostración")}
    </Badge>
  );
}
