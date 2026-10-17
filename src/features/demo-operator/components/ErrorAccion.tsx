import { CircleAlert } from "lucide-react";
import { describirError } from "@/design-system";

/** Error de una acción del operador dentro de un diálogo: explícito y sin éxito ficticio. */
export function ErrorAccion({ error }: { error: unknown }) {
  if (!error) return null;
  const descrito = describirError(error);
  return (
    <p role="alert" className="flex items-start gap-2 rounded-control border border-peligro/25 bg-peligro-suave px-3 py-2.5 text-sm text-tinta">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-peligro" />
      <span>
        <strong className="font-semibold text-peligro">{descrito.titulo}. </strong>
        {descrito.descripcion} No se aplicó ningún cambio.
      </span>
    </p>
  );
}
