import { Clock, ExternalLink, Phone } from "lucide-react";
import { Badge, clasesBoton, cx, formatearFecha, InfoStatusBadge } from "@/design-system";
import type { LineaAyuda } from "@/types";
import { esEmergencias911, ETIQUETA_AMBITO, hrefTelefono } from "./lineas";

export interface LineaAyudaTarjetaProps {
  linea: LineaAyuda;
  /** Nivel del encabezado con el nombre de la línea. */
  nivel?: 3 | 4;
  /** Destaca la tarjeta (p. ej. el 911). */
  destacada?: boolean;
  className?: string;
}

/**
 * Una línea de ayuda humana: nombre, ámbito, verificación, horario publicado y enlace tel:.
 * Llamar siempre requiere que la persona toque el enlace: el prototipo no marca ni registra nada.
 */
export function LineaAyudaTarjeta({ linea, nivel = 3, destacada = false, className }: LineaAyudaTarjetaProps) {
  const Titulo = nivel === 3 ? "h3" : "h4";
  const es911 = esEmergencias911(linea);
  return (
    <article
      className={cx(
        "rounded-tarjeta border p-4",
        destacada ? "border-peligro/40 bg-peligro-suave" : "border-borde bg-superficie",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <Titulo className="text-base font-semibold text-marino">{linea.nombre}</Titulo>
        <div className="flex flex-wrap gap-1.5">
          <Badge tono="neutro">{ETIQUETA_AMBITO[linea.ambito]}</Badge>
          <InfoStatusBadge estado={linea.verificado ? "verificada" : "pendiente"} />
        </div>
      </div>
      <p className="mt-1 text-xl font-semibold tracking-wide text-tinta">{linea.telefono}</p>
      <p className="mt-1 text-sm text-tinta">{linea.descripcion}</p>
      {linea.disponibilidad ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-sm text-tinta-suave">
          <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>Horario publicado: {linea.disponibilidad}</span>
        </p>
      ) : null}
      {!linea.verificado ? (
        <p className="mt-1.5 text-sm font-medium text-aviso">Pendiente de verificar: confirma el número en su fuente oficial.</p>
      ) : null}
      <a
        href={hrefTelefono(linea.telefonoMarcable)}
        className={clasesBoton({ variante: es911 || destacada ? "peligro" : "secundario", tamano: "md", anchoCompleto: true, className: "mt-3" })}
      >
        <Phone aria-hidden="true" className="size-[1.15em] shrink-0" />
        <span>
          {es911 ? "Llamar al 911" : "Llamar"}
          <span className="sr-only">{es911 ? " (Emergencias)" : ` a ${linea.nombre}, ${linea.telefono}`}</span>
        </span>
      </a>
      <p className="mt-2 text-sm text-tinta-suave">
        Fuente:{" "}
        <a href={linea.fuente.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-enlace underline underline-offset-2">
          {linea.fuente.nombre}
          <ExternalLink aria-hidden="true" className="size-3 shrink-0" />
          <span className="sr-only">(se abre en otra pestaña)</span>
        </a>{" "}
        · consultada el {formatearFecha(linea.fuente.fechaConsulta, "media")}
      </p>
    </article>
  );
}
