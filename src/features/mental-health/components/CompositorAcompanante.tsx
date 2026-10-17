import { SendHorizontal } from "lucide-react";
import { useId, useState, type FormEvent, type KeyboardEvent, type Ref } from "react";
import { Button, CLASES_CONTROL, cx } from "@/design-system";

const MAXIMO = 600;

export interface CompositorAcompananteProps {
  onEnviar: (texto: string) => void;
  /** Deshabilita el envío mientras se prepara una respuesta (evita dobles envíos). */
  ocupado: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

/**
 * Campo de mensaje. Sin atributo name, sin autocompletar y sin enviar formularios nativos: el texto
 * nunca termina en la URL, en el historial del navegador ni en almacenamiento.
 */
export function CompositorAcompanante({ onEnviar, ocupado, ref }: CompositorAcompananteProps) {
  const [texto, setTexto] = useState("");
  const id = useId().replace(/:/g, "");
  const idCampo = `mensaje-${id}`;
  const idAyuda = `mensaje-ayuda-${id}`;

  const enviar = () => {
    const limpio = texto.trim();
    if (!limpio || ocupado) return;
    onEnviar(limpio);
    setTexto("");
  };

  const alEnviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    enviar();
  };

  const alTeclear = (evento: KeyboardEvent<HTMLTextAreaElement>) => {
    if (evento.key === "Enter" && !evento.shiftKey && !evento.nativeEvent.isComposing) {
      evento.preventDefault();
      enviar();
    }
  };

  return (
    <form onSubmit={alEnviar} className="space-y-1.5" autoComplete="off">
      <label htmlFor={idCampo} className="text-[0.9375rem] font-semibold text-tinta">
        Escribe tu mensaje
      </label>
      <p id={idAyuda} className="text-sm text-tinta-suave">
        Enter envía; Mayús + Enter hace un salto de línea. No escribas datos personales.
      </p>
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          id={idCampo}
          rows={2}
          maxLength={MAXIMO}
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          onKeyDown={alTeclear}
          aria-describedby={idAyuda}
          autoComplete="off"
          spellCheck
          data-guia="salud_mental.mensaje"
          className={cx(CLASES_CONTROL, "min-h-12 flex-1 resize-none py-2.5 leading-snug")}
        />
        <Button type="submit" iconoInicio={SendHorizontal} disabled={!texto.trim() || ocupado} data-guia="salud_mental.enviar" className="shrink-0">
          Enviar
        </Button>
      </div>
    </form>
  );
}
