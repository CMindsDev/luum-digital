import { CircleAlert, ImagePlus, Trash2 } from "lucide-react";
import { useId } from "react";
import { Button, clasesBoton } from "@/design-system";
import { TIPOS_FOTO_PERMITIDOS } from "@/domain/validaciones";
import { formatearTamano, type FotoEvidencia } from "../lib/useFotoEvidencia";

export interface SelectorFotoEvidenciaProps {
  foto: FotoEvidencia | null;
  error: string | null;
  onSeleccionar: (archivo: File | null | undefined) => void;
  onQuitar: () => void;
}

/**
 * Foto de evidencia opcional (JPG, PNG o WebP de hasta 5 MB). La vista previa es temporal y la foto
 * nunca se guarda ni se envía: sólo cuenta como criterio de calidad.
 */
export function SelectorFotoEvidencia({ foto, error, onSeleccionar, onQuitar }: SelectorFotoEvidenciaProps) {
  const idControl = `foto-evidencia-${useId().replace(/:/g, "")}`;
  const idAyuda = `${idControl}-ayuda`;
  const idError = `${idControl}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[0.9375rem] font-semibold text-tinta">
        Foto de evidencia <span className="font-normal text-tinta-suave">(opcional)</span>
      </p>
      <p id={idAyuda} className="text-sm text-tinta-suave">
        JPG, PNG o WebP de hasta 5 MB. No se guarda ni se envía en este prototipo: sólo se registra que adjuntaste una.
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <input
          id={idControl}
          type="file"
          accept={TIPOS_FOTO_PERMITIDOS.join(",")}
          aria-describedby={error ? `${idAyuda} ${idError}` : idAyuda}
          aria-invalid={error ? true : undefined}
          className="peer sr-only"
          data-guia="participacion.foto"
          onChange={(evento) => {
            onSeleccionar(evento.target.files?.[0]);
            // Permite volver a elegir el mismo archivo tras quitarlo.
            evento.target.value = "";
          }}
        />
        <label
          htmlFor={idControl}
          className={clasesBoton({
            variante: "secundario",
            tamano: "sm",
            className: "cursor-pointer peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foco",
          })}
        >
          <ImagePlus aria-hidden="true" className="size-[1.15em] shrink-0" />
          {foto ? "Cambiar foto" : "Elegir foto"}
        </label>
      </div>
      {error ? (
        <p id={idError} role="alert" className="flex items-start gap-1.5 text-sm font-medium text-peligro">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
      {foto ? (
        <figure className="mt-2 flex flex-col gap-3 rounded-tarjeta border border-borde bg-superficie p-3 sm:flex-row sm:items-start">
          <img src={foto.url} alt="Vista previa de la foto de evidencia" className="max-h-56 w-full rounded-control object-contain sm:w-56" />
          <figcaption className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-tinta">
            <span className="font-medium break-all">{foto.nombre}</span>
            <span className="text-tinta-suave">{formatearTamano(foto.tamanoBytes)} · vista previa temporal, no se guarda</span>
            <Button variante="fantasma" tamano="sm" iconoInicio={Trash2} onClick={onQuitar} className="self-start">
              Quitar foto
            </Button>
          </figcaption>
        </figure>
      ) : null}
    </div>
  );
}
