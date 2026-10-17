import { FileQuestion, Footprints, ListChecks, MessagesSquare, NotebookText, ScrollText } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router";
import { EstadosServicio, textoCosto, useCategoria } from "@/components/catalogo";
import { useService } from "@/services/hooks";
import { ButtonLink, EmptyState, ErrorState, KeyValueList, LoadingState, PageHeader, type ParClaveValor } from "@/design-system";
import type { EstadoNavegacionAsistente } from "@/types";
import { AvisoPendiente } from "../components/AvisoPendiente";
import { ListaCanales } from "../components/ListaCanales";
import { ReferenciaOficial } from "../components/ReferenciaOficial";
import { SeccionFicha } from "../components/SeccionFicha";
import { SeccionPasos } from "../components/SeccionPasos";
import { SeccionRequisitos } from "../components/SeccionRequisitos";
import { TarjetaRecorrido } from "../components/TarjetaRecorrido";

function leerEnfoque(estado: unknown): EstadoNavegacionAsistente["enfocar"] {
  if (typeof estado !== "object" || estado === null) return undefined;
  const enfocar: unknown = Reflect.get(estado, "enfocar");
  return typeof enfocar === "string" ? enfocar : undefined;
}

export default function ServiceDetailPage() {
  const { t } = useTranslation();
  const { servicioId } = useParams();
  const location = useLocation();
  const { data: servicio, isPending, isError, error, refetch } = useService(servicioId);
  const categoria = useCategoria(servicio?.categoria);
  const requisitosRef = useRef<HTMLHeadingElement>(null);
  const enfocar = leerEnfoque(location.state);

  useEffect(() => {
    if (enfocar !== "requisitos" || !servicio) return;
    const temporizador = window.setTimeout(() => {
      requisitosRef.current?.focus();
      requisitosRef.current?.closest("section")?.scrollIntoView({ block: "start" });
    }, 200);
    return () => window.clearTimeout(temporizador);
  }, [enfocar, servicio]);

  if (isPending) return <LoadingState etiqueta={t("Cargando la ficha del servicio…")} />;
  if (isError) {
    return (
      <>
        <PageHeader titulo={t("Ficha del servicio")} regresar="/servicios" />
        <ErrorState error={error} onReintentar={() => void refetch()} />
      </>
    );
  }
  if (!servicio) {
    return (
      <>
        <PageHeader titulo={t("No encontramos este servicio")} regresar="/servicios" />
        <EmptyState
          icono={FileQuestion}
          titulo={t("El servicio no está en el catálogo del prototipo")}
          descripcion={t("Puede que el enlace esté incompleto o que la ficha ya no exista en la fuente. Búscalo por su nombre en el catálogo.")}
          accion={<ButtonLink to="/servicios">{t("Ir al catálogo")}</ButtonLink>}
        />
      </>
    );
  }

  const costo = textoCosto(servicio.costo);
  const datos: ParClaveValor[] = [
    servicio.dependencia ? { id: "dependencia", clave: t("Dependencia"), valor: servicio.dependencia } : null,
    { id: "modalidad", clave: t("Modalidad oficial"), valor: servicio.modalidadOficial ?? t("Pendiente de verificar") },
    { id: "costo", clave: t("Costo"), valor: costo ?? <span className="font-semibold text-aviso">{t("Pendiente de verificar")}</span> },
    {
      id: "tiempo",
      clave: t("Tiempo de respuesta"),
      valor: servicio.tiempoDeRespuesta ?? <span className="font-semibold text-aviso">{t("Pendiente de verificar")}</span>,
    },
    { id: "origen", clave: t("Dónde existe hoy"), valor: servicio.sistemaDeOrigen },
    servicio.clave ? { id: "clave", clave: t("Clave oficial"), valor: servicio.clave } : null,
  ].filter((par) => par !== null);

  return (
    <>
      <PageHeader
        regresar={categoria ? `/servicios/categoria/${categoria.id}` : "/servicios"}
        etiquetaRegresar={categoria ? t("Regresar a {{categoria}}", { categoria: categoria.nombre }) : t("Regresar al catálogo")}
        antetitulo={categoria?.nombre ?? t("Catálogo municipal")}
        titulo={servicio.nombre}
        descripcion={servicio.nombreCiudadano ? <>{t("También conocido como «{{nombre}}».", { nombre: servicio.nombreCiudadano })}</> : undefined}
      >
        <EstadosServicio servicio={servicio} conDescripcion />
      </PageHeader>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="order-2 flex min-w-0 flex-col gap-5 lg:order-1">
          <SeccionFicha id="acerca-del-servicio" titulo={t("Qué es")} icono={NotebookText}>
            <p className="text-tinta">{servicio.descripcion}</p>
            <KeyValueList items={datos} className="mt-5" />
            {servicio.costo?.tipo === "pendiente" || !servicio.costo ? (
              <p className="mt-4 text-sm text-tinta-suave">{t("No mostramos montos que no se hayan verificado: nunca se calculan ni se inventan.")}</p>
            ) : null}
          </SeccionFicha>

          <SeccionFicha id="requisitos" titulo={t("Requisitos")} icono={ListChecks} guia="servicios.requisitos" tituloRef={requisitosRef}>
            <SeccionRequisitos requisitos={servicio.requisitos} />
          </SeccionFicha>

          <SeccionFicha id="pasos" titulo={t("Pasos")} icono={Footprints}>
            <SeccionPasos pasos={servicio.pasos} />
          </SeccionFicha>

          <SeccionFicha id="canales" titulo={t("Canales de atención")} icono={MessagesSquare}>
            {servicio.canalesDeAtencion.length > 0 ? <ListaCanales canales={servicio.canalesDeAtencion} /> : <AvisoPendiente que={t("los canales de atención")} />}
          </SeccionFicha>

          {servicio.notas ? (
            <SeccionFicha id="notas" titulo={t("Notas de la fuente")} icono={ScrollText}>
              <p className="text-[0.9375rem] text-tinta">{servicio.notas}</p>
            </SeccionFicha>
          ) : null}

          <ReferenciaOficial servicio={servicio} />
        </div>

        <div className="order-1 flex flex-col gap-4 lg:sticky lg:top-[calc(var(--altura-encabezado)+1.5rem)] lg:order-2">
          <TarjetaRecorrido servicio={servicio} />
          <nav aria-label={t("En esta ficha")} className="hidden rounded-tarjeta border border-borde bg-superficie p-4 lg:block">
            <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase">{t("En esta ficha")}</p>
            <ul className="flex flex-col">
              {[
                ["acerca-del-servicio", t("Qué es")],
                ["requisitos", t("Requisitos")],
                ["pasos", t("Pasos")],
                ["canales", t("Canales de atención")],
              ].map(([ancla, texto]) => (
                <li key={ancla}>
                  <Link to={{ hash: `#${ancla}` }} className="flex min-h-11 items-center rounded-boton px-2 text-sm font-medium text-enlace hover:bg-marino-suave">
                    {texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
