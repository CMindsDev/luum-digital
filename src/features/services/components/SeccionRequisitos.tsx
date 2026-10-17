import { Badge, cx } from "@/design-system";
import type { Requisito } from "@/types";
import { AvisoPendiente } from "./AvisoPendiente";

export interface SeccionRequisitosProps {
  requisitos: readonly Requisito[] | null;
  className?: string;
}

function etiquetaObligatorio(obligatorio: boolean | null): { texto: string; tono: "marino" | "neutro" } {
  if (obligatorio === true) return { texto: "Obligatorio", tono: "marino" };
  if (obligatorio === false) return { texto: "Opcional", tono: "neutro" };
  return { texto: "La fuente no indica si es obligatorio", tono: "neutro" };
}

/** Requisitos tal como los publica la fuente (o «Pendiente de verificar» si son null). */
export function SeccionRequisitos({ requisitos, className }: SeccionRequisitosProps) {
  if (requisitos === null) return <AvisoPendiente que="la lista de requisitos" className={className} />;
  if (requisitos.length === 0) {
    return <p className={cx("text-tinta", className)}>La fuente no publica requisitos para este servicio.</p>;
  }
  return (
    <ol className={cx("flex flex-col gap-3", className)}>
      {requisitos.map((requisito, indice) => {
        const obligatorio = etiquetaObligatorio(requisito.obligatorio);
        return (
          <li key={`${requisito.nombre}-${indice}`} className="rounded-boton border border-borde bg-fondo px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 flex-1 font-semibold text-tinta">
                <span className="mr-1.5 text-tinta-suave">{indice + 1}.</span>
                {requisito.nombre}
              </p>
              <Badge tono={obligatorio.tono} className="whitespace-normal">
                {obligatorio.texto}
              </Badge>
            </div>
            {requisito.descripcion ? <p className="mt-1 text-[0.9375rem] text-tinta-suave">{requisito.descripcion}</p> : null}
            {requisito.documentosAceptados && requisito.documentosAceptados.length > 0 ? (
              <div className="mt-2 text-[0.9375rem]">
                <p className="font-semibold text-tinta">Documentos aceptados</p>
                <ul className="mt-0.5 list-disc pl-5 text-tinta">
                  {requisito.documentosAceptados.map((documento) => (
                    <li key={documento}>{documento}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {requisito.presentacion ? <p className="mt-1 text-sm text-tinta-suave">Presentación: {requisito.presentacion}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
