import { BadgeCheck, Check, ClipboardList, Eye, EyeOff, Info, Megaphone, Trophy, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Badge, Button, ButtonLink, cx, formatearFechaHora } from "@/design-system";
import type { Notificacion } from "@/types";

const ICONO_TIPO: Record<Notificacion["tipo"], LucideIcon> = {
  gestion: ClipboardList,
  reporte: Megaphone,
  verificacion: BadgeCheck,
  puntos: Trophy,
  sistema: Info,
};

const ETIQUETA_TIPO: Record<Notificacion["tipo"], string> = {
  gestion: "Gestión",
  reporte: "Reporte",
  verificacion: "Verificación",
  puntos: "Puntos",
  sistema: "Sistema",
};

export interface ItemNotificacionProps {
  notificacion: Notificacion;
  /** Vista previa discreta: oculta título y detalle hasta que la persona decida mostrarlos. */
  discreta: boolean;
  onMarcarLeida: (id: string) => void;
  /** Abre el enlace interno (marca como leída antes de navegar). */
  onAbrir: (notificacion: Notificacion) => void;
  marcando?: boolean;
}

/** Notificación con ícono + texto, estado de lectura visible y vista previa discreta para las sensibles. */
export function ItemNotificacion({ notificacion, discreta, onMarcarLeida, onAbrir, marcando = false }: ItemNotificacionProps) {
  const [revelada, setRevelada] = useState(false);
  const Icono = ICONO_TIPO[notificacion.tipo];
  const oculta = discreta && !revelada;
  const idTitulo = `notificacion-${notificacion.id}`;

  return (
    <article
      aria-labelledby={idTitulo}
      data-notificacion-id={notificacion.id}
      data-leida={notificacion.leida}
      className={cx(
        "flex items-start gap-3 rounded-tarjeta border p-4 sm:gap-4 sm:p-5",
        notificacion.leida ? "border-borde bg-superficie" : "border-borde border-l-4 border-l-azul bg-azul-suave",
      )}
    >
      <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-boton bg-superficie text-marino shadow-suave">
        <Icono className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {notificacion.leida ? (
            <Badge tono="neutro" icono={Check}>
              Leída
            </Badge>
          ) : (
            <Badge tono="azul">Sin leer</Badge>
          )}
          <span className="text-sm text-tinta-suave">
            {ETIQUETA_TIPO[notificacion.tipo]} · <time dateTime={notificacion.fecha}>{formatearFechaHora(notificacion.fecha)}</time>
          </span>
        </div>
        <h2 id={idTitulo} className="mt-1.5 text-base font-semibold text-marino">
          {oculta ? "Aviso con vista previa discreta" : notificacion.titulo}
        </h2>
        <p className="mt-0.5 text-[0.9375rem] text-tinta">
          {oculta ? "El contenido está oculto para proteger tu privacidad en pantallas compartidas." : notificacion.cuerpo}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {discreta ? (
            <Button variante="fantasma" tamano="sm" iconoInicio={revelada ? EyeOff : Eye} onClick={() => setRevelada((actual) => !actual)} aria-expanded={revelada}>
              {revelada ? "Ocultar contenido" : "Mostrar contenido"}
            </Button>
          ) : null}
          {notificacion.enlace ? (
            <ButtonLink
              to={notificacion.enlace}
              variante="secundario"
              tamano="sm"
              onClick={() => onAbrir(notificacion)}
            >
              Abrir
              <span className="sr-only">: {oculta ? "aviso discreto" : notificacion.titulo}</span>
            </ButtonLink>
          ) : null}
          {!notificacion.leida ? (
            <Button variante="fantasma" tamano="sm" iconoInicio={Check} onClick={() => onMarcarLeida(notificacion.id)} disabled={marcando}>
              Marcar como leída
              <span className="sr-only">: {oculta ? "aviso discreto" : notificacion.titulo}</span>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
