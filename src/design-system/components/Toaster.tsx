import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cx } from "../lib/cx";
import { useAvisos, type AvisoEmergente, type TonoAviso } from "../lib/toast-store";

const ICONOS: Record<TonoAviso, LucideIcon> = { info: Info, exito: CircleCheck, aviso: TriangleAlert, error: CircleAlert };
const COLOR_ICONO: Record<TonoAviso, string> = { info: "text-info", exito: "text-exito", aviso: "text-aviso", error: "text-peligro" };
const BORDE: Record<TonoAviso, string> = {
  info: "border-l-azul",
  exito: "border-l-exito",
  aviso: "border-l-ambar",
  error: "border-l-peligro",
};

function Aviso({ aviso }: { aviso: AvisoEmergente }) {
  const { t } = useTranslation();
  const descartar = useAvisos((estado) => estado.descartar);
  const Icono = ICONOS[aviso.tono];

  useEffect(() => {
    if (aviso.duracionMs === null) return;
    const temporizador = window.setTimeout(() => descartar(aviso.id), aviso.duracionMs);
    return () => window.clearTimeout(temporizador);
  }, [aviso.id, aviso.duracionMs, descartar]);

  return (
    <li
      className={cx(
        "pointer-events-auto flex items-start gap-3 rounded-tarjeta border border-l-4 border-borde bg-superficie p-4 shadow-elevada motion-safe:animate-entrada",
        BORDE[aviso.tono],
      )}
    >
      <Icono aria-hidden="true" className={cx("mt-0.5 size-5 shrink-0", COLOR_ICONO[aviso.tono])} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-tinta">{aviso.titulo}</p>
        {aviso.descripcion ? <p className="mt-0.5 text-sm text-tinta-suave">{aviso.descripcion}</p> : null}
        {aviso.accion ? (
          <button
            type="button"
            onClick={() => {
              aviso.accion?.alActivar();
              descartar(aviso.id);
            }}
            className="mt-2 inline-flex min-h-11 items-center rounded-boton px-1 font-semibold text-enlace underline underline-offset-2"
          >
            {aviso.accion.etiqueta}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => descartar(aviso.id)}
        aria-label={t("Cerrar aviso")}
        title={t("Cerrar aviso")}
        className="-mt-2 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-boton text-tinta-suave hover:bg-superficie-2"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </li>
  );
}

/**
 * Región de avisos emergentes (aria-live). Se ubica sobre la barra inferior y el asistente para
 * no tapar contenido. Usa `notificar()` de design-system para mostrar un aviso.
 */
export function Toaster() {
  const { t } = useTranslation();
  const avisos = useAvisos((estado) => estado.avisos);
  return (
    <section
      aria-label={t("Avisos")}
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 md:right-6 md:left-auto md:w-[24rem] md:px-0"
      style={{ bottom: "calc(var(--altura-nav-inferior) + var(--espacio-asistente) + 1rem)" }}
    >
      <ol aria-live="polite" aria-relevant="additions" className="flex w-full max-w-md flex-col gap-2">
        {avisos.map((aviso) => (
          <Aviso key={aviso.id} aviso={aviso} />
        ))}
      </ol>
    </section>
  );
}
