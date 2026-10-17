import { ArrowRight, CircleCheck, CircleX, CreditCard, PenLine, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { EscenarioDemo } from "@/components/catalogo/datos-demo";
import { useSaveDraft, useSimulatePayment, useSubmitProcedure } from "@/services/hooks";
import { Button, ButtonLink, DemoTag, ErrorState, KeyValueList, RadioCardGroup, Stepper, notificar } from "@/design-system";
import type { Gestion, PagoDemo, Servicio } from "@/types";
import { CargadorEscenario } from "./escenario/CargadorEscenario";
import { PasoCaptura } from "./escenario/PasoCaptura";
import { useFormularioEscenario } from "./escenario/useFormularioEscenario";
import { aDatosGestion, valorParaMostrar } from "./escenario/valores";
import type { FlowProps } from "./tipos";

const FORMATO_MONTO = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

type ResultadoElegido = "aprobado" | "rechazado";

function esMetodo(valor: unknown): valor is PagoDemo["metodo"] {
  return valor === "tarjeta_demo" || valor === "referencia_demo";
}

export function PaymentFlow({ servicio }: FlowProps) {
  return (
    <CargadorEscenario servicio={servicio}>
      {(escenario, borrador) => <PagoSimulado servicio={servicio} escenario={escenario} borrador={borrador} />}
    </CargadorEscenario>
  );
}

function PagoSimulado({ servicio, escenario, borrador }: { servicio: Servicio; escenario: EscenarioDemo; borrador: Gestion | null }) {
  const { t } = useTranslation();
  const guardar = useSaveDraft();
  const pagar = useSimulatePayment();
  const enviar = useSubmitProcedure();
  const formulario = useFormularioEscenario(escenario, borrador);
  const [paso, setPaso] = useState<"captura" | "pago" | "resultado">("captura");
  const [validados, setValidados] = useState<Record<string, unknown> | null>(null);
  const [resultadoElegido, setResultadoElegido] = useState<ResultadoElegido>("aprobado");
  const [gestionId, setGestionId] = useState<string | undefined>(borrador?.id);
  const [resultado, setResultado] = useState<{ pago: PagoDemo; gestion: Gestion } | null>(null);
  const tituloPasoRef = useRef<HTMLHeadingElement>(null);
  const pasoAnterior = useRef(paso);

  useEffect(() => {
    if (pasoAnterior.current === paso) return;
    pasoAnterior.current = paso;
    tituloPasoRef.current?.focus();
  }, [paso]);

  const monto = escenario.monto ?? { montoDemo: 0, concepto: "Concepto de ejemplo", leyenda: "Monto ficticio de demostración" as const };
  const metodoCapturado = validados?.metodo;
  const metodo = esMetodo(metodoCapturado) ? metodoCapturado : "referencia_demo";
  const campoMetodo = escenario.campos.find((campo) => campo.nombre === "metodo");
  const procesando = guardar.isPending || pagar.isPending || enviar.isPending;
  const errorPago = pagar.error ?? enviar.error ?? guardar.error;

  const guardarBorrador = async () => {
    try {
      const gestion = await guardar.mutateAsync({
        ...(gestionId ? { id: gestionId } : {}),
        servicioId: servicio.id,
        tipo: servicio.tipoDeRecorrido,
        datos: aDatosGestion(formulario.form.getValues(), escenario.campos),
        camposReutilizados: formulario.reutilizados,
      });
      setGestionId(gestion.id);
      notificar({ tono: "exito", titulo: t("Borrador guardado"), descripcion: t("Lo encuentras en «Mis gestiones». Se guarda sólo en este navegador.") });
    } catch {
      // Se muestra con ErrorState.
    }
  };

  const simularPago = async () => {
    if (!validados) return;
    try {
      const gestion = await guardar.mutateAsync({
        ...(gestionId ? { id: gestionId } : {}),
        servicioId: servicio.id,
        tipo: servicio.tipoDeRecorrido,
        datos: { ...aDatosGestion(validados, escenario.campos), conceptoPago: monto.concepto, montoDemo: monto.montoDemo },
        camposReutilizados: formulario.reutilizados,
      });
      setGestionId(gestion.id);
      const pago = await pagar.mutateAsync({
        gestionId: gestion.id,
        concepto: monto.concepto,
        montoDemo: monto.montoDemo,
        metodo,
        resultado: resultadoElegido,
      });
      if (pago.estado === "simulado_aprobado") {
        const enviada = await enviar.mutateAsync(gestion.id);
        setResultado({ pago, gestion: enviada });
        notificar({ tono: "exito", titulo: t("Pago simulado aprobado"), descripcion: t("Referencia {{referencia}}. No se cobró nada.", { referencia: pago.referencia }) });
      } else {
        setResultado({ pago, gestion });
      }
      setPaso("resultado");
    } catch {
      // Se muestra con ErrorState.
    }
  };

  const titulos = { captura: t(escenario.titulo), pago: t("Confirma el pago simulado"), resultado: t("Pago simulado") } as const;

  return (
    <div className="flex flex-col gap-5">
      <Stepper
        etiqueta={t("Pasos del pago simulado")}
        pasos={[
          { id: "captura", titulo: t("Tus datos") },
          { id: "pago", titulo: t("Pago simulado") },
          { id: "resultado", titulo: t("Resultado") },
        ]}
        actual={paso === "captura" ? 0 : paso === "pago" ? 1 : 2}
      />

      <section aria-labelledby="titulo-paso" className="rounded-tarjeta border border-borde bg-superficie p-4 shadow-suave sm:p-6">
        <h2 id="titulo-paso" ref={tituloPasoRef} tabIndex={-1} className="mb-1 text-xl font-semibold text-marino">
          {titulos[paso]}
        </h2>
        <p className="mb-5 text-sm font-medium text-aviso">{t(escenario.leyenda)}</p>

        {errorPago && paso !== "resultado" ? <ErrorState error={errorPago} nivel={3} titulo={t("No se completó la acción")} className="mb-5" /> : null}

        {paso === "captura" ? (
          <PasoCaptura
            escenario={escenario}
            formulario={formulario}
            textoContinuar={t("Continuar al pago simulado")}
            onContinuar={(valores) => {
              setValidados(valores);
              setPaso("pago");
            }}
            onGuardarBorrador={() => void guardarBorrador()}
            guardando={guardar.isPending}
          />
        ) : null}

        {paso === "pago" ? (
          <div className="flex flex-col gap-5">
            <KeyValueList
              items={[
                { id: "concepto", clave: t("Concepto"), valor: t(monto.concepto) },
                {
                  id: "monto",
                  clave: t("Monto"),
                  valor: (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold text-marino">{FORMATO_MONTO.format(monto.montoDemo)}</span>
                      <DemoTag>{t(monto.leyenda)}</DemoTag>
                    </span>
                  ),
                },
                {
                  id: "metodo",
                  clave: t("Método"),
                  valor: campoMetodo ? valorParaMostrar(campoMetodo, metodo) : metodo,
                },
              ]}
            />

            <div className="rounded-boton border border-ambar bg-aviso-suave p-4">
              <p className="flex items-center gap-2 font-semibold text-tinta">
                <CreditCard aria-hidden="true" className="size-5 text-aviso" />
                {t("Datos de prueba (visibles a propósito)")}
              </p>
              {metodo === "tarjeta_demo" ? (
                <p className="mt-1 text-[0.9375rem] text-tinta">
                  {t("Se usa la tarjeta de demostración ")}
                  <strong className="font-semibold">DEMO •••• 0000</strong>
                  {t(". Este recorrido no tiene campos para tarjetas: nunca escribas datos de una tarjeta real.")}
                </p>
              ) : (
                <p className="mt-1 text-[0.9375rem] text-tinta">
                  {t("Se genera una referencia de demostración ")}
                  <strong className="font-semibold">DEMO-P-…</strong>
                  {t(" al simular. No sirve para pagar en ningún banco ni tienda.")}
                </p>
              )}
            </div>

            <RadioCardGroup<ResultadoElegido>
              leyenda={t("¿Qué resultado quieres simular?")}
              ayuda={t("Así puedes ver cómo se vería un pago aprobado o uno rechazado.")}
              valor={resultadoElegido}
              onCambiar={setResultadoElegido}
              columnas={2}
              guia="servicios.resultado_pago"
              opciones={[
                { valor: "aprobado", etiqueta: t("Pago aprobado (simulado)"), icono: CircleCheck },
                { valor: "rechazado", etiqueta: t("Pago rechazado (simulado)"), icono: CircleX },
              ]}
            />

            <div className="flex flex-col-reverse gap-2.5 border-t border-borde pt-5 sm:flex-row sm:justify-end">
              <Button variante="secundario" iconoInicio={PenLine} onClick={() => setPaso("captura")} disabled={procesando}>
                {t("Corregir datos")}
              </Button>
              <Button iconoFin={ArrowRight} onClick={() => void simularPago()} cargando={procesando} textoCargando={t("Simulando…")} data-guia="servicios.simular_pago">
                {t("Simular pago")}
              </Button>
            </div>
          </div>
        ) : null}

        {paso === "resultado" && resultado ? (
          <div className="flex flex-col gap-5">
            {resultado.pago.estado === "simulado_aprobado" ? (
              <div role="status" className="flex items-start gap-3 rounded-boton border border-exito/25 bg-exito-suave p-4">
                <CircleCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-exito" />
                <div>
                  <p className="text-lg font-semibold text-exito">{t("Pago simulado aprobado")}</p>
                  <p className="text-[0.9375rem] text-tinta">{t("No se cobró nada. Esto no es un recibo ni un comprobante fiscal.")}</p>
                </div>
              </div>
            ) : (
              <div role="status" className="flex items-start gap-3 rounded-boton border border-peligro/25 bg-peligro-suave p-4">
                <CircleX aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-peligro" />
                <div>
                  <p className="text-lg font-semibold text-peligro">{t("Pago simulado rechazado")}</p>
                  <p className="text-[0.9375rem] text-tinta">{t("Así se vería un rechazo. No se cobró nada; tu gestión sigue como borrador.")}</p>
                </div>
              </div>
            )}
            <KeyValueList
              items={[
                { id: "leyenda", clave: t("Tipo"), valor: resultado.pago.leyenda },
                { id: "referencia", clave: t("Referencia de demostración"), valor: resultado.pago.referencia },
                resultado.gestion.folio ? { id: "folio", clave: t("Folio de la gestión"), valor: resultado.gestion.folio } : null,
                { id: "concepto", clave: t("Concepto"), valor: resultado.pago.concepto },
                { id: "monto", clave: t("Monto ficticio"), valor: FORMATO_MONTO.format(resultado.pago.montoDemo) },
              ].filter((par) => par !== null)}
            />
            <div className="flex flex-col-reverse gap-2.5 border-t border-borde pt-5 sm:flex-row sm:justify-end">
              {resultado.pago.estado === "simulado_rechazado" ? (
                <Button variante="secundario" iconoInicio={RotateCcw} onClick={() => setPaso("pago")}>
                  {t("Intentar de nuevo")}
                </Button>
              ) : null}
              <ButtonLink to={`/gestiones/${encodeURIComponent(resultado.gestion.id)}`} iconoFin={ArrowRight} data-guia="servicios.ver_gestion">
                {t("Ver en Mis gestiones")}
              </ButtonLink>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
