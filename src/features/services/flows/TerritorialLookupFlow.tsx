import { Ban, FlaskConical, MapPinned, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { msg } from "@/i18n";
import { ReferenciaOficial } from "../components/ReferenciaOficial";
import { PuenteModulo } from "./PuenteModulo";
import type { FlowProps } from "./tipos";

const CAPAS = [
  { id: "demo", icono: FlaskConical, titulo: msg("Incidencias de demostración"), texto: msg("Reportes ficticios del prototipo, rotulados como demostración.") },
  { id: "verificadas", icono: ShieldCheck, titulo: msg("Ubicaciones verificadas"), texto: msg("Lugares de atención con fuente oficial y fecha de consulta.") },
  {
    id: "oficial",
    icono: Ban,
    titulo: msg("Información territorial oficial: ninguna capa autorizada"),
    texto: msg("No mostramos límites catastrales, claves ni usos de suelo: nunca se inventan."),
  },
] as const;

export function TerritorialLookupFlow({ servicio }: FlowProps) {
  const { t } = useTranslation();
  const ruta = servicio.rutaInterna === "/mapa" ? "/mapa" : `/mapa?servicio=${encodeURIComponent(servicio.id)}`;
  return (
    <div className="flex flex-col gap-5">
      <PuenteModulo
        icono={MapPinned}
        titulo={t("Consulta en el Visor Urbano del prototipo")}
        descripcion={t("Abre el mapa de la app con este servicio como contexto. Si el mapa no carga, la lista y los formularios siguen funcionando.")}
        ruta={ruta}
        textoBoton={t("Abrir el Visor Urbano")}
        guia="servicios.ir_mapa"
      >
        <h3 className="mb-2 text-base font-semibold text-marino">{t("Qué verás (capas separadas)")}</h3>
        <ul className="flex flex-col gap-2.5">
          {CAPAS.map((capa) => (
            <li key={capa.id} className="flex items-start gap-3 rounded-boton border border-borde bg-fondo px-3.5 py-3">
              <capa.icono aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" />
              <div>
                <p className="font-semibold text-tinta">{t(capa.titulo)}</p>
                <p className="text-sm text-tinta-suave">{t(capa.texto)}</p>
              </div>
            </li>
          ))}
        </ul>
      </PuenteModulo>
      <ReferenciaOficial servicio={servicio} />
    </div>
  );
}
