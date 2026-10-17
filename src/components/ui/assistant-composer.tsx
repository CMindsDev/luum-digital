
import { cx as cn } from "@/design-system";
import {
  ArrowUp,
  LoaderCircle,
  type LucideIcon,
  Plus,
  Square,
} from "lucide-react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";




/** `useLayoutEffect` in the browser, a no-op effect on the server. */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Where the conversation is: `ready` to send, `submitted` (waiting for the first token),
 * `streaming` (the answer is arriving) or `error`. The same values as the AI SDK `useChat` status.
 */
export type ComposerStatus = "ready" | "submitted" | "streaming" | "error";

export type ComposerMode = {
  value: string;
  label: string;
  icon?: LucideIcon;
  /** Tooltip of the pill. */
  description?: string;
};

export type AssistantComposerProps = {
  status?: ComposerStatus;
  /** Gets the trimmed text and the selected mode; the field clears right away. */
  onSend: (message: { text: string; mode?: string }) => void | Promise<void>;
  /** Pressed while `submitted` or `streaming`. Without it the button stays a disabled send. */
  onStop?: () => void;
  /** Mode pills under the field (one of them is always selected). */
  modes?: readonly ComposerMode[];
  /** Controlled mode; leave it out and use `defaultMode` for an uncontrolled one. */
  mode?: string;
  defaultMode?: string;
  onModeChange?: (mode: string) => void;
  /** Shows a paperclip button. */
  onAttach?: () => void;
  /** Fires when the draft becomes non-empty or empty again. */
  onDraftChange?: (hasDraft: boolean) => void;
  placeholder?: string;
  /** Longest message, characters. A counter appears once typing starts. Default 4000. */
  maxLength?: number;
  /** The field grows with the text up to this many rows, then scrolls. Default 8. */
  maxRows?: number;
  disabled?: boolean;
  /** Accessible name of the form. */
  label?: string;
  className?: string;
};

const LINE_HEIGHT_PX = 24;
const INSTANT = { duration: 0 } as const;
/** The selected pill's background glides to the new pill. */
const PILL_SPRING = { damping: 30, stiffness: 400, type: "spring" } as const;
const MIN_ROWS = 2;
/** A Stop press this soon after sending is the second click of a double click: ignored. */
const STOP_GUARD_MS = 400;
/** `keyCode` of a key event that belongs to an IME composition (Safari ends it with Enter). */
const IME_KEY_CODE = 229;

function fitHeight(field: HTMLTextAreaElement, maxRows: number) {
  const style = getComputedStyle(field);
  const padding =
    Number.parseFloat(style.paddingTop) +
    Number.parseFloat(style.paddingBottom);
  const max = maxRows * LINE_HEIGHT_PX + padding;
  field.style.height = "auto";
  field.style.height = `${Math.min(field.scrollHeight, max)}px`;
  field.style.overflowY = field.scrollHeight > max ? "auto" : "hidden";
}

/**
 * Grows the textarea to its content, from `MIN_ROWS` up to `maxRows` lines, on every edit and
 * whenever its width changes (a resized window or a rotated phone rewraps the text).
 */
function useAutoGrow(value: string, maxRows: number) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useIsomorphicLayoutEffect(() => {
    if (ref.current) {
      fitHeight(ref.current, maxRows);
    }
  }, [value, maxRows]);
  useEffect(() => {
    const field = ref.current;
    if (!field || typeof ResizeObserver === "undefined") {
      return;
    }
    let width = field.clientWidth;
    const observer = new ResizeObserver(() => {
      if (field.clientWidth !== width) {
        width = field.clientWidth;
        fitHeight(field, maxRows);
      }
    });
    observer.observe(field);
    return () => observer.disconnect();
  }, [maxRows]);
  return ref;
}

function ModePill({
  mode,
  name,
  checked,
  reduced,
  onChange,
}: {
  mode: ComposerMode;
  name: string;
  checked: boolean;
  reduced: boolean;
  onChange: (mode: string) => void;
}) {
  const select = useCallback(
    () => onChange(mode.value),
    [mode.value, onChange]
  );
  const Icon = mode.icon;
  return (
    <label
      className={cn(
        "relative inline-flex h-11 cursor-pointer select-none items-center gap-1.5 rounded-full px-3 text-xs transition-colors",
        "has-focus-visible:ring-2 has-focus-visible:ring-foco has-disabled:cursor-not-allowed has-disabled:opacity-50",
        checked
          ? "text-azul"
          : "text-tinta-suave hover:bg-superficie-2 hover:text-tinta"
      )}
      title={mode.description}
    >
      <input
        checked={checked}
        className="sr-only"
        name={name}
        onChange={select}
        type="radio"
        value={mode.value}
      />
      {checked ? (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-azul/30 bg-azul/10"
          layoutId="active-mode"
          transition={reduced ? INSTANT : PILL_SPRING}
        />
      ) : null}
      {Icon ? <Icon aria-hidden="true" className="relative size-3.5" /> : null}
      <span className="relative font-medium">{mode.label}</span>
    </label>
  );
}

function ModePills({
  modes,
  value,
  disabled,
  onChange,
}: {
  modes: readonly ComposerMode[];
  value: string | undefined;
  disabled: boolean;
  onChange: (mode: string) => void;
}) {
  const { t } = useTranslation();
  const name = useId();
  const reduced = useReducedMotion() ?? false;
  return (
    <LayoutGroup id={name}>
      <fieldset
        className="flex flex-wrap items-center gap-1"
        disabled={disabled}
      >
        <legend className="sr-only">{t("Modo de respuesta")}</legend>
        {modes.map((mode) => (
          <ModePill
            checked={mode.value === value}
            key={mode.value}
            mode={mode}
            name={name}
            onChange={onChange}
            reduced={reduced}
          />
        ))}
      </fieldset>
    </LayoutGroup>
  );
}

function SendButton({
  status,
  canSend,
  canStop,
  onStop,
}: {
  status: ComposerStatus;
  canSend: boolean;
  canStop: boolean;
  onStop?: () => void;
}) {
  const { t } = useTranslation();
  const busy = status === "submitted" || status === "streaming";
  const stoppable = busy && canStop;
  const label = stoppable ? t("Detener respuesta") : t("Enviar mensaje");
  let icon = <ArrowUp aria-hidden="true" className="size-4" />;
  if (status === "submitted") {
    icon = (
      <LoaderCircle
        aria-hidden="true"
        className="size-4 animate-spin motion-reduce:animate-none"
      />
    );
  } else if (status === "streaming") {
    icon = <Square aria-hidden="true" className="size-3.5 fill-current" />;
  }
  return (
    <button
      aria-label={label}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-azul text-white shadow-xs outline-none transition-[background-color,opacity,transform] hover:bg-azul/90 focus-visible:ring-2 focus-visible:ring-foco focus-visible:ring-offset-2 focus-visible:ring-offset-fondo active:scale-95 disabled:pointer-events-none disabled:opacity-40"
      data-status={status}
      disabled={busy ? !canStop : !canSend}
      onClick={stoppable ? onStop : undefined}
      title={
        stoppable
          ? t("Detener respuesta")
          : t("Enter para enviar, Shift+Enter para nueva línea")
      }
      type={stoppable ? "button" : "submit"}
    >
      {icon}
    </button>
  );
}

/**
 * Message box for an assistant: a field that grows with the text, mode pills, an optional
 * attach button, a character counter and one round button that sends, shows progress and stops
 * the answer. Enter sends, Shift+Enter adds a line, and IME composition never sends early.
 */
export function AssistantComposer({
  status = "ready",
  onSend,
  onStop,
  modes,
  mode,
  defaultMode,
  onModeChange,
  onAttach,
  onDraftChange,
  placeholder,
  maxLength = 4000,
  maxRows = 8,
  disabled = false,
  label,
  className,
}: AssistantComposerProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [innerMode, setInnerMode] = useState(defaultMode ?? modes?.[0]?.value);
  const currentMode = mode ?? innerMode;
  const field = useAutoGrow(text, maxRows);
  const counterId = useId();

  const busy = status === "submitted" || status === "streaming";
  const trimmed = text.trim();
  const over = text.length > maxLength;
  const canSend = !(disabled || busy || over) && trimmed.length > 0;
  const hasDraft = trimmed.length > 0;

  // Report only real changes of "has a draft", whatever the parent passes as the callback.
  const draftCallback = useRef(onDraftChange);
  useIsomorphicLayoutEffect(() => {
    draftCallback.current = onDraftChange;
  });
  const reportedDraft = useRef(false);
  useEffect(() => {
    if (reportedDraft.current !== hasDraft) {
      reportedDraft.current = hasDraft;
      draftCallback.current?.(hasDraft);
    }
  }, [hasDraft]);

  const sentAt = useRef(0);

  const pickMode = useCallback(
    (next: string) => {
      setInnerMode(next);
      onModeChange?.(next);
    },
    [onModeChange]
  );

  const submit = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (!canSend) {
        return;
      }
      setText("");
      sentAt.current = Date.now();
      // A failed send gives the text back, unless the person already typed something new.
      Promise.resolve(onSend({ mode: currentMode, text: trimmed })).catch(() =>
        setText((current) => current || trimmed)
      );
    },
    [canSend, currentMode, onSend, trimmed]
  );

  const stop = useCallback(() => {
    if (Date.now() - sentAt.current < STOP_GUARD_MS) {
      return;
    }
    onStop?.();
    field.current?.focus();
  }, [field, onStop]);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => setText(event.target.value),
    []
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter sends, Shift+Enter breaks the line, and an IME composition never sends early.
      if (
        event.key !== "Enter" ||
        event.shiftKey ||
        event.nativeEvent.isComposing ||
        event.keyCode === IME_KEY_CODE
      ) {
        return;
      }
      event.preventDefault();
      submit();
    },
    [submit]
  );

  return (
    <form
      aria-label={label ?? t("Mensaje al asistente municipal")}
      className={cn(
        "flex w-full flex-col gap-2 rounded-2xl border border-borde bg-superficie p-2 text-tinta shadow-sm transition-[border-color,box-shadow]",
        "focus-within:border-foco focus-within:ring-[3px] focus-within:ring-foco/30",
        disabled && "opacity-60",
        className
      )}
      data-slot="assistant-composer"
      data-status={status}
      onSubmit={submit}
    >
      <textarea
        aria-describedby={text.length > 0 ? counterId : undefined}
        aria-invalid={over || undefined}
        aria-label={t("Mensaje")}
        className="block w-full resize-none bg-transparent px-2.5 py-2 text-sm leading-6 outline-none placeholder:text-tinta-suave disabled:cursor-not-allowed"
        disabled={disabled}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? t("Pregunta sobre tu ciudad…")}
        ref={field}
        rows={MIN_ROWS}
        value={text}
      />
      <div className="flex items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {onAttach ? (
            <button
              aria-label={t("Agregar contexto")}
              className="inline-flex size-11 items-center justify-center rounded-full text-tinta-suave outline-none transition-colors hover:bg-superficie-2 hover:text-tinta focus-visible:ring-2 focus-visible:ring-foco disabled:opacity-50"
              disabled={disabled}
              onClick={onAttach}
              title={t("Agregar contexto")}
              type="button"
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          ) : null}
          {modes && modes.length > 0 ? (
            <ModePills
              disabled={disabled}
              modes={modes}
              onChange={pickMode}
              value={currentMode}
            />
          ) : null}
          <span
            className={cn(
              "ml-auto px-1.5 text-tinta-suave text-xs tabular-nums",
              over && "font-medium text-peligro"
            )}
            id={counterId}
          >
            {text.length > 0
              ? `${text.length.toLocaleString("es-MX")} / ${maxLength.toLocaleString("es-MX")}`
              : ""}
          </span>
        </div>
        <SendButton
          canSend={canSend}
          canStop={Boolean(onStop)}
          onStop={stop}
          status={status}
        />
      </div>
    </form>
  );
}

export default AssistantComposer;
