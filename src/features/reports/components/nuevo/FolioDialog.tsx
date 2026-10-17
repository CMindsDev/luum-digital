import { Clock } from "lucide-react";
import { Button, ButtonLink, DemoTag, Dialog } from "@/design-system";
import type { Reporte } from "@/types";

export interface FolioDialogProps {
  reporte: Reporte | null;
  /** Puntos de la regla de demostración «reporte validado» (si ya se cargaron). */
  puntosPorValidar?: number;
  onAceptar: () => void;
}

/** Modal de confirmación como en Mérida Móvil: «Tu folio de reporte es:» + «Dale seguimiento en 'Mis reportes'». */
export function FolioDialog({ reporte, puntosPorValidar, onAceptar }: FolioDialogProps) {
  return (
    <Dialog
      abierto={reporte !== null}
      onCerrar={onAceptar}
      titulo="Tu folio de reporte es:"
      tamano="sm"
      cerrarAlTocarFondo={false}
      sinBotonCerrar
      acciones={
        reporte ? (
          <>
            <ButtonLink to={`/reportes/${encodeURIComponent(reporte.id)}`} variante="secundario">
              Ver mi reporte
            </ButtonLink>
            <Button variante="acento" onClick={onAceptar} data-guia="reportes.folio_aceptar">
              Aceptar
            </Button>
          </>
        ) : null
      }
    >
      {reporte ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="font-mono text-3xl font-semibold tracking-wide text-exito break-all" data-folio>
            {reporte.folio}
          </p>
          <DemoTag>Folio de demostración</DemoTag>
          <p className="text-[0.9375rem] text-tinta">Dale seguimiento en «Mis reportes».</p>
          <p className="flex items-start gap-2 rounded-control bg-superficie-2 px-3 py-2.5 text-left text-sm text-tinta">
            <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tinta-suave" />
            <span>
              {puntosPorValidar ? `Tus ${puntosPorValidar} puntos de demostración` : "Tus puntos de demostración"} quedan pendientes: sólo se suman
              cuando el operador de demostración valide el reporte.
            </span>
          </p>
          <p className="text-sm text-tinta-suave">Reporte simulado: no llegó al Ayuntamiento.</p>
        </div>
      ) : null}
    </Dialog>
  );
}
