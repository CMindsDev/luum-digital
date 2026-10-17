import { ArrowUp, Mic } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { cx } from "@/design-system";

const MAX_CARACTERES = 500;
/** Crece hasta unas 4 líneas y luego desplaza (22:253). */
const ALTO_MAXIMO_PX = 120;

export interface CompositorPekitoProps {
  valor: string;
  onCambiar: (valor: string) => void;
  onEnviar: (texto: string) => void;
  /** Mientras Pekito responde o actúa, el envío se deshabilita (evita dobles envíos). */
  ocupado: boolean;
  /** Sólo con OpenAI Realtime disponible: botón de micrófono para pasar a voz. */
  vozDisponible: boolean;
  onHablar: () => void;
  /** Alguien pidió enfocar el compositor (chips, «Escribir», abrirPekito). */
  enfoquePendiente: boolean;
  /** El compositor ya atendió la petición de enfoque. */
  onEnfocado: () => void;
}

/**
 * Compositor en píldora del chat (Figma 22:253): campo que crece, micrófono si hay voz y «Enviar».
 * Enter envía; Mayús + Enter agrega una línea. La ayuda «Puede equivocarse…» queda asociada al campo.
 */
export function CompositorPekito({ valor, onCambiar, onEnviar, ocupado, vozDisponible, onHablar, enfoquePendiente, onEnfocado }: CompositorPekitoProps) {
  const propio = useRef<HTMLTextAreaElement>(null);
  const idCampo = useId();
  const idAyuda = useId();
  const vacio = !valor.trim();
  const deshabilitado = vacio || ocupado;

  // Ajusta la altura al contenido.
  useLayoutEffect(() => {
    const campo = propio.current;
    if (!campo) return;
    campo.style.height = "auto";
    campo.style.height = `${Math.min(campo.scrollHeight, ALTO_MAXIMO_PX)}px`;
  }, [valor]);

  // El enfoque se pide desde fuera y se consume una sola vez (reabrir el chat no vuelve a abrir el teclado).
  // Se difiere un instante para ganarle al foco inicial del diálogo, que se coloca tras montar su contenido.
  useEffect(() => {
    if (!enfoquePendiente) return;
    const temporizador = window.setTimeout(() => {
      const campo = propio.current;
      if (campo) {
        campo.focus();
        campo.setSelectionRange(campo.value.length, campo.value.length);
      }
      onEnfocado();
    }, 0);
    return () => window.clearTimeout(temporizador);
  }, [enfoquePendiente, onEnfocado]);

  const enviar = (evento?: FormEvent) => {
    evento?.preventDefault();
    if (deshabilitado) return;
    onEnviar(valor.trim());
  };

  const alTeclear = (evento: KeyboardEvent<HTMLTextAreaElement>) => {
    if (evento.key === "Enter" && !evento.shiftKey && !evento.nativeEvent.isComposing) {
      evento.preventDefault();
      enviar();
    }
  };

  return (
    <form onSubmit={enviar} aria-label="Escribe a Pekito" className="px-4 pt-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-5">
      <div className="pekito-compositor flex items-end gap-1.5 rounded-[28px] p-1.5">
        <label htmlFor={idCampo} className="sr-only">
          Escribe a Pekito
        </label>
        <textarea
          id={idCampo}
          ref={propio}
          value={valor}
          onChange={(evento) => onCambiar(evento.target.value.slice(0, MAX_CARACTERES))}
          onKeyDown={alTeclear}
          rows={1}
          maxLength={MAX_CARACTERES}
          placeholder="Escribe un mensaje…"
          aria-describedby={idAyuda}
          autoComplete="off"
          data-guia="asistente.mensaje"
          className="max-h-[120px] min-h-11 flex-1 resize-none self-center bg-transparent px-3 py-2.5 text-base leading-[1.4] text-(--pk-texto) outline-none focus-visible:outline-none"
        />
        {vozDisponible ? (
          <button
            type="button"
            onClick={onHablar}
            aria-label="Hablar con Pekito"
            data-guia="asistente.dictar"
            className="grid size-11 shrink-0 place-items-center rounded-full text-(--pk-texto-suave) hover:text-(--pk-texto)"
          >
            <Mic aria-hidden="true" className="size-5" />
          </button>
        ) : null}
        <button
          type="submit"
          aria-label={ocupado ? "Enviar (espera a que Pekito termine)" : "Enviar"}
          disabled={deshabilitado}
          data-guia="asistente.enviar"
          className={cx(
            "grid size-11 shrink-0 place-items-center rounded-full transition-colors",
            deshabilitado ? "cursor-not-allowed bg-(--pk-noche-2) text-(--pk-placeholder)" : "bg-(--pk-lima) text-(--pk-noche)",
          )}
        >
          <ArrowUp aria-hidden="true" className="size-5" />
        </button>
      </div>
      <p id={idAyuda} className="mt-2 px-2 text-center text-xs text-(--pk-texto-suave)">
        Pekito puede equivocarse. Confirma los datos importantes con la fuente oficial. No compartas datos personales reales.
      </p>
    </form>
  );
}
