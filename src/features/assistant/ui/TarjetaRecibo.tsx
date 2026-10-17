import { Check, ClipboardCheck, X } from "lucide-react";
import { z } from "zod";
import type { ReciboAccion } from "@shared/asistente/acciones";
import { AyudaInmediata } from "@/components/ayuda/AyudaInmediata";

export interface TarjetaReciboProps {
  recibo: ReciboAccion;
  /** «Revisar y confirmar»: vuelve a la pantalla preparada y cede la pantalla. */
  onRevisar: (llamadaId: string) => void;
}

const DatosPreparados = z.object({
  formulario: z.string().optional(),
  servicio: z.object({ nombre: z.string() }).optional(),
});

const DatosApoyo = z.object({ motivo: z.enum(["salud_mental", "violencia", "emergencia", "orientacion"]) });

const ENFOQUE = { salud_mental: "salud_mental", violencia: "violencia", emergencia: "general", orientacion: "general" } as const;

/**
 * Recibo de una acción en el historial (patrón de Alex/Marea y Tricobot):
 * - completada: «✓» con lo que se hizo;
 * - fallida: «No se pudo» con el motivo legible;
 * - preparada_para_confirmar (nivel B): tarjeta «preparar → confirmar». La confirmación real ocurre
 *   en la pantalla destino, que la persona revisa; desde aquí nada se envía.
 * - ayuda humana: la tarjeta de Ayuda inmediata con las líneas verificadas (enlaces tel: explícitos).
 */
export function TarjetaRecibo({ recibo, onRevisar }: TarjetaReciboProps) {
  if (recibo.accion === "mostrarApoyoHumano" && recibo.estado === "completada") {
    const datos = DatosApoyo.safeParse(recibo.datos);
    return (
      <div className="text-tinta [--color-foco:var(--color-azul)]">
        <AyudaInmediata variante="tarjeta" enfoque={datos.success ? ENFOQUE[datos.data.motivo] : "general"} nivelTitulo={3} guia="asistente.ayuda_inmediata" />
      </div>
    );
  }

  if (recibo.estado === "preparada_para_confirmar") {
    const datos = DatosPreparados.safeParse(recibo.datos);
    const titulo = datos.success ? (datos.data.formulario ?? datos.data.servicio?.nombre ?? "Formulario preparado") : "Formulario preparado";
    return (
      <section
        aria-label={`Preparado para que lo revises: ${titulo}`}
        className="rounded-[20px] bg-(--pk-superficie) p-4 shadow-[inset_0_0_0_1px_var(--pk-lima)]"
      >
        <p className="pekito-rotulo flex items-center gap-2 text-[0.75rem] text-(--pk-lima)">
          <ClipboardCheck aria-hidden="true" className="size-4 shrink-0" />
          Preparado · falta tu confirmación
        </p>
        <p className="mt-2 text-base font-semibold text-(--pk-texto)">{titulo}</p>
        <p className="mt-1 text-sm text-(--pk-texto-suave)">{recibo.mensaje}</p>
        <button
          type="button"
          onClick={() => onRevisar(recibo.llamadaId)}
          data-guia="asistente.revisar_y_confirmar"
          className="mt-3 inline-flex min-h-11 items-center rounded-pildora bg-(--pk-lima) px-4 text-sm font-semibold text-(--pk-noche)"
        >
          Revisar y confirmar
        </button>
        <p className="mt-2 text-xs text-(--pk-texto-suave)">Nada se envía hasta que tú lo confirmes en el formulario.</p>
      </section>
    );
  }

  const fallida = recibo.estado === "fallida";
  const Icono = fallida ? X : Check;
  return (
    <p className={fallida ? "flex items-start gap-2 text-sm text-(--pk-peligro)" : "flex items-start gap-2 text-sm text-(--pk-texto-suave)"}>
      <Icono aria-hidden="true" className={fallida ? "mt-0.5 size-4 shrink-0" : "mt-0.5 size-4 shrink-0 text-(--pk-lima)"} />
      <span>
        <span className={fallida ? "font-semibold" : "sr-only"}>{fallida ? "No se pudo: " : "Hecho: "}</span>
        {recibo.mensaje}
      </span>
    </p>
  );
}
