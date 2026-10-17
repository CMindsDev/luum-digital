import { ExternalLink } from "lucide-react";
import { Fragment } from "react";
import { Link } from "react-router";
import { Card, LoadingState, cx, formatearFecha } from "@/design-system";
import { useBusquedaInteligente } from "@/services/hooks";
import { SugerenciasBusqueda } from "./SugerenciasBusqueda";
import { FUENTE_MONO_ROTULO } from "../lib/tipografia";

const MARCADOR_CITA = /\[(\d+)\]/g;
const MAXIMO_EXTRACTO = 220;

export interface RespuestaInteligenteProps {
  consulta: string;
}

function resumirTexto(texto: string, maximo = MAXIMO_EXTRACTO): string {
  const compacto = texto.replace(/\s+/g, " ").trim();
  if (compacto.length <= maximo) return compacto;
  const recorte = compacto.slice(0, maximo + 1);
  const ultimoEspacio = recorte.lastIndexOf(" ");
  const base = (ultimoEspacio >= maximo * 0.6 ? recorte.slice(0, ultimoEspacio) : recorte.slice(0, maximo)).trim();
  return `${base}…`;
}

function idFuente(numero: number): string {
  return `busqueda-fuente-${numero}`;
}

function fechaLegible(fecha?: string): string | null {
  if (!fecha) return null;
  return formatearFecha(fecha, "media");
}

function TextoConFuentes({
  respuesta,
  numerosDisponibles,
}: {
  respuesta: string;
  numerosDisponibles: ReadonlySet<number>;
}) {
  const partes = respuesta.split(/\n+/).filter(Boolean);

  const enfocarFuente = (numero: number) => {
    const destino = document.getElementById(idFuente(numero));
    if (!(destino instanceof HTMLElement)) return;
    if (typeof destino.scrollIntoView === "function") destino.scrollIntoView({ block: "nearest" });
    destino.focus();
  };

  return (
    <div className="space-y-3 text-[0.9375rem] leading-7 text-tinta sm:text-base">
      {partes.map((parte, indice) => {
        const segmentos = parte.split(MARCADOR_CITA);
        return (
          <p key={`${indice}-${parte.slice(0, 32)}`}>
            {segmentos.map((segmento, posicion) => {
              const esMarcador = posicion % 2 === 1;
              if (!esMarcador) return <Fragment key={`${indice}-${posicion}`}>{segmento}</Fragment>;
              const numero = Number(segmento);
              if (!Number.isInteger(numero) || !numerosDisponibles.has(numero)) {
                return <Fragment key={`${indice}-${posicion}`}>[{segmento}]</Fragment>;
              }
              return (
                <button
                  key={`${indice}-${posicion}`}
                  type="button"
                  onClick={() => enfocarFuente(numero)}
                  aria-label={`Ir a la fuente ${numero}`}
                  className="mx-0.5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-pildora border border-borde bg-superficie-2 px-2 text-sm font-semibold text-marino align-middle underline-offset-2 hover:border-azul hover:bg-azul-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lima-logo"
                >
                  [{numero}]
                </button>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}

export function RespuestaInteligente({ consulta }: RespuestaInteligenteProps) {
  const busqueda = useBusquedaInteligente(consulta, { habilitada: true });

  if (!busqueda.habilitada) return null;

  if (busqueda.isPending) {
    return (
      <Card as="section" relleno="lg" aria-labelledby="titulo-respuesta-inteligente" aria-live="polite" aria-busy="true" data-guia="busqueda.respuesta">
        <h2 id="titulo-respuesta-inteligente" className="text-xl font-semibold text-marino sm:text-2xl">
          Respuesta de Pekito
        </h2>
        <div className="mt-4">
          <LoadingState etiqueta="Buscando información…" variante="compacto" />
          <div className="mt-4 space-y-3" aria-hidden="true">
            <div className="h-4 w-11/12 rounded-pildora bg-superficie-2 motion-safe:animate-pulse" />
            <div className="h-4 w-10/12 rounded-pildora bg-superficie-2 motion-safe:animate-pulse" />
            <div className="h-24 rounded-tarjeta bg-superficie-2 motion-safe:animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  const respuesta = busqueda.data;
  if (!respuesta) return null;

  const sinContenido = respuesta.respuesta === null && respuesta.pasajes.length === 0;
  if (sinContenido && respuesta.intencion.categoria !== "fuera_de_alcance") return null;

  const citasPorNumero = new Set(respuesta.citas.map((cita) => cita.n));
  const mostrarFueraDeAlcance = sinContenido && respuesta.intencion.categoria === "fuera_de_alcance";

  return (
    <Card as="section" relleno="lg" aria-labelledby="titulo-respuesta-inteligente" aria-live="polite" data-guia="busqueda.respuesta">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className={cx("text-xs font-medium tracking-[0.12em] text-tinta-suave uppercase", FUENTE_MONO_ROTULO)}>Orientación con fuentes</p>
          <h2 id="titulo-respuesta-inteligente" className="mt-1 text-xl font-semibold text-marino sm:text-2xl">
            Respuesta de Pekito
          </h2>
        </div>
        <p className="text-sm text-tinta-suave">Pekito puede equivocarse. Confirma los datos importantes con la fuente oficial.</p>
      </div>

      {mostrarFueraDeAlcance ? (
        <div className="mt-5 space-y-4">
          <p className="text-[0.9375rem] text-tinta sm:text-base">
            Eso queda fuera de lo que puedo ayudarte aquí. Prueba con un trámite, una dependencia o un reporte.
          </p>
          <SugerenciasBusqueda titulo="Prueba con" nivel={3} />
        </div>
      ) : null}

      {respuesta.respuesta ? (
        <div className="mt-5">
          <TextoConFuentes respuesta={respuesta.respuesta} numerosDisponibles={citasPorNumero} />
        </div>
      ) : null}

      {respuesta.citas.length > 0 ? (
        <section className="mt-6 border-t border-borde pt-5" aria-labelledby="titulo-fuentes" data-guia="busqueda.fuentes">
          <h3 id="titulo-fuentes" className="text-lg font-semibold text-marino">
            Fuentes
          </h3>
          <ol className="mt-3 space-y-3">
            {respuesta.citas.map((cita) => {
              const fecha = fechaLegible(cita.fechaConsulta);
              return (
                <li
                  key={cita.n}
                  id={idFuente(cita.n)}
                  tabIndex={-1}
                  className="rounded-tarjeta border border-borde bg-superficie-2 p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lima-logo"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-marino">
                        [{cita.n}] {cita.titulo}
                      </p>
                      {fecha ? <p className="mt-1 text-sm text-tinta-suave">Consultada el {fecha}.</p> : null}
                    </div>
                    <div className="flex min-w-0 flex-col gap-2 text-sm sm:items-end">
                      {cita.url ? (
                        <a
                          href={cita.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center gap-1 font-medium text-marino underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lima-logo"
                        >
                          <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
                          Abrir fuente oficial
                        </a>
                      ) : null}
                      {cita.url ? <span className="text-xs text-tinta-suave">Se abre en otra pestaña.</span> : null}
                      {cita.ruta ? (
                        <Link
                          to={cita.ruta}
                          className="inline-flex min-h-11 items-center font-medium text-marino underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lima-logo"
                        >
                          Ver ficha en la app
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {respuesta.pasajes.length > 0 ? (
        <section className="mt-6 border-t border-borde pt-5" aria-labelledby="titulo-relacionada">
          <h3 id="titulo-relacionada" className="text-lg font-semibold text-marino">
            Información relacionada
          </h3>
          <ul className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {respuesta.pasajes.slice(0, 3).map((pasaje) => {
              const fecha = fechaLegible(pasaje.fuente.fechaConsulta);
              return (
                <li key={pasaje.id} className="min-w-0">
                  <Card as="article" relleno="md" tono="suave" className="h-full">
                    <h4 className="text-base font-semibold text-marino">{pasaje.titulo}</h4>
                    <p className="mt-2 text-sm leading-6 text-tinta">{resumirTexto(pasaje.texto)}</p>
                    <p className="mt-3 text-sm text-tinta-suave">
                      {pasaje.fuente.titulo}
                      {fecha ? ` · Consultada el ${fecha}` : ""}
                    </p>
                    {pasaje.ruta ? (
                      <Link
                        to={pasaje.ruta}
                        className="mt-4 inline-flex min-h-11 items-center font-medium text-marino underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lima-logo"
                      >
                        Ver ficha en la app
                      </Link>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </Card>
  );
}
