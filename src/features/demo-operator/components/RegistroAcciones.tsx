import { History } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Card, formatearFechaHora } from "@/design-system";
import type { AccionRegistrada } from "../lib/registro";

/**
 * Registro de lo que hiciste en esta visita (sólo en memoria). Los cambios sí quedan en los datos de
 * la demostración y se ven en reportes, notificaciones y puntos de cada persona.
 */
export function RegistroAcciones({ acciones }: { acciones: readonly AccionRegistrada[] }) {
  const { t } = useTranslation();

  return (
    <Card as="section" aria-labelledby="titulo-registro" relleno="lg" data-guia="operador.registro">
      <h2 id="titulo-registro" className="text-xl font-semibold text-marino">
        {t("Registro de esta visita")}
      </h2>
      <p className="mt-1 max-w-prose text-sm text-tinta-suave">
        {t("Lo que hiciste desde que abriste esta pantalla. Los cambios quedan en los datos de la demostración y las personas afectadas reciben una notificación simulada.")}
      </p>
      {acciones.length === 0 ? (
        <p className="mt-4 flex items-start gap-2 text-[0.9375rem] text-tinta-suave">
          <History aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {t("Aún no hiciste ninguna acción.")}
        </p>
      ) : (
        <ol className="mt-4 flex flex-col gap-3" aria-label={t("Acciones realizadas, de la más reciente a la más antigua")}>
          {acciones.map((accion) => (
            <li key={accion.id} className="rounded-control border border-borde bg-superficie-2 px-3 py-2.5 text-sm text-tinta" data-accion-registrada>
              <p>{accion.texto}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-tinta-suave">
                <time dateTime={accion.fecha}>{formatearFechaHora(accion.fecha)}</time>
                {accion.enlace ? (
                  <Link to={accion.enlace.to} className="font-semibold text-enlace underline underline-offset-2">
                    {accion.enlace.etiqueta}
                  </Link>
                ) : null}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
