import { BadgeCheck, Bell, ChevronRight, ClipboardList, EyeOff, Info, Megaphone, Trophy, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge, ButtonLink, Card, EmptyState, ErrorState, formatearFechaHora, LoadingState } from "@/design-system";
import { useNotifications, usePrivacy } from "@/services/hooks";
import type { Notificacion } from "@/types";
import { mostrarDetalleNotificacion } from "../lib/privacidad";
import { EncabezadoSeccion } from "./EncabezadoSeccion";

const MAXIMO = 3;

const ICONO_TIPO: Record<Notificacion["tipo"], LucideIcon> = {
  gestion: ClipboardList,
  reporte: Megaphone,
  verificacion: BadgeCheck,
  puntos: Trophy,
  sistema: Info,
};

/** Notificaciones recientes de la identidad activa; respeta «Notificaciones discretas». */
export function NotificacionesRecientesSection() {
  const { t } = useTranslation();
  const notificaciones = useNotifications();
  const privacidad = usePrivacy();
  const recientes = notificaciones.data ? [...notificaciones.data].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, MAXIMO) : [];
  const discretas = privacidad.data?.notificacionesDiscretas === true;

  return (
    <Card as="section" id="notificaciones" aria-labelledby="titulo-notificaciones-recientes" relleno="md" data-guia="expediente.notificaciones">
      <EncabezadoSeccion
        id="titulo-notificaciones-recientes"
        icono={Bell}
        rotulo={t("Avisos")}
        titulo={t("Notificaciones recientes")}
        extra={
          discretas ? (
            <Badge tono="marino" icono={EyeOff}>
              {t("Discretas")}
            </Badge>
          ) : null
        }
      />

      {notificaciones.isPending ? <LoadingState etiqueta={t("Cargando tus notificaciones…")} variante="compacto" /> : null}

      {notificaciones.isError ? (
        <ErrorState
          error={notificaciones.error}
          nivel={3}
          titulo={t("No pudimos cargar tus notificaciones")}
          onReintentar={() => void notificaciones.refetch()}
        />
      ) : null}

      {notificaciones.isSuccess && recientes.length === 0 ? (
        <EmptyState
          nivel={3}
          icono={Bell}
          titulo={t("No tienes notificaciones")}
          descripcion={t("Aquí verás avisos de tus gestiones y reportes de demostración.")}
          className="py-6"
        />
      ) : null}

      {recientes.length > 0 ? (
        <ul className="divide-y divide-borde">
          {recientes.map((notificacion) => {
            const Icono = ICONO_TIPO[notificacion.tipo];
            const detalle = mostrarDetalleNotificacion(notificacion, privacidad.data);
            return (
              <li key={notificacion.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <Icono aria-hidden="true" className="mt-3 size-5 shrink-0 text-azul" />
                <div className="min-w-0 flex-1">
                  {notificacion.enlace ? (
                    <Link to={notificacion.enlace} className="flex min-h-11 items-center font-semibold break-words text-tinta underline-offset-2 hover:underline">
                      {t(notificacion.titulo)}
                    </Link>
                  ) : (
                    <p className="flex min-h-11 items-center font-semibold break-words text-tinta">{t(notificacion.titulo)}</p>
                  )}
                  {detalle ? (
                    <p className="mt-0.5 text-sm break-words text-tinta-suave">{t(notificacion.cuerpo)}</p>
                  ) : (
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-tinta-suave">
                      <EyeOff aria-hidden="true" className="size-3.5 shrink-0" />
                      {t("Vista previa oculta")}
                    </p>
                  )}
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-tinta-suave">
                    <time dateTime={notificacion.fecha}>{formatearFechaHora(notificacion.fecha)}</time>
                    {notificacion.leida ? null : (
                      <Badge tono="azul">
                        <span className="sr-only">{t("Estado: ")}</span>
                        {t("Sin leer")}
                      </Badge>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <ButtonLink to="/notificaciones" variante="fantasma" tamano="sm" iconoFin={ChevronRight} className="mt-3">
        {t("Ver todas las notificaciones")}
      </ButtonLink>
    </Card>
  );
}
