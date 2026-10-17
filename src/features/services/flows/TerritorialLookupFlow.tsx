import { Ban, FlaskConical, MapPinned, ShieldCheck } from "lucide-react";
import { ReferenciaOficial } from "../components/ReferenciaOficial";
import { PuenteModulo } from "./PuenteModulo";
import type { FlowProps } from "./tipos";

const CAPAS = [
  { id: "demo", icono: FlaskConical, titulo: "Incidencias de demostración", texto: "Reportes ficticios del prototipo, rotulados como demostración." },
  { id: "verificadas", icono: ShieldCheck, titulo: "Ubicaciones verificadas", texto: "Lugares de atención con fuente oficial y fecha de consulta." },
  {
    id: "oficial",
    icono: Ban,
    titulo: "Información territorial oficial: ninguna capa autorizada",
    texto: "No mostramos límites catastrales, claves ni usos de suelo: nunca se inventan.",
  },
] as const;

/**
 * Recorrido «consulta territorial»: lleva al Visor Urbano interno (/mapa) con el servicio como
 * contexto. Las capas se muestran separadas y rotuladas; no hay información catastral oficial.
 */
export function TerritorialLookupFlow({ servicio }: FlowProps) {
  const ruta = servicio.rutaInterna === "/mapa" ? "/mapa" : `/mapa?servicio=${encodeURIComponent(servicio.id)}`;
  return (
    <div className="flex flex-col gap-5">
      <PuenteModulo
        icono={MapPinned}
        titulo="Consulta en el Visor Urbano del prototipo"
        descripcion="Abre el mapa de la app con este servicio como contexto. Si el mapa no carga, la lista y los formularios siguen funcionando."
        ruta={ruta}
        textoBoton="Abrir el Visor Urbano"
        guia="servicios.ir_mapa"
      >
        <h3 className="mb-2 text-base font-semibold text-marino">Qué verás (capas separadas)</h3>
        <ul className="flex flex-col gap-2.5">
          {CAPAS.map((capa) => (
            <li key={capa.id} className="flex items-start gap-3 rounded-boton border border-borde bg-fondo px-3.5 py-3">
              <capa.icono aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" />
              <div>
                <p className="font-semibold text-tinta">{capa.titulo}</p>
                <p className="text-sm text-tinta-suave">{capa.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </PuenteModulo>
      <ReferenciaOficial servicio={servicio} />
    </div>
  );
}
