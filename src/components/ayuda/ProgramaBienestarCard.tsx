import { ArrowRight, Mail, MapPin, Phone, Smartphone } from "lucide-react";
import type { ReactNode } from "react";
import { Badge, ButtonLink, Card, cx, InfoStatusBadge, SourceNote } from "@/design-system";
import type { CanalAtencion, ProgramaBienestar, UbicacionServicio } from "@/types";
import { ETIQUETA_AREA, TONO_AREA } from "./etiquetas";

export interface ProgramaBienestarCardProps {
  programa: ProgramaBienestar;
  /** Sedes con dirección (useServiceLocations); se asocian por nombre y fuente. */
  ubicaciones?: readonly UbicacionServicio[];
  nivel?: 2 | 3;
  /** Nota adicional bajo la fuente (p. ej. «no implica vigencia»). */
  nota?: string;
  /** Identificador para el asistente (data-guia) del enlace principal. */
  guia?: string;
  /** Contenido adicional bajo la descripción (p. ej. el número de una línea, como texto). */
  children?: ReactNode;
  className?: string;
}

function direccionDe(sede: CanalAtencion, ubicaciones: readonly UbicacionServicio[]): string | null {
  const ubicacion = ubicaciones.find((candidata) => candidata.nombre === sede.valor && (!sede.fuente || candidata.fuente.url === sede.fuente));
  return ubicacion?.direccion ?? null;
}

/**
 * Programa de bienestar verificado: área, estado de la información, descripción tal como la publica
 * la fuente, contactos de oficina (texto, no son líneas de crisis), sedes, ficha interna y fuente.
 */
export function ProgramaBienestarCard({ programa, ubicaciones = [], nivel = 3, nota, guia, children, className }: ProgramaBienestarCardProps) {
  const Titulo = nivel === 2 ? "h2" : "h3";
  const contactos = programa.canales.filter((canal) => canal.tipo === "telefono" || canal.tipo === "correo");
  const apps = programa.canales.filter((canal) => canal.tipo === "app");
  const sedes = programa.canales.filter((canal) => canal.tipo === "presencial");

  return (
    <Card as="article" className={cx("flex h-full flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tono={TONO_AREA[programa.area]}>{ETIQUETA_AREA[programa.area]}</Badge>
        <InfoStatusBadge estado={programa.estadoDeInformacion} />
      </div>
      <Titulo className="text-lg leading-snug font-semibold text-marino">{programa.nombre}</Titulo>
      <p className="text-[0.9375rem] text-tinta">{programa.descripcion}</p>
      {programa.dirigidoA ? (
        <p className="text-sm text-tinta-suave">
          <span className="font-semibold text-tinta">A quién se dirige: </span>
          {programa.dirigidoA}
        </p>
      ) : null}
      {children}

      {contactos.length > 0 ? (
        <ul className="space-y-1.5 text-sm text-tinta" aria-label="Contactos de oficina">
          {contactos.map((canal) => {
            const Icono = canal.tipo === "correo" ? Mail : Phone;
            return (
              <li key={`${canal.tipo}-${canal.valor}`} className="flex items-start gap-2">
                <Icono aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tinta-suave" />
                <span className="min-w-0 break-words">
                  <span className="text-tinta-suave">{canal.etiqueta}: </span>
                  {canal.tipo === "correo" ? (
                    <a href={`mailto:${canal.valor}`} className="font-medium text-enlace underline underline-offset-2">
                      {canal.valor}
                    </a>
                  ) : (
                    <span className="font-semibold">{canal.valor}</span>
                  )}
                  {canal.horario ? <span className="text-tinta-suave"> · {canal.horario}</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {apps.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {apps.map((canal) => (
            <ButtonLink key={canal.valor} href={canal.valor} variante="secundario" tamano="sm" iconoInicio={Smartphone}>
              {canal.etiqueta}
            </ButtonLink>
          ))}
        </div>
      ) : null}

      {sedes.length > 0 ? (
        <details className="group rounded-control border border-borde bg-superficie-2 px-3 py-2">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-semibold text-marino">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            {sedes.length === 1 ? "Ver la sede" : `Ver las ${sedes.length} sedes`}
          </summary>
          <ul className="mt-1 space-y-2 pb-1 text-sm">
            {sedes.map((sede) => {
              const direccion = direccionDe(sede, ubicaciones);
              return (
                <li key={sede.valor}>
                  <span className="font-semibold text-tinta">{sede.valor}</span>
                  {direccion ? <span className="block text-tinta-suave">{direccion}</span> : null}
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}

      <SourceNote fuente={programa.fuente} nota={nota} className="mt-auto" />

      {programa.servicioId ? (
        <ButtonLink to={`/servicios/${programa.servicioId}`} variante="fantasma" tamano="sm" iconoFin={ArrowRight} className="self-start" data-guia={guia}>
          Ver la ficha del servicio
        </ButtonLink>
      ) : null}
    </Card>
  );
}
