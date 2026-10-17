import { FlaskConical } from "lucide-react";
import { Badge } from "./Badge";

export interface DemoTagProps {
  /** Texto de la etiqueta. Por omisión «Demostración». */
  children?: string;
  className?: string;
}

/** Marca contenido ficticio o simulado («Demostración», «Pago simulado», «Ejemplo»…). */
export function DemoTag({ children = "Demostración", className }: DemoTagProps) {
  return (
    <Badge tono="ambar" icono={FlaskConical} className={className}>
      {children}
    </Badge>
  );
}
