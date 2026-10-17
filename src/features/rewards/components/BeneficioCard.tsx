import { Gift, PackageX } from "lucide-react";
import { useId } from "react";
import { Badge, Button, Card, DemoTag } from "@/design-system";
import type { BeneficioDemo } from "@/types";
import { formatearPuntos, puntosEnTexto } from "../lib/movimientos";

export interface BeneficioCardProps {
  beneficio: BeneficioDemo;
  /** Saldo disponible (aprobado); undefined mientras carga. */
  disponible: number | undefined;
  /** Bloquea el canje (p. ej. sin conexión). */
  bloqueado?: boolean;
  onCanjear: (beneficio: BeneficioDemo) => void;
}

/**
 * Beneficio FICTICIO marcado como ejemplo: sin comercios, patrocinios ni descuentos reales.
 * El canje se bloquea si no está disponible o si el saldo aprobado no alcanza (nunca queda negativo).
 */
export function BeneficioCard({ beneficio, disponible, bloqueado = false, onCanjear }: BeneficioCardProps) {
  const idEstado = `beneficio-${useId().replace(/:/g, "")}`;
  const faltan = disponible === undefined ? null : Math.max(0, beneficio.costoPuntos - disponible);
  const alcanza = faltan === 0;
  const puedeCanjear = beneficio.disponible && alcanza && !bloqueado;

  let estado: string;
  if (!beneficio.disponible) estado = "Agotado: es un ejemplo para mostrar este estado.";
  else if (faltan === null) estado = "Consultando tu saldo…";
  else if (!alcanza) estado = `Te faltan ${puntosEnTexto(faltan)} aprobados.`;
  else if (bloqueado) estado = "Sin conexión: podrás canjear al reconectar.";
  else estado = "Tu saldo aprobado alcanza para este ejemplo.";

  return (
    <Card as="article" className="flex h-full flex-col gap-3" data-beneficio={beneficio.id}>
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-boton bg-lima-suave text-cafe">
          {beneficio.disponible ? <Gift className="size-6" strokeWidth={1.75} /> : <PackageX className="size-6" strokeWidth={1.75} />}
        </span>
        <DemoTag>Ejemplo</DemoTag>
      </div>
      <h3 className="text-base leading-snug font-semibold text-marino">{beneficio.nombre}</h3>
      <p className="text-[0.9375rem] text-tinta">{beneficio.descripcion}</p>
      <div className="mt-auto flex flex-col gap-3 pt-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-2xl leading-none font-semibold text-marino">{formatearPuntos(beneficio.costoPuntos)}</span>
          <span className="text-sm font-medium text-tinta">puntos</span>
          {!beneficio.disponible ? (
            <Badge tono="neutro" icono={PackageX}>
              Agotado (ejemplo)
            </Badge>
          ) : null}
        </p>
        <p id={idEstado} className={alcanza || !beneficio.disponible ? "text-sm text-tinta-suave" : "text-sm font-medium text-aviso"}>
          {estado}
        </p>
        <Button
          variante={puedeCanjear ? "primario" : "secundario"}
          anchoCompleto
          disabled={!puedeCanjear}
          aria-describedby={idEstado}
          onClick={() => onCanjear(beneficio)}
          data-guia={`recompensas.canjear_${beneficio.id}`}
        >
          Canjear<span className="sr-only"> {beneficio.nombre}</span>
        </Button>
      </div>
    </Card>
  );
}
