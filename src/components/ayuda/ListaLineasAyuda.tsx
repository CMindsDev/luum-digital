import { Phone } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { clasesBoton, cx, ErrorState, LoadingState } from "@/design-system";
import { useHelpLines } from "@/services/hooks";
import { agruparLineas, hrefTelefono, NUMERO_EMERGENCIAS, type EnfoqueAyuda } from "./lineas";
import { LineaAyudaTarjeta } from "./LineaAyudaTarjeta";

export interface ListaLineasAyudaProps {
  enfoque?: EnfoqueAyuda;
  /** Sólo 911 y líneas de apoyo (sin otros contactos municipales). */
  compacta?: boolean;
  className?: string;
}

/**
 * Respaldo del 911 mientras cargan las líneas o si fallan: la ayuda inmediata nunca espera a los
 * datos ni a una conversación.
 */
function Respaldo911() {
  const { t } = useTranslation();
  return (
    <article className="rounded-tarjeta border border-peligro/40 bg-peligro-suave p-4">
      <h4 className="text-base font-semibold text-marino">{t("Emergencias 911")}</h4>
      <p className="mt-1 text-sm text-tinta">{t("Si tu vida o la de alguien más está en riesgo inmediato.")}</p>
      <a href={hrefTelefono(NUMERO_EMERGENCIAS)} className={clasesBoton({ variante: "peligro", anchoCompleto: true, className: "mt-3" })}>
        <Phone aria-hidden="true" className="size-[1.15em] shrink-0" />
        <span>
          {t("Llamar al 911")}<span className="sr-only"> {t("(Emergencias)")}</span>
        </span>
      </a>
    </article>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold tracking-[0.08em] text-tinta-suave uppercase">{titulo}</h3>
      {children}
    </section>
  );
}

/** Líneas de ayuda humana verificadas (useHelpLines): 911 primero, luego apoyo y otros contactos. */
export function ListaLineasAyuda({ enfoque = "general", compacta = false, className }: ListaLineasAyudaProps) {
  const { t } = useTranslation();
  const { data: lineas, isPending, isError, error, refetch } = useHelpLines();
  const grupos = lineas ? agruparLineas(lineas, enfoque) : null;

  return (
    <div className={cx("space-y-5", className)}>
      <Grupo titulo={t("Emergencias")}>
        {grupos && grupos.emergencias.length > 0 ? (
          grupos.emergencias.map((linea) => <LineaAyudaTarjeta key={linea.id} linea={linea} nivel={4} destacada />)
        ) : (
          <Respaldo911 />
        )}
      </Grupo>

      {isPending ? <LoadingState variante="compacto" etiqueta={t("Cargando las demás líneas de ayuda…")} /> : null}
      {isError ? (
        <ErrorState
          nivel={3}
          error={error}
          titulo={t("No se pudieron cargar las demás líneas")}
          descripcion={t("El 911 sigue disponible arriba. Puedes reintentar.")}
          onReintentar={() => void refetch()}
        />
      ) : null}

      {grupos && grupos.apoyo.length > 0 ? (
        <Grupo titulo={t("Líneas de apoyo")}>
          {grupos.apoyo.map((linea) => (
            <LineaAyudaTarjeta key={linea.id} linea={linea} nivel={4} />
          ))}
        </Grupo>
      ) : null}

      {grupos && !compacta && grupos.otras.length > 0 ? (
        <Grupo titulo={t("Otros contactos municipales")}>
          {grupos.otras.map((linea) => (
            <LineaAyudaTarjeta key={linea.id} linea={linea} nivel={4} />
          ))}
        </Grupo>
      ) : null}
    </div>
  );
}
