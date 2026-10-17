import { BookUser } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CampoEscenario, OpcionCampo } from "@/components/catalogo/datos-demo";
import { Badge, KeyValueList } from "@/design-system";
import { valorParaMostrar } from "./valores";

export interface RevisionDatosProps {
  campos: readonly CampoEscenario[];
  valores: Record<string, unknown>;
  reutilizados: readonly string[];
  opciones?: Readonly<Record<string, readonly OpcionCampo[]>>;
}

export function RevisionDatos({ campos, valores, reutilizados, opciones }: RevisionDatosProps) {
  const { t } = useTranslation();
  return (
    <KeyValueList
      items={campos.map((campo) => ({
        id: campo.nombre,
        clave: t(campo.etiqueta),
        valor: (
          <span className="flex flex-wrap items-center gap-2">
            <span>{valorParaMostrar(campo, valores[campo.nombre], opciones?.[campo.nombre])}</span>
            {reutilizados.includes(campo.nombre) ? (
              <Badge tono="exito" icono={BookUser}>
                {t("De tu expediente")}
              </Badge>
            ) : null}
          </span>
        ),
      }))}
    />
  );
}
