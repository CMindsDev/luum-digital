import { PhoneOff, X } from "lucide-react";
import { useContext, useRef, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { cx } from "@/design-system";
import type { LineaPresencia } from "./presencia";
import { PekitoMascota } from "./PekitoMascota";
import type { LadoPekito } from "./pekito-preferencias";
import { useArrastreLado } from "./useArrastreLado";
import { useEstadoMascota } from "./useEstadoMascota";
import { AVATARES, ESTILO_TRANSICION_EXPERTO, ExpertoPekitoContext, TransicionExpertoContext } from "./expertos";

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
  const { t } = useTranslation();
  const contenedorRef = useRef<HTMLDivElement>(null);
  useArrastreLado({ asa: botonRef, contenedor: contenedorRef, onSoltar: onMover });
  const estadoMascota = useEstadoMascota();
  const experto = useContext(ExpertoPekitoContext) ?? "general";
  const cambiando = useContext(TransicionExpertoContext);
  const mostrarCambio = !abierto && cambiando && linea?.tipo !== "aviso";

  const visible = abierto ? null : linea;
  const mostrarTexto = mostrarCambio || visible !== null;
  const textoVisible = mostrarCambio ? t("Cambiando al experto…") : visible ? t(visible.texto) : "";
  const mascota = (
    <button
      ref={botonRef}
      type="button"
      onClick={onAbrir}
      data-guia="asistente.abrir"
      data-pekito-origen
      aria-haspopup="dialog"
      aria-expanded={abierto}
      aria-label={t("Abrir Peekito, tu asistente de servicios")}
      aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
      title={t("Peekito, tu asistente de servicios. Arrastra o usa Alt y las flechas para moverlo de lado.")}
      className="pekito-orbe grid size-[3.25rem] shrink-0 touch-none place-items-center rounded-full border-2 border-(--pekito-acento) text-(--pekito-tinta) shadow-flotante hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
    >
      <PekitoMascota ancho={38} estado={estadoMascota} />
    </button>
  );

  // El texto de la línea es siempre una región viva (aunque no se vea) para que los lectores de pantalla
  // reciban lo que Pekito hace o responde cuando el panel está cerrado.
  const texto = (
    <div
      role="status"
      aria-atomic="true"
      onClick={mostrarTexto ? onAbrir : undefined}
      className={cx(
        mostrarTexto
          ? "pekito-linea flex min-h-11 min-w-0 items-center gap-1 rounded-full border-2 border-(--pekito-acento) bg-(--pekito-fondo) py-1 pr-1 pl-4 text-sm font-medium text-(--pekito-tinta) shadow-flotante"
          : "sr-only",
      )}
    >
      <span data-guia="asistente.linea" className={cx("min-w-0 truncate", mostrarTexto && "max-w-[min(18rem,calc(100vw-13rem))] cursor-pointer")}>
        {textoVisible}
        {mostrarCambio ? <span className="sr-only"> · {t(AVATARES[experto].etiqueta)}</span> : null}
      </span>
      {visible?.enLlamada ? (
        <button
          type="button"
          onClick={(evento) => {
            evento.stopPropagation();
            onColgar();
          }}
          aria-label={t("Colgar")}
          data-guia="asistente.colgar"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-peligro text-white"
        >
          <PhoneOff aria-hidden="true" className="size-5" />
        </button>
      ) : visible && !mostrarCambio ? (
        <button
          type="button"
          onClick={(evento) => {
            evento.stopPropagation();
            onDescartarLinea();
          }}
          aria-label={t("Descartar mensaje de Peekito")}
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
      data-experto={experto}
      style={ESTILO_TRANSICION_EXPERTO}
      className={cx("pekito pekito-presencia fixed z-40 flex items-center gap-2", lado === "derecha" ? "flex-row" : "flex-row-reverse")}
    >
      {texto}
      {mascota}
    </div>
  );
}
