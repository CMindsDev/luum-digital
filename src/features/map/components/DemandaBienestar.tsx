import { EyeOff } from "lucide-react";
import { DemoTag, ErrorState, Switch } from "@/design-system";
import { formatearCoordenadas } from "@/components/mapa/config";
import type { DemandaAgregada } from "@/types";
import { LEYENDA_BIENESTAR_RESPALDO } from "../catalogo-capas";
import { centroDeCelda } from "../incidencias";

export interface DemandaBienestarProps {
  datos: DemandaAgregada | undefined;
  cargando: boolean;
  error: unknown;
  onReintentar: () => void;
  activa: boolean;
  onActivar: (activa: boolean) => void;
}

/**
 * Demanda de bienestar AGREGADA (sólo operador/administración): celdas H3 gruesas con un mínimo de
 * registros ficticios. Nunca proviene de conversaciones ni identifica personas.
 */
export function DemandaBienestar({ datos, cargando, error, onReintentar, activa, onActivar }: DemandaBienestarProps) {
  const leyenda = datos?.leyenda ?? LEYENDA_BIENESTAR_RESPALDO;
  return (
    <div className="space-y-3">
      <Switch
        activado={activa}
        onCambiar={onActivar}
        etiqueta="Mostrar en el mapa"
        descripcion={leyenda}
        guia="mapa.capa_bienestar"
      />
      {cargando && !datos ? <p className="text-sm text-tinta-suave">Cargando la demanda agregada…</p> : null}
      {error && !datos ? <ErrorState error={error} onReintentar={onReintentar} nivel={3} /> : null}
      {datos ? (
        <>
          <p className="flex flex-wrap items-center gap-2 text-sm text-tinta">
            <DemoTag>Datos ficticios</DemoTag>
            <span>
              {datos.celdas.length} {datos.celdas.length === 1 ? "zona visible" : "zonas visibles"} con al menos {datos.umbralMinimo} registros.
            </span>
          </p>
          {datos.celdasOcultas > 0 ? (
            <p className="flex items-start gap-2 text-sm text-tinta-suave">
              <EyeOff aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {datos.celdasOcultas} {datos.celdasOcultas === 1 ? "zona se oculta" : "zonas se ocultan"} por tener menos de {datos.umbralMinimo}{" "}
              registros (protección contra la reidentificación).
            </p>
          ) : null}
          <details className="rounded-boton border border-borde bg-superficie px-3 py-2">
            <summary className="min-h-11 cursor-pointer py-2.5 text-sm font-semibold text-tinta">Ver las zonas agregadas</summary>
            <table className="mt-2 w-full text-left text-sm">
              <caption className="sr-only">Zonas de demanda de bienestar agregada (datos ficticios)</caption>
              <thead>
                <tr className="text-tinta-suave">
                  <th scope="col" className="py-1 pr-2 font-medium">
                    Centro aproximado
                  </th>
                  <th scope="col" className="py-1 text-right font-medium">
                    Registros
                  </th>
                </tr>
              </thead>
              <tbody>
                {datos.celdas.map((celda) => (
                  <tr key={celda.h3} className="border-t border-borde">
                    <td className="py-1.5 pr-2 font-mono text-xs">{formatearCoordenadas(centroDeCelda(celda.h3))}</td>
                    <td className="py-1.5 text-right font-semibold">{celda.conteo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      ) : null}
    </div>
  );
}
