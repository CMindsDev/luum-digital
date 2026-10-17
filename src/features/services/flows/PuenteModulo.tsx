import { ArrowRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink, Card } from "@/design-system";

export interface PuenteModuloProps {
  titulo: string;
  descripcion: ReactNode;
  /** Ruta INTERNA del prototipo (nunca un sitio externo). */
  ruta: string;
  textoBoton: string;
  icono: LucideIcon;
  guia?: string;
  children?: ReactNode;
}

/** Lleva a otro módulo interno de la app con contexto (reportes, Visor Urbano, bienestar…). */
export function PuenteModulo({ titulo, descripcion, ruta, textoBoton, icono: Icono, guia, children }: PuenteModuloProps) {
  return (
    <Card as="section" aria-labelledby="titulo-puente" relleno="lg">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-boton bg-lima-suave text-cafe">
          <Icono className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="titulo-puente" className="text-xl font-semibold text-marino">
            {titulo}
          </h2>
          <div className="mt-1.5 text-[0.9375rem] text-tinta">{descripcion}</div>
        </div>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
      <div className="mt-5 flex">
        <ButtonLink to={ruta} tamano="lg" iconoFin={ArrowRight} data-guia={guia} className="w-full sm:w-auto">
          {textoBoton}
        </ButtonLink>
      </div>
    </Card>
  );
}
