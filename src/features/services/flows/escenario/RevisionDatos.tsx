import { BookUser } from "lucide-react";
import type { CampoEscenario, OpcionCampo } from "@/components/catalogo/datos-demo";
import { Badge, KeyValueList } from "@/design-system";
import { valorParaMostrar } from "./valores";

export interface RevisionDatosProps {
  campos: readonly CampoEscenario[];
  valores: Record<string, unknown>;
  /** Nombres de campos copiados del expediente (con confirmación). */
  reutilizados: readonly string[];
  /** Opciones calculadas por campo (sedes, horarios). */
  opciones?: Readonly<Record<string, readonly OpcionCampo[]>>;
}

/** Revisión antes de enviar: cada dato capturado, con su origen si vino del expediente. */
export function RevisionDatos({ campos, valores, reutilizados, opciones }: RevisionDatosProps) {
  return (
    <KeyValueList
      items={campos.map((campo) => ({
        id: campo.nombre,
        clave: campo.etiqueta,
        valor: (
          <span className="flex flex-wrap items-center gap-2">
            <span>{valorParaMostrar(campo, valores[campo.nombre], opciones?.[campo.nombre])}</span>
            {reutilizados.includes(campo.nombre) ? (
              <Badge tono="exito" icono={BookUser}>
                De tu expediente
              </Badge>
            ) : null}
          </span>
        ),
      }))}
    />
  );
}
