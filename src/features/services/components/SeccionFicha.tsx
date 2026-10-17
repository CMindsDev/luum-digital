import type { LucideIcon } from "lucide-react";
import type { ReactNode, Ref } from "react";
import { Card } from "@/design-system";

export interface SeccionFichaProps {
  /** id del elemento (ancla: /servicios/:id#requisitos). */
  id: string;
  titulo: string;
  icono?: LucideIcon;
  descripcion?: ReactNode;
  guia?: string;
  children: ReactNode;
  tituloRef?: Ref<HTMLHeadingElement>;
}

/** Sección de la ficha: tarjeta con h2 enlazado por aria-labelledby y ancla estable. */
export function SeccionFicha({ id, titulo, icono: Icono, descripcion, guia, children, tituloRef }: SeccionFichaProps) {
  const idTitulo = `${id}-titulo`;
  return (
    <Card as="section" id={id} aria-labelledby={idTitulo} relleno="lg" data-guia={guia} className="scroll-mt-[calc(var(--altura-encabezado)+1rem)]">
      <div className="mb-4 flex items-center gap-2.5">
        {Icono ? (
          <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-boton bg-azul-suave text-azul">
            <Icono className="size-5" />
          </span>
        ) : null}
        <h2 ref={tituloRef} id={idTitulo} tabIndex={-1} className="text-lg font-semibold text-marino">
          {titulo}
        </h2>
      </div>
      {descripcion ? <div className="-mt-2 mb-4 text-sm text-tinta-suave">{descripcion}</div> : null}
      {children}
    </Card>
  );
}
