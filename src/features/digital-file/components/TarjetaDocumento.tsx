import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { CLASES_MOSAICO, cx, formatearFecha } from "@/design-system";
import type { DocumentoDemo } from "@/types";
import { MARCA_DOCUMENTO_EJEMPLO, rutaDocumento, TIPO_DOCUMENTO } from "../lib/documentos";

export interface TarjetaDocumentoProps {
  documento: DocumentoDemo;
  className?: string;
}

/** Acceso a la vista previa de un documento ficticio del expediente. */
export function TarjetaDocumento({ documento, className }: TarjetaDocumentoProps) {
  const tipo = TIPO_DOCUMENTO[documento.tipo];
  const colores = CLASES_MOSAICO[tipo.tono];
  const Icono = tipo.icono;

  return (
    <Link
      to={rutaDocumento(documento.id)}
      data-documento-id={documento.id}
      className={cx(
        "group flex h-full min-h-20 items-center gap-3 rounded-tarjeta border border-borde bg-superficie p-3 text-left no-underline shadow-suave",
        "transition-[box-shadow,transform] duration-(--duracion-media) ease-suave hover:shadow-elevada motion-safe:hover:-translate-y-0.5",
        className,
      )}
    >
      <span className={cx("inline-flex size-12 shrink-0 items-center justify-center rounded-boton", colores.fondo)}>
        <Icono aria-hidden="true" className={cx("size-6", colores.icono)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block leading-snug font-semibold text-tinta">{documento.titulo}</span>
        <span className="mt-0.5 block text-sm text-tinta-suave">
          Agregado el <time dateTime={documento.fecha}>{formatearFecha(documento.fecha)}</time>
        </span>
        <span className="mt-1 block font-mono-rotulo text-xs font-medium tracking-[0.08em] text-cafe uppercase">{MARCA_DOCUMENTO_EJEMPLO}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-tinta-suave transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
