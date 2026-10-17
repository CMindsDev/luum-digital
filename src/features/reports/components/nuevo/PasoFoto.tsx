import { CircleAlert, ImagePlus, ShieldAlert, Trash2 } from "lucide-react";
import { useId } from "react";
import { Button, clasesBoton } from "@/design-system";
import { TIPOS_FOTO_PERMITIDOS } from "@/domain/validaciones";
import { formatearTamano, type FotoTemporal } from "../../lib/useFotoTemporal";

export interface PasoFotoProps {
  foto: FotoTemporal | null;
  error: string | null;
  onSeleccionar: (archivo: File | null | undefined) => void;
  onQuitar: () => void;
}

/**
 * Paso 3: fotografía opcional (JPG, PNG o WebP de hasta 5 MB). La vista previa es temporal y la
 * foto nunca se guarda ni se envía: sólo se registra que adjuntaste una.
 */
export function PasoFoto({ foto, error, onSeleccionar, onQuitar }: PasoFotoProps) {
  const idControl = `foto-${useId().replace(/:/g, "")}`;
  const idAyuda = `${idControl}-ayuda`;
  const idError = `${idControl}-error`;

  return (
    <div className="flex flex-col gap-5">
      <div role="note" className="flex items-start gap-3 rounded-tarjeta border border-ambar bg-aviso-suave px-4 py-3">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-aviso" />
        <p className="text-[0.9375rem] text-tinta">
          <strong className="font-semibold">Primero tu seguridad.</strong> No te expongas al tránsito para tomar la foto. Si estás en la calle,
          ponte a salvo: puedes enviar el reporte después, desde un lugar seguro.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-[0.9375rem] font-semibold text-tinta">
          Fotografía <span className="font-normal text-tinta-suave">(opcional)</span>
        </p>
        <p id={idAyuda} className="text-sm text-tinta-suave">
          JPG, PNG o WebP de hasta 5 MB. La foto no se guarda ni se envía en este prototipo: sólo se registra que adjuntaste una.
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <input
            id={idControl}
            type="file"
            accept={TIPOS_FOTO_PERMITIDOS.join(",")}
            aria-describedby={error ? `${idAyuda} ${idError}` : idAyuda}
            aria-invalid={error ? true : undefined}
            className="peer sr-only"
            data-guia="reportes.foto"
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
              tamano: "md",
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
      </div>

      {foto ? (
        <figure className="flex flex-col gap-3 rounded-tarjeta border border-borde bg-superficie p-3 sm:flex-row sm:items-start">
          <img src={foto.url} alt="Vista previa de la foto que elegiste" className="max-h-64 w-full rounded-control object-contain sm:w-64" />
          <figcaption className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-tinta">
            <span className="break-all font-medium">{foto.nombre}</span>
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
