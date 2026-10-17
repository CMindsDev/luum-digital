import { CalendarClock, ClipboardCheck, ClipboardList, Trophy, UserX, type LucideIcon } from "lucide-react";
import { ButtonLink, EmptyState } from "@/design-system";
import type { MotivoNoElegible } from "@/domain/verificacion";

const CONTENIDO: Record<MotivoNoElegible, { icono: LucideIcon; titulo: string; detalle: string }> = {
  reporte_propio: {
    icono: UserX,
    titulo: "No puedes verificar tu propio reporte",
    detalle: "Nadie gana puntos por verificarse a sí mismo: otra persona puede comprobar la reparación en el lugar.",
  },
  no_solucionado: {
    icono: CalendarClock,
    titulo: "Este reporte aún no se puede verificar",
    detalle: "Cuando el Ayuntamiento (simulado) reporte la atención, otras personas podrán verificar si quedó resuelto.",
  },
  ya_verificado: {
    icono: ClipboardCheck,
    titulo: "Ya verificaste este reporte",
    detalle: "Cada persona verifica un reporte una sola vez. Revisa el estado de tu verificación en «Mis verificaciones».",
  },
};

export interface AvisoNoElegibleProps {
  codigo: MotivoNoElegible;
  /** Mensaje de la regla (src/domain/verificacion.ts). */
  motivo: string;
  reporteId: string;
}

/** Explica con claridad por qué no se puede verificar este reporte (p. ej. es propio). */
export function AvisoNoElegible({ codigo, motivo, reporteId }: AvisoNoElegibleProps) {
  const { icono, titulo, detalle } = CONTENIDO[codigo];
  return (
    <div data-no-elegible={codigo}>
      <EmptyState
        icono={icono}
        titulo={titulo}
        descripcion={
          <>
            <p className="font-medium text-tinta">{motivo}</p>
            <p className="mt-1">{detalle}</p>
          </>
        }
        accion={
          <>
            <ButtonLink to="/participacion" iconoInicio={Trophy}>
              Ir a Participación
            </ButtonLink>
            <ButtonLink to={`/reportes/${encodeURIComponent(reporteId)}`} variante="secundario" iconoInicio={ClipboardList}>
              Ver el reporte
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
