import {
  ArrowRight,
  ClipboardList,
  FileSearch,
  FolderOpen,
  HeartHandshake,
  LifeBuoy,
  ListChecks,
  Map as MapIcon,
  Megaphone,
  Palette,
  Search,
  Store,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { AyudaInmediata } from "@/components/ayuda/AyudaInmediata";
import { ButtonLink, cx } from "@/design-system";
import { extraerFolio } from "@/domain/folios";
import type { AccionSugerida, IntencionDetectada } from "@/types";
import { accionesComplementarias, rutaDeAccion, TEXTO_INTENCION, unirAcciones, type TipoIntencion } from "../lib/acciones";
import { AyudaRequisitos } from "./AyudaRequisitos";
import { ConsultaFolio } from "./ConsultaFolio";
import { FUENTE_MONO_ROTULO } from "../lib/tipografia";

const ICONO_INTENCION: Record<TipoIntencion, LucideIcon> = {
  reportar: Megaphone,
  requisitos: ListChecks,
  consultar_folio: FileSearch,
  apoyo_psicologico: HeartHandshake,
  ayuda_inmediata: LifeBuoy,
  negocio: Store,
  cultura: Palette,
  mapa: MapIcon,
  pago: Wallet,
  expediente: FolderOpen,
  general: Search,
};

const ICONO_ACCION: Record<AccionSugerida["tipo"], LucideIcon> = {
  abrir_servicio: ArrowRight,
  mostrar_requisitos: ListChecks,
  abrir_formulario: Megaphone,
  consultar_gestion: ClipboardList,
  abrir_mapa: MapIcon,
  abrir_ruta: ArrowRight,
};

export interface PanelIntencionProps {
  consulta: string;
  intencion: IntencionDetectada;
}

/**
 * «Lo que entendí»: la intención detectada (reglas locales, sin IA) con acciones concretas que abren
 * pantallas internas. La persona decide; nada se ejecuta solo.
 */
export function PanelIntencion({ consulta, intencion }: PanelIntencionProps) {
  const tipo = intencion.intencion;
  const texto = TEXTO_INTENCION[tipo];
  const Icono = ICONO_INTENCION[tipo];
  const acciones = unirAcciones(intencion.acciones, accionesComplementarias(tipo));
  const urgente = tipo === "ayuda_inmediata";
  // Violencia → Línea Mujer primero; riesgo personal → líneas de salud mental primero (siempre tras el 911).
  const enfoque = intencion.acciones.some((accion) => rutaDeAccion(accion).startsWith("/bienestar/linea-mujer")) ? "violencia" : "salud_mental";

  return (
    <section
      aria-labelledby="titulo-intencion"
      data-intencion={tipo}
      data-guia="busqueda.intencion"
      className={cx(
        "rounded-[2rem] border p-5 sm:p-7",
        urgente ? "border-peligro/30 bg-peligro-suave" : "border-borde bg-superficie shadow-suave",
      )}
    >
      <p className={cx("text-xs font-medium tracking-[0.12em] text-tinta-suave uppercase", FUENTE_MONO_ROTULO)}>Lo que entendí</p>
      <div className="mt-2 flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cx(
            "inline-flex size-12 shrink-0 items-center justify-center rounded-[17.5%]",
            urgente ? "bg-peligro text-white" : "bg-azul text-white",
          )}
        >
          <Icono className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 id="titulo-intencion" className="text-xl leading-snug font-semibold text-marino sm:text-2xl">
            {texto.titulo}
          </h2>
          <p className="mt-1 text-[0.9375rem] text-tinta-suave sm:text-base">{texto.descripcion}</p>
        </div>
      </div>

      {urgente ? <AyudaInmediata variante="tarjeta" nivelTitulo={3} enfoque={enfoque} guia="busqueda.ayuda_inmediata" className="mt-5" /> : null}
      {tipo === "apoyo_psicologico" ? (
        <div className="mt-5">
          <AyudaInmediata variante="boton" enfoque="salud_mental" guia="busqueda.ayuda_inmediata" />
        </div>
      ) : null}

      {acciones.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap" aria-label="Acciones sugeridas">
          {acciones.map((accion, indice) => (
            <li key={rutaDeAccion(accion)} className="min-w-0">
              <ButtonLink
                to={rutaDeAccion(accion)}
                variante={indice === 0 && !urgente ? "primario" : "secundario"}
                iconoInicio={ICONO_ACCION[accion.tipo]}
                data-guia={`busqueda.accion_${indice + 1}`}
                data-accion={accion.tipo}
                className="h-auto w-full py-2.5 text-left sm:w-auto"
              >
                {accion.etiqueta}
              </ButtonLink>
            </li>
          ))}
        </ul>
      ) : null}

      {tipo === "consultar_folio" ? (
        <div className="mt-6 border-t border-borde pt-5">
          <ConsultaFolio valorInicial={extraerFolio(consulta) ?? ""} />
        </div>
      ) : null}

      {tipo === "requisitos" ? (
        <div className="mt-6 border-t border-borde pt-5">
          <AyudaRequisitos />
        </div>
      ) : null}

      <p className="mt-5 text-sm text-tinta-suave">Interpretación automática para orientarte dentro de la app. Si no es lo que buscabas, revisa las fichas de abajo o escribe con otras palabras.</p>
    </section>
  );
}
