import { Footprints, LayoutGrid, ListChecks, Megaphone, MessagesSquare } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AyudaInmediata } from "@/components/ayuda/AyudaInmediata";
import { Checkbox } from "@/design-system";
import { IconoSaludBienestar } from "@/design-system/components/IconoSaludBienestar";
import { AvisoPendiente } from "../components/AvisoPendiente";
import { ListaCanales } from "../components/ListaCanales";
import { ReferenciaOficial } from "../components/ReferenciaOficial";
import { SeccionFicha } from "../components/SeccionFicha";
import { SeccionPasos } from "../components/SeccionPasos";
import { nombreModulo, rutaEnOtroModulo } from "../lib/modulos";
import { PuenteModulo } from "./PuenteModulo";
import type { FlowProps } from "./tipos";

export function InformationalFlow({ servicio }: FlowProps) {
  const { t } = useTranslation();
  const [listos, setListos] = useState<ReadonlySet<number>>(() => new Set());
  const enOtroModulo = rutaEnOtroModulo(servicio.rutaInterna);
  const enfoqueAyuda = servicio.rutaInterna.startsWith("/bienestar/salud-mental")
    ? "salud_mental"
    : servicio.rutaInterna.startsWith("/bienestar/linea-mujer")
      ? "violencia"
      : null;

  const alternar = (indice: number, marcado: boolean) =>
    setListos((actuales) => {
      const siguientes = new Set(actuales);
      if (marcado) siguientes.add(indice);
      else siguientes.delete(indice);
      return siguientes;
    });

  return (
    <div className="flex flex-col gap-5">
      {enOtroModulo ? (
        <PuenteModulo
          icono={servicio.rutaInterna.startsWith("/bienestar") ? IconoSaludBienestar : servicio.rutaInterna.startsWith("/reportes") ? Megaphone : LayoutGrid}
          titulo={t("Este servicio está en {{modulo}}", { modulo: nombreModulo(servicio.rutaInterna) })}
          descripcion={t("Ahí encuentras la información completa y sus canales, dentro de la misma app.")}
          ruta={servicio.rutaInterna}
          textoBoton={t("Ir a {{modulo}}", { modulo: nombreModulo(servicio.rutaInterna) })}
          guia="servicios.ir_modulo"
        >
          {enfoqueAyuda ? <AyudaInmediata enfoque={enfoqueAyuda} /> : null}
        </PuenteModulo>
      ) : null}

      <SeccionFicha
        id="preparar"
        titulo={t("Prepara tu gestión")}
        icono={ListChecks}
        descripcion={t("Marca lo que ya tienes. Esta lista es sólo para ti: no se guarda ni se envía.")}
      >
        {servicio.requisitos === null ? (
          <AvisoPendiente que={t("la lista de requisitos")} />
        ) : servicio.requisitos.length === 0 ? (
          <p className="text-tinta">{t("La fuente no publica requisitos para este servicio.")}</p>
        ) : (
          <fieldset>
            <legend className="sr-only">{t("Requisitos que ya tienes")}</legend>
            <div className="flex flex-col divide-y divide-borde">
              {servicio.requisitos.map((requisito, indice) => (
                <Checkbox
                  key={`${requisito.nombre}-${indice}`}
                  etiqueta={requisito.nombre}
                  descripcion={[requisito.presentacion, requisito.descripcion].filter(Boolean).join(" · ") || undefined}
                  checked={listos.has(indice)}
                  onChange={(evento) => alternar(indice, evento.target.checked)}
                  className="py-1"
                />
              ))}
            </div>
            <p aria-live="polite" className="mt-3 text-sm font-semibold text-tinta">
              {t("Tienes {{listos}} de {{total}} requisitos.", { listos: listos.size, total: servicio.requisitos.length })}
            </p>
          </fieldset>
        )}
      </SeccionFicha>

      <SeccionFicha id="como-hacerlo" titulo={t("Cómo hacerlo")} icono={Footprints}>
        {servicio.modalidadOficial ? (
          <p className="mb-4 text-tinta">
            {t("Modalidad publicada:")} <strong className="font-semibold">{servicio.modalidadOficial}</strong>
          </p>
        ) : null}
        <SeccionPasos pasos={servicio.pasos} />
      </SeccionFicha>

      <SeccionFicha id="donde" titulo={t("Dónde te atienden")} icono={MessagesSquare}>
        {servicio.canalesDeAtencion.length > 0 ? <ListaCanales canales={servicio.canalesDeAtencion} /> : <AvisoPendiente que={t("los canales de atención")} />}
      </SeccionFicha>

      <ReferenciaOficial servicio={servicio} />
    </div>
  );
}
