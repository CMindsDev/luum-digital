import { CircleAlert, LifeBuoy, ShieldCheck, Trash2, X } from "lucide-react";
import { useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { ListaLineasAyuda } from "@/components/ayuda/ListaLineasAyuda";
import { Button, Checkbox, DemoTag, Switch } from "@/design-system";
import { ENTRADAS_BIENESTAR } from "@/features/assistant/providers";
import type { MotivoApoyo } from "@/features/assistant/runtime";
import type { EstadoAcompanante } from "../hooks/useAcompanante";
import { ROTULO_ACOMPANANTE } from "../textos";
import { CompositorAcompanante } from "./CompositorAcompanante";
import { MensajesAcompanante } from "./MensajesAcompanante";
import { PresenciaCalma } from "./PresenciaCalma";

export interface AcompananteProps {
  acompanante: EstadoAcompanante;
  /** Motivo de riesgo detectado: muestra la ayuda humana dentro de la conversación. */
  alertaRiesgo: MotivoApoyo | null;
  onAbrirAyuda: () => void;
  onDescartarAlerta: () => void;
  compositorRef?: Ref<HTMLTextAreaElement>;
}

/**
 * Acompañante opcional de salud mental: conversación de demostración (escenarios programados del
 * ámbito «bienestar»), figura calmada que se puede ocultar, privacidad visible y «Borrar conversación».
 * Sin diagnóstico, prescripción, cuestionarios, puntuaciones, rachas ni recompensas.
 */
export function Acompanante({ acompanante, alertaRiesgo, onAbrirAyuda, onDescartarAlerta, compositorRef }: AcompananteProps) {
  const { t } = useTranslation();
  const [figuraVisible, setFiguraVisible] = useState(true);
  const [consentimientoIa, setConsentimientoIa] = useState(false);
  const [avisoBorrado, setAvisoBorrado] = useState(false);
  const { mensajes, estadoSesion, avisos, etiquetaModo, modo } = acompanante;
  const pensando = estadoSesion === "pensando" || estadoSesion === "conectando";

  const borrar = () => {
    acompanante.borrar();
    onDescartarAlerta();
    setAvisoBorrado(true);
  };

  const enviar = (texto: string) => {
    setAvisoBorrado(false);
    void acompanante.enviar(texto);
  };

  return (
    <section id="acompanante" aria-labelledby="acompanante-titulo" className="space-y-4 rounded-tarjeta border border-borde bg-crema p-4 sm:p-6">
      <div className="flex items-start gap-4">
        {figuraVisible ? <PresenciaCalma tamano={56} /> : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="acompanante-titulo" tabIndex={-1} className="text-xl font-semibold text-marino">
              {t("Acompañante de demostración")}
            </h2>
            <DemoTag>{t("Simulación")}</DemoTag>
          </div>
          <p className="mt-1 text-[0.9375rem] font-medium text-tinta">{t(ROTULO_ACOMPANANTE)}</p>
          <p className="mt-1 text-sm text-tinta-suave">
            {t(
              "Es opcional. No diagnostica, no receta, no aplica cuestionarios ni da puntuaciones. Si estás en peligro, no esperes a la conversación: usa «Ayuda inmediata».",
            )}
          </p>
        </div>
      </div>

      <Switch
        activado={figuraVisible}
        onCambiar={setFiguraVisible}
        etiqueta={t("Mostrar la figura del acompañante")}
        descripcion={t("Si la ocultas, la conversación sigue sólo con texto.")}
        guia="salud_mental.figura_acompanante"
      />

      <div className="flex items-start gap-2 rounded-tarjeta bg-superficie-2 px-4 py-3 text-sm text-tinta">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-exito" />
        <p>
          {t(
            "Esta conversación vive sólo en la memoria de esta pestaña: no se guarda, no va a analítica, a la URL, al asistente general ni a tu expediente. Desaparece al recargar, al salir de esta pantalla o con «Borrar conversación».",
          )}
        </p>
      </div>

      {alertaRiesgo ? (
        <div role="alert" className="space-y-3 rounded-tarjeta border-2 border-peligro/40 bg-superficie p-4">
          <div className="flex items-start gap-2">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-peligro" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-peligro">{t("Lo más importante ahora es hablar con una persona.")}</p>
              <p className="mt-0.5 text-sm text-tinta">
                {t("Estas líneas las atienden personas. No tienes que explicar nada aquí para llamar.")}
              </p>
            </div>
            <Button variante="fantasma" tamano="sm" iconoInicio={X} onClick={onDescartarAlerta} aria-label={t("Ocultar este aviso de ayuda")}>
              {t("Ocultar")}
            </Button>
          </div>
          <ListaLineasAyuda enfoque={alertaRiesgo === "violencia" ? "violencia" : "salud_mental"} compacta />
          <Button variante="peligro" iconoInicio={LifeBuoy} onClick={onAbrirAyuda} anchoCompleto>
            {t("Ver todas las líneas de ayuda")}
          </Button>
        </div>
      ) : null}

      {mensajes.length === 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-tinta">{t("Puedes empezar con:")}</p>
          <ul className="flex flex-wrap gap-2">
            {ENTRADAS_BIENESTAR.map((entrada) => (
              <li key={entrada}>
                <button
                  type="button"
                  onClick={() => enviar(entrada)}
                  disabled={pensando}
                  className="min-h-11 rounded-pildora border border-borde bg-superficie px-4 text-sm font-medium text-marino hover:border-marino disabled:opacity-55"
                >
                  {t(entrada)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <MensajesAcompanante mensajes={mensajes} pensando={pensando} />

      {avisos.map((aviso) => (
        <div key={aviso.id} role="status" className="flex items-start gap-2 rounded-tarjeta border border-ambar bg-aviso-suave px-4 py-3 text-sm">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-aviso" />
          <p className="min-w-0 flex-1 text-tinta">
            <strong className="font-semibold text-aviso">{t("{{titulo}}.", { titulo: t(aviso.titulo ?? "") })} </strong>
            {aviso.detalle ? t(aviso.detalle) : null}
          </p>
          <Button variante="fantasma" tamano="sm" onClick={() => acompanante.descartarAviso(aviso.id)}>
            {t("Cerrar")}
          </Button>
        </div>
      ))}

      <CompositorAcompanante ref={compositorRef} onEnviar={enviar} ocupado={pensando} />

      <div className="flex flex-col gap-3 border-t border-borde pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-tinta-suave">
          {t("Modo:")} <span className="font-semibold text-tinta">{t(etiquetaModo ?? "")}</span>
        </p>
        <Button variante="secundario" tamano="sm" iconoInicio={Trash2} onClick={borrar} data-guia="salud_mental.borrar_conversacion">
          {t("Borrar conversación")}
        </Button>
      </div>
      <p role="status" className="text-sm text-exito">
        {avisoBorrado ? t("Conversación borrada de la memoria de esta pestaña.") : ""}
      </p>

      {acompanante.iaRealDisponible ? (
        modo === "openai_realtime" ? (
          <div className="space-y-2 rounded-tarjeta border border-borde bg-superficie p-4 text-sm">
            <p className="text-tinta">{t("Estás usando IA real con tu consentimiento. Tus mensajes se envían a un proveedor externo de IA.")}</p>
            <Button variante="secundario" tamano="sm" onClick={acompanante.usarRespuestasProgramadas}>
              {t("Volver a respuestas programadas (borra la conversación)")}
            </Button>
          </div>
        ) : (
          <div className="space-y-2 rounded-tarjeta border border-borde bg-superficie p-4 text-sm">
            <Checkbox
              checked={consentimientoIa}
              onChange={(evento) => setConsentimientoIa(evento.target.checked)}
              etiqueta={t("Acepto usar IA real en esta conversación")}
              descripcion={t(
                "Mis mensajes se enviarán a un proveedor externo de IA para generar respuestas. Sigue sin ser una persona profesional y no diagnostica. Se empieza una conversación nueva.",
              )}
            />
            <Button variante="secundario" tamano="sm" disabled={!consentimientoIa} onClick={acompanante.usarIaReal}>
              {t("Usar IA real")}
            </Button>
          </div>
        )
      ) : (
        <p className="text-sm text-tinta-suave">{t("En Bienestar este prototipo usa sólo respuestas programadas: no hay IA real conectada.")}</p>
      )}
    </section>
  );
}
