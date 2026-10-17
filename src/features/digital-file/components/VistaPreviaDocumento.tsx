import { FlaskConical } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { CLASES_MOSAICO, cx, formatearFecha } from "@/design-system";
import type { DocumentoDemo } from "@/types";
import { lineasVistaPrevia, MARCA_DOCUMENTO_EJEMPLO, TIPO_DOCUMENTO } from "../lib/documentos";

export interface VistaPreviaDocumentoProps {
  documento: DocumentoDemo;
  className?: string;
}

/** Filas de la marca de agua (decorativas: el texto de la marca ya está visible y se anuncia). */
const FILAS_MARCA = ["top-[18%]", "top-[48%]", "top-[78%]"] as const;

/**
 * Vista previa de un documento FICTICIO: hoja con encabezado «DOCUMENTO DE EJEMPLO», marca de agua
 * diagonal y el texto de ejemplo. Sin sellos, escudos ni elementos que lo hagan parecer oficial.
 */
export function VistaPreviaDocumento({ documento, className }: VistaPreviaDocumentoProps) {
  const { t } = useTranslation();
  const idTitulo = useId();
  const tipo = TIPO_DOCUMENTO[documento.tipo];
  const colores = CLASES_MOSAICO[tipo.tono];
  const Icono = tipo.icono;
  const lineas = lineasVistaPrevia(documento);
  const marca = t(MARCA_DOCUMENTO_EJEMPLO);
  const marcaRepetida = `${marca} · ${marca}`;

  return (
    <figure
      aria-labelledby={idTitulo}
      data-guia="expediente.vista_previa"
      className={cx("relative isolate overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-elevada", className)}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none">
        {FILAS_MARCA.map((posicion) => (
          <div
            key={posicion}
            className={cx(
              "absolute -left-1/4 w-[150%] -rotate-18 text-center font-mono-rotulo text-2xl font-semibold tracking-[0.3em] whitespace-nowrap text-ambar/25 sm:text-4xl",
              posicion,
            )}
          >
            {marcaRepetida}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-ambar px-4 py-2.5 text-cafe sm:px-6">
        <FlaskConical aria-hidden="true" className="size-4 shrink-0" />
        <p className="font-mono-rotulo text-sm font-semibold tracking-[0.14em] uppercase">{marca}</p>
      </div>

      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex items-start gap-3 border-b border-dashed border-borde-control pb-4">
          <span className={cx("inline-flex size-12 shrink-0 items-center justify-center rounded-boton", colores.fondo)}>
            <Icono aria-hidden="true" className={cx("size-6", colores.icono)} />
          </span>
          <div className="min-w-0">
            <p id={idTitulo} className="text-lg leading-snug font-semibold break-words text-marino">
              {t(documento.titulo)}
            </p>
            <p className="text-sm text-tinta-suave">
              {t("Fecha de ejemplo: ")}<time dateTime={documento.fecha}>{formatearFecha(documento.fecha, "media")}</time>
            </p>
          </div>
        </div>

        <ul className="mt-5 flex flex-col gap-2.5 font-mono text-[0.9375rem] text-tinta">
          {lineas.map((linea, indice) => (
            <li key={`${indice}-${linea}`} className="break-words">
              {t(linea)}
            </li>
          ))}
        </ul>

        <figcaption className="mt-6 rounded-boton border border-ambar bg-ambar-suave px-3 py-2.5 text-sm font-medium text-cafe">
          {t("Documento ficticio de la demostración. Sin validez oficial: no sirve como identificación, comprobante ni recibo.")}
        </figcaption>
      </div>
    </figure>
  );
}
