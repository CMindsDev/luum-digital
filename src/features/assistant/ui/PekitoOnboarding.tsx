import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cx, VisuallyHidden } from "@/design-system";
import { msg } from "@/i18n";
import { useModalDialog } from "@/design-system/lib/use-modal-dialog";
import { PekitoMascota } from "./PekitoMascota";
import { guardarPreferenciasPekito, leerPreferenciasPekito, type ModoPreferido } from "./pekito-preferencias";
import "./pekito.css";

/**
 * Bienvenida de Pekito (Figma «Laboratorio de Innovación», nodo 22:67 «1»).
 * El paso 1 reproduce el frame; los pasos 2–5 usan la misma composición con el contenido
 * del producto (cómo atender, qué puede hacer, que la persona siempre confirma y que puede equivocarse).
 */

const TOTAL_PASOS = 5;
const SALUDO = msg("Hola, puedes hablar,\nyo te escucho...");
const ESTADO_URL = "/api/asistente/estado";

function usePrefiereMovimientoReducido(): boolean {
  const [reducido, setReducido] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true,
  );
  useEffect(() => {
    const consulta = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!consulta) return;
    const alCambiar = () => setReducido(consulta.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);
  return reducido;
}

/** Revela el texto letra por letra; con movimiento reducido lo muestra completo. Se reinicia al montarse. */
function TextoEscrito({ texto, reducido }: { texto: string; reducido: boolean }) {
  const [visibles, setVisibles] = useState(0);
  useEffect(() => {
    if (reducido) return;
    const intervalo = window.setInterval(() => {
      setVisibles((actual) => {
        if (actual >= texto.length) {
          window.clearInterval(intervalo);
          return actual;
        }
        return actual + 1;
      });
    }, 45);
    return () => window.clearInterval(intervalo);
  }, [texto, reducido]);
  return (
    <span aria-hidden="true" className="whitespace-pre-line">
      {reducido ? texto : texto.slice(0, visibles)}
    </span>
  );
}

/** ¿La voz está disponible? Si no, la bienvenida ofrece escritura. */
function useVozDisponible(abierto: boolean): boolean | null {
  const [disponible, setDisponible] = useState<boolean | null>(null);
  useEffect(() => {
    if (!abierto) return;
    const control = new AbortController();
    fetch(ESTADO_URL, { signal: control.signal })
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((estado: { realtime?: { disponible?: boolean } } | null) => setDisponible(estado?.realtime?.disponible === true))
      .catch(() => {
        if (!control.signal.aborted) setDisponible(false);
      });
    return () => control.abort();
  }, [abierto]);
  return disponible;
}

export interface PekitoOnboardingProps {
  abierto: boolean;
  /** Se llama al terminar o al saltar la bienvenida. */
  onCerrar: (modo: ModoPreferido) => void;
}

export function PekitoOnboarding({ abierto, onCerrar }: PekitoOnboardingProps) {
  const { t } = useTranslation();
  const [paso, setPaso] = useState(1);
  const [modo, setModo] = useState<ModoPreferido>(() => leerPreferenciasPekito().modo);
  const reducido = usePrefiereMovimientoReducido();
  const vozDisponible = useVozDisponible(abierto);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const idTitulo = useId();
  const idPaso = useId();

  const cerrar = () => {
    guardarPreferenciasPekito({ bienvenidaVista: true, modo });
    setPaso(1);
    onCerrar(modo);
  };

  const { dialogoRef, manejarTeclado, manejarClic } = useModalDialog({
    abierto,
    onCerrar: cerrar,
    enfocarAlAbrir: tituloRef,
    cerrarAlTocarFondo: false,
  });

  const avanzar = () => {
    if (paso >= TOTAL_PASOS) cerrar();
    else setPaso(paso + 1);
  };

  const ultimo = paso === TOTAL_PASOS;
  const saludo = t(SALUDO);

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby={idTitulo}
      aria-describedby={idPaso}
      onKeyDown={manejarTeclado}
      onClick={manejarClic}
      data-guia="asistente.bienvenida"
      data-asistente-ui
      className={cx(
        "pekito m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-[var(--pekito-fondo)] p-0 text-[var(--pekito-tinta)] backdrop:bg-marino/45",
        "min-[800px]:m-auto min-[800px]:h-[min(874px,calc(100dvh-2rem))] min-[800px]:w-[480px] min-[800px]:rounded-[15px] min-[800px]:shadow-flotante",
      )}
    >
      <div className="flex h-full flex-col overflow-y-auto px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        {/* Progreso, "1/5" y "Saltar" (frame 22:69). */}
        <div className="flex items-center gap-4 px-2 min-[400px]:pr-[9px] min-[400px]:pl-4">
          <div
            role="progressbar"
            aria-label={t("Avance de la bienvenida")}
            aria-valuemin={1}
            aria-valuemax={TOTAL_PASOS}
            aria-valuenow={paso}
            aria-valuetext={t("Paso {{paso}} de {{total}}", { paso, total: TOTAL_PASOS })}
            className="relative h-[7px] flex-1 overflow-hidden rounded-[3.54px] bg-[var(--pekito-pista)]"
          >
            <div
              className="absolute inset-y-0 left-0 rounded-[3.54px] bg-[var(--pekito-acento)] transition-[width] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: `${(paso / TOTAL_PASOS) * 100}%` }}
            />
          </div>
          <span aria-hidden="true" className="text-xs tabular-nums text-tinta-suave">
            {paso}/{TOTAL_PASOS}
          </span>
          <button
            type="button"
            onClick={cerrar}
            className="-m-2 min-h-11 rounded-md p-2 text-xs text-tinta-suave underline-offset-2 hover:underline focus-visible:outline-3 focus-visible:outline-foco"
          >
            {t("Saltar")}
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6 text-center min-[400px]:gap-8">
          {/* Título (22:76): PEKITO en Unbounded + subtítulo en Host Grotesk, 26/33. */}
          <h2 id={idTitulo} ref={tituloRef} tabIndex={-1} className="text-[26px] leading-[33px] font-normal text-[var(--pekito-tinta)] outline-none">
            <span className="pekito-marca block">PEEKITO</span>
            <span className="block">{t("Un agente que sí te atiende")}</span>
          </h2>

          <PekitoMascota ancho={paso === 1 ? 213 : 150} estado={paso === 1 ? "saludando" : "reposo"} className="max-w-[60vw]" />

          <div id={idPaso} aria-live="polite" className="w-full max-w-[340px]">
            {paso === 1 && (
              <p className="flex items-center justify-center gap-[1.842px] text-[28px] leading-[31.316px] text-[var(--pekito-tenue)]">
                <span aria-hidden="true" className="pekito-cursor h-[35px] w-[1.842px] shrink-0 bg-[var(--pekito-cursor)]" />
                {abierto && <TextoEscrito texto={saludo} reducido={reducido} />}
                <VisuallyHidden>{saludo.replace("\n", " ")}</VisuallyHidden>
              </p>
            )}

            {paso === 2 && (
              <fieldset className="space-y-3 text-left">
                <legend className="mb-3 w-full text-center text-[22px] leading-7">{t("¿Cómo quieres que te atienda?")}</legend>
                {(
                  [
                    {
                      valor: "hablar",
                      titulo: t("Hablar"),
                      detalle: vozDisponible
                        ? t("Como conversas normalmente.")
                        : t("La voz no está disponible ahora. Por ahora puedes escribir."),
                      deshabilitado: vozDisponible !== true,
                    },
                    { valor: "escribir", titulo: t("Escribir"), detalle: t("Cuando lo prefieras."), deshabilitado: false },
                  ] as const
                ).map((opcion) => (
                  <label
                    key={opcion.valor}
                    className={cx(
                      "flex min-h-11 cursor-pointer items-start gap-3 rounded-[21px] border-2 bg-superficie p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-foco",
                      modo === opcion.valor ? "border-[var(--pekito-acento)]" : "border-borde",
                      opcion.deshabilitado && "cursor-not-allowed opacity-70",
                    )}
                  >
                    <input
                      type="radio"
                      name="pekito-modo"
                      value={opcion.valor}
                      checked={modo === opcion.valor}
                      disabled={opcion.deshabilitado}
                      onChange={() => setModo(opcion.valor)}
                      className="mt-1 size-5 accent-[var(--pekito-acento)]"
                    />
                    <span>
                      <span className="block text-lg font-semibold">{opcion.titulo}</span>
                      <span className="block text-sm text-tinta-suave">{opcion.detalle}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}

            {paso === 3 && (
              <div className="space-y-3">
                <p className="text-[22px] leading-7">{t("Puedo ayudarte a…")}</p>
                <ul className="space-y-2 text-left text-base text-tinta-suave">
                  <li>{t("· Buscar trámites y servicios.")}</li>
                  <li>{t("· Explicarte requisitos y mostrarte la fuente oficial.")}</li>
                  <li>{t("· Preparar reportes y ayudarte a moverte por la app.")}</li>
                  <li>{t("· Llevarte al área del Ayuntamiento que te puede servir.")}</li>
                </ul>
              </div>
            )}

            {paso === 4 && (
              <div className="space-y-3">
                <p className="text-[22px] leading-7">{t("Tú siempre confirmas")}</p>
                <p className="text-base text-tinta-suave">
                  {t("Abro pantallas y preparo formularios por ti. Nada se envía sin que lo revises y lo confirmes.")}
                </p>
              </div>
            )}

            {paso === 5 && (
              <div className="space-y-3">
                <p className="text-[22px] leading-7">{t("Verifica lo importante")}</p>
                <p className="text-base text-tinta-suave">
                  {t("Puedo equivocarme. Confirma requisitos, horarios, teléfonos y otros datos importantes con la fuente oficial antes de seguir.")}
                </p>
              </div>
            )}
          </div>

          {/* Botón siguiente (22:170): círculo magenta de 38 px con flecha; área táctil de 44 px. */}
          <button
            type="button"
            onClick={avanzar}
            aria-label={ultimo ? t("Empezar con Peekito") : t("Continuar")}
            className="grid size-11 place-items-center rounded-full focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco"
          >
            <span className="grid size-[38px] place-items-center rounded-[19px] bg-[var(--pekito-acento)]">
              <img
                src="/brand/laboratorio/agente/pekito-flecha.svg"
                alt=""
                aria-hidden="true"
                width={9.20635}
                height={9.1943}
                className="block size-[9.2px] rotate-45"
              />
            </span>
          </button>
          {ultimo && <span className="-mt-3 text-sm font-semibold">{t("Empezar")}</span>}
        </div>
      </div>
    </dialog>
  );
}
