import { useAsistenteStore } from "../runtime/store";
import { AvisoPekito, type AccionAviso } from "./AvisoPekito";

/** Avisos vigentes del asistente (errores legibles con su acción). Nada si no hay avisos. */
export function ListaAvisosPekito({ onAccion, className }: { onAccion: (accion: AccionAviso) => void; className?: string }) {
  const avisos = useAsistenteStore("general", (estado) => estado.avisos);
  const descartar = useAsistenteStore("general", (estado) => estado.descartarAviso);
  if (avisos.length === 0) return null;
  return (
    <div className={className ?? "space-y-2"}>
      {avisos.map((aviso) => (
        <AvisoPekito key={aviso.id} aviso={aviso} onAccion={onAccion} onDescartar={descartar} />
      ))}
    </div>
  );
}
