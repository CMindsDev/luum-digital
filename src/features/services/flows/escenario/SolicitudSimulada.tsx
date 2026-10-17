import { PenLine, Send } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import type { EscenarioDemo, OpcionCampo } from "@/components/catalogo/datos-demo";
import { useSaveDraft, useSubmitProcedure } from "@/services/hooks";
import { Button, ErrorState, Stepper, notificar } from "@/design-system";
import type { Gestion, Servicio } from "@/types";
import { PasoCaptura } from "./PasoCaptura";
import { RevisionDatos } from "./RevisionDatos";
import { useFormularioEscenario } from "./useFormularioEscenario";
import { aDatosGestion, type DatosGestion } from "./valores";

export interface SolicitudSimuladaProps {
  servicio: Servicio;
  escenario: EscenarioDemo;
  borrador: Gestion | null;
  opciones?: Readonly<Record<string, readonly OpcionCampo[]>>;
  /** Títulos de los tres pasos (captura, revisión, folio). */
  pasos: readonly [string, string, string];
  textoEnviar: string;
  /** Aviso visible en la revisión (p. ej. «No es una cita confirmada»). */
  avisoRevision?: ReactNode;
  /**
   * Trabajo previo al envío (p. ej. la solicitud de cita simulada). Devuelve datos adicionales
   * que se guardan en la gestión. Debe ser idempotente: puede llamarse otra vez tras un error.
   */
  prepararEnvio?: (validados: Record<string, unknown>) => Promise<DatosGestion>;
}

/**
 * Recorrido genérico de solicitud simulada: captura → revisión → envío con folio DEMO-G.
 * Guarda borradores, revalida con zod, evita dobles envíos y lleva a la gestión al terminar.
 */
export function SolicitudSimulada({ servicio, escenario, borrador, opciones, pasos, textoEnviar, avisoRevision, prepararEnvio }: SolicitudSimuladaProps) {
  const navigate = useNavigate();
  const guardar = useSaveDraft();
  const enviar = useSubmitProcedure();
  const formulario = useFormularioEscenario(escenario, borrador);
  const [paso, setPaso] = useState<"captura" | "revision">("captura");
  const [gestionId, setGestionId] = useState<string | undefined>(borrador?.id);
  const [validados, setValidados] = useState<Record<string, unknown> | null>(null);
  const [preparando, setPreparando] = useState(false);
  const [errorPreparacion, setErrorPreparacion] = useState<unknown>(null);
  const tituloPasoRef = useRef<HTMLHeadingElement>(null);
  const pasoAnterior = useRef(paso);

  // Al cambiar de paso, el foco va al título del paso (no en la primera carga: ahí va al h1).
  useEffect(() => {
    if (pasoAnterior.current === paso) return;
    pasoAnterior.current = paso;
    tituloPasoRef.current?.focus();
  }, [paso]);

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
      notificar({ tono: "exito", titulo: "Borrador guardado", descripcion: "Lo encuentras en «Mis gestiones». Se guarda sólo en este navegador." });
    } catch {
      // El error se muestra con ErrorState (guardar.error).
    }
  };

  const enviarSolicitud = async () => {
    if (!validados) return;
    setErrorPreparacion(null);
    let extra: DatosGestion = {};
    if (prepararEnvio) {
      setPreparando(true);
      try {
        extra = await prepararEnvio(validados);
      } catch (error) {
        setErrorPreparacion(error);
        setPreparando(false);
        return;
      }
      setPreparando(false);
    }
    try {
      const gestion = await guardar.mutateAsync({
        ...(gestionId ? { id: gestionId } : {}),
        servicioId: servicio.id,
        tipo: servicio.tipoDeRecorrido,
        datos: { ...aDatosGestion(validados, escenario.campos), ...extra },
        camposReutilizados: formulario.reutilizados,
      });
      setGestionId(gestion.id);
      const enviada = await enviar.mutateAsync(gestion.id);
      notificar({
        tono: "exito",
        titulo: `Folio de demostración ${enviada.folio ?? ""}`.trim(),
        descripcion: "Gestión simulada enviada. No es un trámite oficial.",
      });
      navigate(`/gestiones/${encodeURIComponent(enviada.id)}`, { state: { recienEnviada: true } });
    } catch {
      // El error se muestra con ErrorState (guardar.error o enviar.error).
    }
  };

  const procesando = preparando || guardar.isPending || enviar.isPending;
  const errorEnvio = errorPreparacion ?? enviar.error ?? guardar.error;

  return (
    <div className="flex flex-col gap-5">
      <Stepper
        etiqueta="Pasos de la solicitud simulada"
        pasos={[
          { id: "captura", titulo: pasos[0] },
          { id: "revision", titulo: pasos[1] },
          { id: "folio", titulo: pasos[2] },
        ]}
        actual={paso === "captura" ? 0 : 1}
      />

      <section aria-labelledby="titulo-paso" className="rounded-tarjeta border border-borde bg-superficie p-4 shadow-suave sm:p-6">
        <h2 id="titulo-paso" ref={tituloPasoRef} tabIndex={-1} className="mb-1 text-xl font-semibold text-marino">
          {paso === "captura" ? escenario.titulo : "Revisa antes de enviar"}
        </h2>
        <p className="mb-5 text-sm font-medium text-aviso">{escenario.leyenda}</p>

        {errorEnvio ? (
          <ErrorState error={errorEnvio} nivel={3} titulo="No se completó la acción" className="mb-5" />
        ) : null}

        {paso === "captura" ? (
          <PasoCaptura
            escenario={escenario}
            formulario={formulario}
            opciones={opciones}
            textoContinuar="Revisar solicitud"
            onContinuar={(valores) => {
              setValidados(valores);
              setPaso("revision");
            }}
            onGuardarBorrador={() => void guardarBorrador()}
            guardando={guardar.isPending}
          />
        ) : (
          <div className="flex flex-col gap-5">
            <RevisionDatos
              campos={escenario.campos}
              valores={validados ?? formulario.form.getValues()}
              reutilizados={formulario.reutilizados}
              opciones={opciones}
            />
            {avisoRevision ? <div className="rounded-boton border border-borde bg-fondo p-4 text-[0.9375rem] text-tinta">{avisoRevision}</div> : null}
            <div className="flex flex-col-reverse gap-2.5 border-t border-borde pt-5 sm:flex-row sm:justify-end">
              <Button variante="secundario" iconoInicio={PenLine} onClick={() => setPaso("captura")} disabled={procesando} data-guia="servicios.corregir">
                Corregir datos
              </Button>
              <Button iconoInicio={Send} onClick={() => void enviarSolicitud()} cargando={procesando} textoCargando="Enviando…" data-guia="servicios.enviar">
                {textoEnviar}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
