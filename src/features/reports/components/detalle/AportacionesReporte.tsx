import { Camera, MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { estaAbierto } from "@/domain/reportes";
import { Button, Card, formatearFechaHora } from "@/design-system";
import type { Reporte } from "@/types";
import { AportacionForm } from "../AportacionForm";

/** Aportaciones de otras personas al mismo incidente y formulario para sumar información. */
export function AportacionesReporte({ reporte, identidadId }: { reporte: Reporte; identidadId: string }) {
  const { t } = useTranslation();
  const [aportando, setAportando] = useState(false);
  const [gracias, setGracias] = useState(false);
  const abierto = estaAbierto(reporte);

  return (
    <Card as="section" aria-labelledby="aportaciones" className="flex flex-col gap-3">
      <h2 id="aportaciones" className="text-lg font-semibold text-marino">
        {t("Aportaciones")}
      </h2>
      {reporte.aportaciones.length === 0 ? (
        <p className="text-[0.9375rem] text-tinta-suave">{t("Nadie ha aportado información adicional a este reporte.")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reporte.aportaciones.map((aportacion) => (
            <li key={aportacion.id} className="rounded-control border border-borde bg-superficie-2 p-3">
              <p className="text-sm text-tinta-suave">
                {aportacion.identidadId === identidadId ? t("Tú") : t("Otra persona (ficticia)")} ·{" "}
                <time dateTime={aportacion.fecha}>{formatearFechaHora(aportacion.fecha)}</time>
              </p>
              <p className="mt-1 break-words text-[0.9375rem] text-tinta">{aportacion.descripcion}</p>
              {aportacion.tieneFoto ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-tinta-suave">
                  <Camera aria-hidden="true" className="size-4" />
                  {t("Con foto (no se guarda)")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {gracias ? (
        <p role="status" className="rounded-control border border-exito/25 bg-exito-suave px-3 py-2.5 text-[0.9375rem] text-tinta">
          {t("Gracias: tu información se sumó a este reporte. No se creó un reporte nuevo ni se generan puntos.")}
        </p>
      ) : null}
      {abierto && aportando ? (
        <AportacionForm
          reporte={reporte}
          mostrarCasillaFoto
          onAportado={() => {
            setAportando(false);
            setGracias(true);
          }}
          onCancelar={() => setAportando(false)}
        />
      ) : null}
      {abierto && !aportando ? (
        <Button
          variante="secundario"
          iconoInicio={MessageSquarePlus}
          onClick={() => {
            setGracias(false);
            setAportando(true);
          }}
          className="self-start"
          data-guia="reportes.aportar"
        >
          {t("¿Viste lo mismo? Aportar información")}
        </Button>
      ) : null}
      {!abierto ? <p className="text-sm text-tinta-suave">{t("Este reporte ya no está abierto: no admite aportaciones.")}</p> : null}
    </Card>
  );
}
