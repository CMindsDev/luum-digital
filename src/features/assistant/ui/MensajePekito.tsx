import { ExternalLink, FileText, Mic } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cx, formatearFecha, InfoStatusBadge } from "@/design-system";
import type { FuenteCitada } from "@/services/contracts";
import type { MensajeConversacion } from "../runtime/store";
import { PekitoMascota } from "./PekitoMascota";

export interface MensajePekitoProps {
  mensaje: MensajeConversacion;
  /** Abre una ruta interna (p. ej. la ficha citada) y cede la pantalla. */
  onIrA: (ruta: string) => void;
}

const VINETA = /^\s*(?:[-•*]|\d+[.)])\s+(.*)$/;

/** Texto con saltos de línea y viñetas simples. Nunca interpreta HTML. */
function TextoPekito({ texto }: { texto: string }) {
  const bloques: Array<{ tipo: "parrafo"; texto: string } | { tipo: "lista"; elementos: string[]; ordenada: boolean }> = [];
  for (const linea of texto.split("\n")) {
    const vineta = VINETA.exec(linea);
    if (vineta) {
      const ordenada = /^\s*\d/.test(linea);
      const ultimo = bloques.at(-1);
      if (ultimo?.tipo === "lista" && ultimo.ordenada === ordenada) ultimo.elementos.push(vineta[1] ?? "");
      else bloques.push({ tipo: "lista", elementos: [vineta[1] ?? ""], ordenada });
    } else if (linea.trim()) {
      bloques.push({ tipo: "parrafo", texto: linea.trim() });
    }
  }
  return (
    <div className="space-y-2">
      {bloques.map((bloque, indice) => {
        if (bloque.tipo === "parrafo") return <p key={indice}>{bloque.texto}</p>;
        const Lista = bloque.ordenada ? "ol" : "ul";
        return (
          <Lista key={indice} className={cx("space-y-1 pl-5", bloque.ordenada ? "list-decimal" : "list-disc")}>
            {bloque.elementos.map((elemento, i) => (
              <li key={i}>{elemento}</li>
            ))}
          </Lista>
        );
      })}
    </div>
  );
}

function Fuentes({ fuentes, onIrA }: { fuentes: FuenteCitada[]; onIrA: (ruta: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="mt-3 rounded-[16px] bg-(--pk-superficie) p-3 shadow-[inset_0_0_0_1px_var(--pk-borde)]">
      <p className="pekito-rotulo text-[0.75rem] text-(--pk-texto-suave)">{t("Fuentes citadas")}</p>
      <ul className="mt-2 space-y-3">
        {fuentes.map((fuente, indice) => (
          <li key={`${fuente.titulo}-${indice}`} className="text-sm">
            {fuente.url ? (
              <a
                href={fuente.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-1 font-semibold text-(--pk-lima) underline underline-offset-2"
              >
                <span>{fuente.titulo}</span>
                <ExternalLink aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                <span className="sr-only">{t(" (se abre en otra pestaña)")}</span>
              </a>
            ) : (
              <span className="font-semibold">{fuente.titulo}</span>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-(--pk-texto-suave)">
              {fuente.estadoDeInformacion ? <InfoStatusBadge estado={fuente.estadoDeInformacion} /> : null}
              {fuente.fechaConsulta ? <span>{t("Consultada el {{fecha}}", { fecha: formatearFecha(fuente.fechaConsulta) })}</span> : null}
              {fuente.ruta ? (
                <button
                  type="button"
                  onClick={() => onIrA(fuente.ruta ?? "/")}
                  className="inline-flex min-h-11 items-center gap-1 rounded-pildora px-2 font-semibold text-(--pk-texto) underline underline-offset-2"
                >
                  <FileText aria-hidden="true" className="size-4" />
                  {t("Ver ficha en la app")}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Un turno del hilo: la persona a la derecha (píldora lima); Pekito a la izquierda, con fuentes. */
export function MensajePekito({ mensaje, onIrA }: MensajePekitoProps) {
  const { t } = useTranslation();
  if (mensaje.rol === "persona") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-[22px] rounded-br-md bg-(--pk-lima) px-4 py-2.5 text-[0.9375rem] leading-snug text-(--pk-noche)">
          <span className="sr-only">{mensaje.origen === "voz" ? t("Tú (por voz): ") : t("Tú: ")}</span>
          {mensaje.origen === "voz" ? <Mic aria-hidden="true" className="mr-1 inline size-3.5 align-[-2px]" /> : null}
          <span className="whitespace-pre-line">{mensaje.texto}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5" aria-busy={mensaje.pendiente || undefined}>
      <PekitoMascota ancho={28} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 text-[0.9375rem] leading-relaxed text-(--pk-texto)">
        <span className="sr-only">{t("Pekito: ")}</span>
        <TextoPekito texto={mensaje.texto} />
        {mensaje.fuentes && mensaje.fuentes.length > 0 ? <Fuentes fuentes={mensaje.fuentes} onIrA={onIrA} /> : null}
      </div>
    </div>
  );
}
