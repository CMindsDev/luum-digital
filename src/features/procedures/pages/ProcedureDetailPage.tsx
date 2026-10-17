import { BookUser, CalendarClock, CircleCheck, ClipboardList, CreditCard, FileText, History, PenLine, XCircle, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router";
import { escenarioIdPara, useEscenarioDemo } from "@/components/catalogo/datos-demo";
import { ETIQUETA_TIPO_RECORRIDO, rutaFicha, rutaRecorrido } from "@/components/catalogo";
import { valorParaMostrar } from "@/components/catalogo/mostrar-valor";
import { useCancelProcedure, useProcedure, useService } from "@/services/hooks";
import {
  Button,
  ButtonLink,
  Card,
  ConfirmDialog,
  DemoTag,
  EmptyState,
  ErrorState,
  KeyValueList,
  LoadingState,
  PageHeader,
  Timeline,
  formatearFecha,
  formatearFechaHora,
  notificar,
  type ParClaveValor,
} from "@/design-system";
import type { Gestion } from "@/types";
import { EstadoGestionBadge } from "../components/EstadoGestionBadge";
import { CLAVES_SECCION_PROPIA, etiquetaDato, referenciaPago, textoDato } from "../lib/datos";
import { ETIQUETA_ACTOR, ETIQUETA_ESTADO_GESTION, ICONO_ESTADO_GESTION, TONO_ESTADO_GESTION, sePuedeCancelar } from "../lib/estados";

const FORMATO_MONTO = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

function recienEnviada(estado: unknown): boolean {
  return typeof estado === "object" && estado !== null && Reflect.get(estado, "recienEnviada") === true;
}

function Seccion({ id, titulo, icono: Icono, children }: { id: string; titulo: string; icono: LucideIcon; children: ReactNode }) {
  return (
    <Card as="section" aria-labelledby={id} relleno="lg">
      <h2 id={id} className="mb-4 flex items-center gap-2.5 text-lg font-semibold text-marino">
        <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-boton bg-azul-suave text-azul">
          <Icono className="size-5" />
        </span>
        {titulo}
      </h2>
      {children}
    </Card>
  );
}

export default function ProcedureDetailPage() {
  const { t } = useTranslation();
  const { gestionId } = useParams();
  const location = useLocation();
  const { data: gestion, isPending, isError, error, refetch } = useProcedure(gestionId);

  if (isPending) return <LoadingState etiqueta={t("Cargando la gestión…")} />;
  if (isError) {
    return (
      <>
        <PageHeader titulo={t("Detalle de la gestión")} regresar="/gestiones" />
        <ErrorState error={error} onReintentar={() => void refetch()} />
      </>
    );
  }
  if (!gestion) {
    return (
      <>
        <PageHeader titulo={t("No encontramos esta gestión")} regresar="/gestiones" />
        <EmptyState
          icono={ClipboardList}
          titulo={t("La gestión no existe en esta identidad de demostración")}
          descripcion={t("Puede pertenecer a otra identidad ficticia o haberse borrado al restablecer la demostración.")}
          accion={<ButtonLink to="/gestiones">{t("Ir a Mis gestiones")}</ButtonLink>}
        />
      </>
    );
  }
  return <DetalleGestion gestion={gestion} recienEnviada={recienEnviada(location.state)} />;
}

function DetalleGestion({ gestion, recienEnviada: mostrarExito }: { gestion: Gestion; recienEnviada: boolean }) {
  const { t } = useTranslation();
  const servicio = useService(gestion.servicioId);
  const escenario = useEscenarioDemo(escenarioIdPara(gestion.tipo, servicio.data?.recorridoDemoId));
  const cancelar = useCancelProcedure();
  const [confirmando, setConfirmando] = useState(false);

  const campos = escenario.data?.campos ?? [];
  const datosCapturados: ParClaveValor[] = Object.entries(gestion.datos)
    .filter(([clave]) => !CLAVES_SECCION_PROPIA.has(clave))
    .map(([clave, valor]) => {
      const campo = campos.find((c) => c.nombre === clave);
      const texto = campo ? valorParaMostrar(campo, valor) : textoDato(valor);
      return {
        id: clave,
        clave: etiquetaDato(clave, escenario.data),
        valor: (
          <span className="flex flex-wrap items-center gap-2">
            <span>{texto}</span>
            {gestion.camposReutilizados.includes(clave) ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-exito">
                <BookUser aria-hidden="true" className="size-4" />
                {t("De tu expediente")}
              </span>
            ) : null}
          </span>
        ),
      };
    });

  const pago = referenciaPago(gestion);
  const montoDemo = gestion.datos.montoDemo;
  const conPago = Boolean(gestion.pagoId) || typeof montoDemo === "number";
  const referenciaCita = gestion.datos.referenciaCita;

  const eventos = gestion.historial.map((evento, indice) => ({
    id: `${evento.fecha}-${indice}`,
    titulo: t(ETIQUETA_ESTADO_GESTION[evento.estado]),
    fecha: evento.fecha,
    icono: ICONO_ESTADO_GESTION[evento.estado],
    tono: TONO_ESTADO_GESTION[evento.estado],
    actual: indice === gestion.historial.length - 1,
    descripcion: (
      <>
        <p>{evento.descripcion}</p>
        <p className="text-sm text-tinta-suave">{t(ETIQUETA_ACTOR[evento.actor])}</p>
      </>
    ),
  }));

  const confirmarCancelacion = async () => {
    try {
      await cancelar.mutateAsync(gestion.id);
      setConfirmando(false);
      notificar({ tono: "info", titulo: t("Gestión cancelada"), descripcion: t("Quedó registrada como cancelada en tu historial de demostración.") });
    } catch {
      // El error se muestra dentro del diálogo.
    }
  };

  return (
    <>
      {mostrarExito && gestion.folio ? (
        <div role="status" className="mb-5 flex items-start gap-3 rounded-tarjeta border border-exito/25 bg-exito-suave p-4 sm:p-5">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-7 shrink-0 text-exito" />
          <div>
            <p className="text-sm font-semibold text-exito">{t("Tu folio de demostración es")}</p>
            <p className="text-2xl font-semibold tracking-[0.03em] text-marino" data-folio={gestion.folio}>
              {gestion.folio}
            </p>
            <p className="mt-1 text-[0.9375rem] text-tinta">{t("Dale seguimiento aquí, en «Mis gestiones». No tiene validez oficial.")}</p>
          </div>
        </div>
      ) : null}

      <PageHeader regresar="/gestiones" etiquetaRegresar={t("Regresar a Mis gestiones")} antetitulo={t("Gestión simulada")} titulo={gestion.servicioNombre}>
        <p className="flex flex-wrap items-center gap-2">
          <EstadoGestionBadge estado={gestion.estado} tamano="md" />
          <span className="text-base font-semibold tracking-[0.03em] text-tinta">{gestion.folio ?? t("Sin folio (borrador)")}</span>
          <DemoTag>{t("Simulación")}</DemoTag>
        </p>
      </PageHeader>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <Seccion id="titulo-resumen" titulo={t("Resumen")} icono={FileText}>
            <KeyValueList
              items={[
                { id: "folio", clave: t("Folio"), valor: gestion.folio ?? t("Se asigna al enviar") },
                { id: "estado", clave: t("Estado"), valor: t(ETIQUETA_ESTADO_GESTION[gestion.estado]) },
                { id: "tipo", clave: t("Recorrido"), valor: t(ETIQUETA_TIPO_RECORRIDO[gestion.tipo]) },
                {
                  id: "servicio",
                  clave: t("Servicio"),
                  valor: (
                    <Link to={rutaFicha(gestion.servicioId)} className="font-semibold text-enlace underline underline-offset-2">
                      {t("Ver la ficha del servicio")}
                    </Link>
                  ),
                },
                { id: "creada", clave: t("Creada"), valor: formatearFechaHora(gestion.creadaEn) },
                gestion.enviadaEn ? { id: "enviada", clave: t("Enviada"), valor: formatearFechaHora(gestion.enviadaEn) } : null,
                { id: "actualizada", clave: t("Última actualización"), valor: formatearFechaHora(gestion.actualizadaEn) },
              ].filter((par) => par !== null)}
            />
          </Seccion>

          <Seccion id="titulo-historial" titulo={t("Historial")} icono={History}>
            <Timeline eventos={eventos} etiqueta={t("Historial de la gestión")} />
          </Seccion>

          <Seccion id="titulo-datos" titulo={t("Datos capturados")} icono={ClipboardList}>
            {datosCapturados.length > 0 ? <KeyValueList items={datosCapturados} /> : <p className="text-tinta">{t("Aún no hay datos capturados.")}</p>}
            <p className="mt-4 text-sm text-tinta-suave">{t("Son datos ficticios guardados sólo en este navegador.")}</p>
          </Seccion>

          {gestion.camposReutilizados.length > 0 ? (
            <Seccion id="titulo-reutilizados" titulo={t("Datos de tu expediente")} icono={BookUser}>
              <p className="text-tinta">{t("Copiaste estos datos de tu Expediente Digital de ejemplo, con tu confirmación:")}</p>
              <ul className="mt-2 list-disc pl-5 text-tinta">
                {gestion.camposReutilizados.map((clave) => (
                  <li key={clave}>{etiquetaDato(clave, escenario.data)}</li>
                ))}
              </ul>
            </Seccion>
          ) : null}

          {conPago ? (
            <Seccion id="titulo-pago" titulo={t("Pago simulado")} icono={CreditCard}>
              <KeyValueList
                items={[
                  { id: "tipo", clave: t("Tipo"), valor: t("Pago simulado") },
                  pago ? { id: "referencia", clave: t("Referencia de demostración"), valor: pago.referencia } : null,
                  pago ? { id: "resultado", clave: t("Resultado"), valor: pago.aprobado ? t("Aprobado (simulado)") : t("Rechazado (simulado)") } : null,
                  typeof gestion.datos.conceptoPago === "string" ? { id: "concepto", clave: t("Concepto"), valor: gestion.datos.conceptoPago } : null,
                  typeof montoDemo === "number" ? { id: "monto", clave: t("Monto ficticio"), valor: FORMATO_MONTO.format(montoDemo) } : null,
                ].filter((par) => par !== null)}
              />
              <p className="mt-4 text-sm font-semibold text-tinta">{t("No se cobró nada. Esto no es un recibo ni un comprobante fiscal.")}</p>
            </Seccion>
          ) : null}

          {typeof referenciaCita === "string" ? (
            <Seccion id="titulo-cita" titulo={t("Solicitud de cita simulada")} icono={CalendarClock}>
              <KeyValueList
                items={[
                  { id: "referencia", clave: t("Referencia de demostración"), valor: referenciaCita },
                  { id: "sede", clave: t("Sede"), valor: textoDato(gestion.datos.sede ?? null) },
                  {
                    id: "fecha",
                    clave: t("Fecha solicitada"),
                    valor: typeof gestion.datos.fecha === "string" ? formatearFecha(gestion.datos.fecha, "larga") : t("Sin capturar"),
                  },
                  { id: "hora", clave: t("Horario de ejemplo"), valor: textoDato(gestion.datos.hora ?? null) },
                ]}
              />
              <p className="mt-4 text-sm font-semibold text-tinta">{t("No es una cita confirmada: nadie recibió la solicitud y no se reservó ningún lugar.")}</p>
            </Seccion>
          ) : null}
        </div>

        <Card as="aside" aria-labelledby="titulo-acciones" relleno="lg" className="lg:sticky lg:top-[calc(var(--altura-encabezado)+1.5rem)]">
          <h2 id="titulo-acciones" className="text-lg font-semibold text-marino">
            {t("Acciones")}
          </h2>
          <div className="mt-4 flex flex-col gap-2.5">
            {gestion.estado === "borrador" ? (
              <ButtonLink to={`${rutaRecorrido(gestion.servicioId)}?borrador=${encodeURIComponent(gestion.id)}`} iconoInicio={PenLine} anchoCompleto data-guia="gestiones.continuar">
                {t("Continuar borrador")}
              </ButtonLink>
            ) : null}
            {sePuedeCancelar(gestion) ? (
              <Button variante="secundario" iconoInicio={XCircle} anchoCompleto onClick={() => setConfirmando(true)} data-guia="gestiones.cancelar">
                {t("Cancelar gestión")}
              </Button>
            ) : (
              <p className="text-sm text-tinta-suave">{gestion.estado === "cancelada" ? t("Esta gestión está cancelada.") : t("Una gestión resuelta ya no se puede cancelar.")}</p>
            )}
            <ButtonLink to="/gestiones" variante="fantasma" anchoCompleto>
              {t("Ver todas mis gestiones")}
            </ButtonLink>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        abierto={confirmando}
        onCerrar={() => {
          setConfirmando(false);
          cancelar.reset();
        }}
        onConfirmar={() => void confirmarCancelacion()}
        titulo={t("¿Cancelar esta gestión?")}
        descripcion={t("Quedará como cancelada en tu historial de demostración. Es una simulación: no cancela ningún trámite oficial.")}
        textoConfirmar={t("Sí, cancelar")}
        textoCancelar={t("No, conservar")}
        tono="peligro"
        cargando={cancelar.isPending}
      >
        {cancelar.isError ? <ErrorState error={cancelar.error} nivel={3} /> : null}
      </ConfirmDialog>
    </>
  );
}
