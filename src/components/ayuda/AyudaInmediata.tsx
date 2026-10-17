import { LifeBuoy, Phone } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, clasesBoton, cx, Sheet, type TamanoBoton } from "@/design-system";
import { hrefTelefono, NUMERO_EMERGENCIAS, type EnfoqueAyuda } from "./lineas";
import { ListaLineasAyuda } from "./ListaLineasAyuda";

export interface AyudaInmediataProps {
  /** boton: botón destacado que abre la hoja · tarjeta: tarjeta con 911 directo y acceso a todas las líneas. */
  variante?: "boton" | "tarjeta";
  /** Orden de las líneas después del 911. */
  enfoque?: EnfoqueAyuda;
  /** Identificador para el asistente (data-guia). Por omisión «ayuda.inmediata». */
  guia?: string;
  /** Control externo de la hoja (p. ej. abrirla ante palabras de riesgo). Si no se da, se controla sola. */
  abierto?: boolean;
  onAbiertoChange?: (abierto: boolean) => void;
  /** Nivel del título de la tarjeta. */
  nivelTitulo?: 2 | 3;
  /** Ocupa todo el ancho (variante botón). */
  anchoCompleto?: boolean;
  /** Tamaño del botón (variante botón); todos miden al menos 44 px de alto. */
  tamano?: TamanoBoton;
  className?: string;
}

/**
 * Ayuda inmediata: abre una hoja con el 911 primero y las líneas de ayuda humana verificadas
 * (useHelpLines), con enlaces tel: que la persona toca de forma explícita. Funciona sin completar
 * ninguna conversación. No simula que se activó un equipo de emergencia ni promete respuesta continua.
 */
export function AyudaInmediata({
  variante = "boton",
  enfoque = "general",
  guia = "ayuda.inmediata",
  abierto,
  onAbiertoChange,
  nivelTitulo = 2,
  anchoCompleto = false,
  tamano = "md",
  className,
}: AyudaInmediataProps) {
  const { t } = useTranslation();
  const [abiertoInterno, setAbiertoInterno] = useState(false);
  const controlado = abierto !== undefined;
  const hojaAbierta = controlado ? abierto : abiertoInterno;
  const cambiar = (valor: boolean) => {
    if (!controlado) setAbiertoInterno(valor);
    onAbiertoChange?.(valor);
  };

  const hoja = (
    <Sheet
      abierto={hojaAbierta}
      onCerrar={() => cambiar(false)}
      titulo={t("Ayuda inmediata")}
      descripcion={t("Si tu vida o la de alguien más está en riesgo, llama al 911. Estas líneas las atienden personas.")}
    >
      <div className="space-y-5">
        <ListaLineasAyuda enfoque={enfoque} />
        <div className="rounded-tarjeta bg-superficie-2 px-4 py-3 text-sm text-tinta">
          <p>
            {t("Llamar abre la app de teléfono de tu dispositivo. Este prototipo no llama por ti, no avisa a nadie, no comparte tu ubicación y no registra la llamada.")}
          </p>
          <p className="mt-1.5">{t("Horarios: sólo se muestran los que publica la fuente oficial.")}</p>
        </div>
      </div>
    </Sheet>
  );

  if (variante === "tarjeta") {
    const Titulo = nivelTitulo === 2 ? "h2" : "h3";
    return (
      <section className={cx("rounded-tarjeta border-2 border-peligro/30 bg-superficie p-4 shadow-suave sm:p-5", className)}>
        <div className="flex items-start gap-3">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-boton bg-peligro-suave text-peligro">
            <LifeBuoy aria-hidden="true" className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <Titulo className="text-lg font-semibold text-marino">{t("¿Necesitas ayuda ahora?")}</Titulo>
            <p className="mt-1 text-[0.9375rem] text-tinta-suave">
              {t("No tienes que llenar nada ni conversar primero. Si estás en peligro, llama al 911.")}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a href={hrefTelefono(NUMERO_EMERGENCIAS)} className={clasesBoton({ variante: "peligro", className: "sm:flex-1" })}>
            <Phone aria-hidden="true" className="size-[1.15em] shrink-0" />
            <span>
              {t("Llamar al 911")}<span className="sr-only"> {t("(Emergencias)")}</span>
            </span>
          </a>
          <Button variante="secundario" iconoInicio={LifeBuoy} onClick={() => cambiar(true)} data-guia={guia} className="sm:flex-1">
            {t("Ver líneas de ayuda")}
          </Button>
        </div>
        {hoja}
      </section>
    );
  }

  return (
    <>
      <Button
        variante="peligro"
        iconoInicio={LifeBuoy}
        onClick={() => cambiar(true)}
        data-guia={guia}
        aria-haspopup="dialog"
        anchoCompleto={anchoCompleto}
        tamano={tamano}
        className={className}
      >
        {t("Ayuda inmediata")}
      </Button>
      {hoja}
    </>
  );
}
