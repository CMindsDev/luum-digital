import { BellOff, CheckCheck, Inbox } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMarkAllRead, useMarkRead, useNotifications, usePrivacy } from "@/services/hooks";
import { Button, EmptyState, ErrorState, LoadingState, PageHeader, SegmentedControl, notificar } from "@/design-system";
import { ItemNotificacion } from "../components/ItemNotificacion";

type Vista = "todas" | "sin_leer";

/** /notificaciones — avisos de gestiones, reportes, verificaciones y puntos (simulados). */
export default function NotificationsPage() {
  const { t } = useTranslation();
  const { data, isPending, isError, error, refetch } = useNotifications();
  const privacidad = usePrivacy();
  const marcar = useMarkRead();
  const marcarTodas = useMarkAllRead();
  const [vista, setVista] = useState<Vista>("todas");

  const sinLeer = data?.filter((notificacion) => !notificacion.leida).length ?? 0;
  const visibles = (data ?? []).filter((notificacion) => vista === "todas" || !notificacion.leida);
  const todasDiscretas = privacidad.data?.notificacionesDiscretas === true;

  const marcarTodasLeidas = async () => {
    try {
      await marcarTodas.mutateAsync();
      notificar({ tono: "exito", titulo: t("Todas tus notificaciones están leídas") });
    } catch (fallo) {
      notificar({ tono: "error", titulo: t("No se pudieron marcar como leídas"), descripcion: fallo instanceof Error ? fallo.message : undefined });
    }
  };

  return (
    <>
      <PageHeader
        titulo={t("Notificaciones")}
        descripcion={t("Avisos de tus gestiones, reportes, verificaciones y puntos de demostración.")}
        accion={
          sinLeer > 0 ? (
            <Button
              variante="secundario"
              tamano="sm"
              iconoInicio={CheckCheck}
              onClick={() => void marcarTodasLeidas()}
              cargando={marcarTodas.isPending}
              textoCargando={t("Marcando…")}
              data-guia="notificaciones.marcar_todas"
            >
              <span className="hidden sm:inline">{t("Marcar todas como leídas")}</span>
              <span className="sm:hidden">{t("Marcar todas")}</span>
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl<Vista>
            etiqueta={t("Mostrar notificaciones")}
            valor={vista}
            onCambiar={setVista}
            guia="notificaciones.filtro"
            opciones={[
              { valor: "todas", etiqueta: t("Todas") },
              { valor: "sin_leer", etiqueta: t("Sin leer ({{sinLeer}})", { sinLeer }) },
            ]}
          />
          <p aria-live="polite" className="text-sm text-tinta-suave">
            {data ? (sinLeer === 0 ? t("No tienes avisos sin leer.") : sinLeer === 1 ? t("1 aviso sin leer.") : t("{{sinLeer}} avisos sin leer.", { sinLeer })) : ""}
          </p>
        </div>

        {isPending ? (
          <LoadingState etiqueta={t("Cargando notificaciones…")} />
        ) : isError ? (
          <ErrorState error={error} onReintentar={() => void refetch()} />
        ) : visibles.length === 0 ? (
          <EmptyState
            icono={vista === "sin_leer" ? Inbox : BellOff}
            titulo={vista === "sin_leer" ? t("No tienes notificaciones sin leer") : t("No tienes notificaciones")}
            descripcion={
              vista === "sin_leer"
                ? t("Cuando haya novedades de tus gestiones o reportes, aparecerán aquí.")
                : t("Cuando envíes una gestión o un reporte de demostración, te avisaremos aquí.")
            }
            accion={
              vista === "sin_leer" && (data?.length ?? 0) > 0 ? (
                <Button variante="secundario" onClick={() => setVista("todas")}>
                  {t("Ver todas")}
                </Button>
              ) : null
            }
          />
        ) : (
          <ul aria-label={t("Notificaciones")} className="flex flex-col gap-3">
            {visibles.map((notificacion) => (
              <li key={notificacion.id}>
                <ItemNotificacion
                  notificacion={notificacion}
                  discreta={notificacion.sensible || todasDiscretas}
                  marcando={marcar.isPending && marcar.variables === notificacion.id}
                  onMarcarLeida={(id) => marcar.mutate(id)}
                  onAbrir={(abierta) => {
                    if (!abierta.leida) marcar.mutate(abierta.id);
                  }}
                />
              </li>
            ))}
          </ul>
        )}

        <p className="text-sm text-tinta-suave">
          {t("Bienestar, salud mental y Línea Mujer nunca generan notificaciones. Las notificaciones son simuladas y se guardan sólo en este navegador.")}
        </p>
      </div>
    </>
  );
}
