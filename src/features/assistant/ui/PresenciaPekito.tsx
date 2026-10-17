import { PhoneOff, X } from "lucide-react";
import { useRef, type RefObject } from "react";
import { cx } from "@/design-system";
import type { LineaPresencia } from "./presencia";
import { PekitoMascota } from "./PekitoMascota";
import type { LadoPekito } from "./pekito-preferencias";
import { useArrastreLado } from "./useArrastreLado";
import { useEstadoMascota } from "./useEstadoMascota";

export interface PresenciaPekitoProps {
  lado: LadoPekito;
  abierto: boolean;
  linea: LineaPresencia | null;
  onAbrir: () => void;
  onDescartarLinea: () => void;
  onColgar: () => void;
  onMover: (lado: LadoPekito) => void;
  /** Botón de la mascota (para devolverle el foco al cerrar el panel). */
  botonRef: RefObject<HTMLButtonElement | null>;
}

/**
 * Presencia mínima de Pekito: una mascota pequeña que, sólo cuando hay algo que decir o hacer, se
 * estira en una píldora de UNA línea (acción en curso, aviso, «Te escucho», subtítulos o la última
 * respuesta). Se mueve de lado arrastrando o con Alt + flechas. Nunca tapa la navegación: se ancla
 * sobre la barra inferior (--altura-nav-inferior) y junto a la navegación lateral.
 */
export function PresenciaPekito({ lado, abierto, linea, onAbrir, onDescartarLinea, onColgar, onMover, botonRef }: PresenciaPekitoProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  useArrastreLado({ asa: botonRef, contenedor: contenedorRef, onSoltar: onMover });
  const estadoMascota = useEstadoMascota();

  const visible = abierto ? null : linea;
  const mascota = (
    <button
      ref={botonRef}
      type="button"
      onClick={onAbrir}
      data-guia="asistente.abrir"
      data-pekito-origen
      aria-haspopup="dialog"
      aria-expanded={abierto}
      aria-label="Abrir Pekito, asistente de demostración"
      aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
      title="Pekito, asistente de demostración. Arrastra o usa Alt y las flechas para moverlo de lado."
      className="grid size-[3.25rem] shrink-0 touch-none place-items-center rounded-full border-2 border-(--pekito-acento) bg-(--pekito-fondo) text-(--pekito-tinta) shadow-flotante transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <PekitoMascota ancho={38} estado={estadoMascota} />
    </button>
  );

  // El texto de la línea es siempre una región viva (aunque no se vea) para que los lectores de pantalla
  // reciban lo que Pekito hace o responde cuando el panel está cerrado.
  const texto = (
    <div
      role="status"
      onClick={visible ? onAbrir : undefined}
      className={cx(
        visible
          ? "flex min-h-11 min-w-0 items-center gap-1 rounded-full border-2 border-(--pekito-acento) bg-(--pekito-fondo) py-1 pr-1 pl-4 text-sm font-medium text-(--pekito-tinta) shadow-flotante"
          : "sr-only",
      )}
    >
      <span data-guia="asistente.linea" className={cx("min-w-0 truncate", visible && "max-w-[min(18rem,calc(100vw-13rem))] cursor-pointer")}>
        {visible ? visible.texto : ""}
      </span>
      {visible?.enLlamada ? (
        <button
          type="button"
          onClick={(evento) => {
            evento.stopPropagation();
            onColgar();
          }}
          aria-label="Colgar"
          data-guia="asistente.colgar"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-peligro text-white"
        >
          <PhoneOff aria-hidden="true" className="size-5" />
        </button>
      ) : visible ? (
        <button
          type="button"
          onClick={(evento) => {
            evento.stopPropagation();
            onDescartarLinea();
          }}
          aria-label="Descartar mensaje de Pekito"
          className="grid size-11 shrink-0 place-items-center rounded-full text-(--pekito-tenue) hover:bg-superficie-2"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  );

  return (
    <div
      ref={contenedorRef}
      data-asistente-ui
      data-lado={lado}
      className={cx("pekito pekito-presencia fixed z-40 flex items-center gap-2", lado === "derecha" ? "flex-row" : "flex-row-reverse")}
    >
      {texto}
      {mascota}
    </div>
  );
}
