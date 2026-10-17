import { ArrowLeft, ArrowLeftRight, Trash2, X } from "lucide-react";
import { useId, useRef, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { cx, TEXTO_ROTULO_DEMO } from "@/design-system";
import { useAsistenteStore } from "../runtime/store";
import type { Pekito } from "../useControladorPekito";
import type { AccionAviso } from "./AvisoPekito";
import { ConversacionPekito } from "./ConversacionPekito";
import { EtiquetaModoPekito } from "./EtiquetaModoPekito";
import { etiquetaDeModo } from "./etiqueta-modo";
import { usePekitoUI } from "./estado-pekito";
import { LanzadorPekito } from "./LanzadorPekito";
import { LlamadaPekito } from "./LlamadaPekito";
import { PekitoMascota } from "./PekitoMascota";
import { CONSULTA_TARJETA, useMediaQuery } from "./useMediaQuery";
import { useEstadoMascota } from "./useEstadoMascota";
import { usePanelDialogo } from "./usePanelDialogo";

export interface PanelPekitoProps {
  pekito: Pekito;
  /** Dónde devolver el foco al cerrar si el control que lo abrió ya no existe. */
  retornoRespaldo: RefObject<HTMLElement | null>;
}

/** Estable entre renders: el compositor la usa como dependencia de un efecto. */
const consumirEnfoque = () => usePekitoUI.getState().consumirEnfoque();

const CLASE_ICONO_ENCABEZADO =
  "grid size-11 shrink-0 place-items-center rounded-full text-(--pk-texto-suave) hover:bg-(--pk-chip) hover:text-(--pk-texto)";

/**
 * Panel de Pekito sobre un <dialog>: pantalla completa y modal en teléfono y tableta; tarjeta no
 * modal desde 800 px (la página sigue usable). Contiene el lanzador «Por texto o por voz», el chat y
 * la llamada de voz, con el tema noche del asistente. Escape cierra y el foco vuelve a la mascota.
 */
export default function PanelPekito({ pekito, retornoRespaldo }: PanelPekitoProps) {
  const { t } = useTranslation();
  const { controlador, servidor, proveedor, repetirNavegacion } = pekito;
  const navigate = useNavigate();
  const abierto = usePekitoUI((estado) => estado.abierto);
  const vistaGuardada = usePekitoUI((estado) => estado.vista);
  const lado = usePekitoUI((estado) => estado.lado);
  const borrador = usePekitoUI((estado) => estado.borrador);
  const enfoquePendiente = usePekitoUI((estado) => estado.enfoquePendiente);
  const estadoSesion = useAsistenteStore("general", (estado) => estado.estadoSesion);
  const vozActiva = useAsistenteStore("general", (estado) => estado.vozActiva);
  const hayMensajes = useAsistenteStore("general", (estado) => estado.mensajes.length > 0);
  const [silenciadoPedido, setSilenciado] = useState(false);
  const [conectandoVoz, setConectandoVoz] = useState(false);
  const estadoMascota = useEstadoMascota({ silenciado: silenciadoPedido });
  const modal = !useMediaQuery(CONSULTA_TARJETA);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const idTitulo = useId();

  const vista = vistaGuardada === "llamada" && !vozActiva ? "chat" : vistaGuardada;
  const silenciado = silenciadoPedido && vozActiva;
  const etiqueta = etiquetaDeModo(proveedor, estadoSesion);
  const vozDisponible = proveedor === "realtime" && servidor.realtime !== null;

  const cerrar = () => usePekitoUI.getState().cerrar();
  const { dialogoRef, manejarTeclado } = usePanelDialogo({ abierto, modal, onCerrar: cerrar, enfocarAlAbrir: tituloRef, retornoRespaldo });

  const enviar = (texto: string) => {
    usePekitoUI.getState().cambiarBorrador("");
    void controlador.enviarTexto(texto);
  };

  const hablar = async () => {
    if (conectandoVoz) return;
    setConectandoVoz(true);
    try {
      if (await controlador.iniciarVoz()) {
        setSilenciado(false);
        usePekitoUI.getState().cambiarVista("llamada");
      }
    } finally {
      setConectandoVoz(false);
    }
  };

  const colgar = () => {
    controlador.detenerVoz();
    setSilenciado(false);
    usePekitoUI.getState().cambiarVista("chat");
  };

  const silenciar = () => {
    const siguiente = !silenciado;
    if (controlador.silenciarVoz(siguiente)) setSilenciado(siguiente);
  };

  const escribir = () => {
    const estado = usePekitoUI.getState();
    estado.cambiarVista("chat");
    estado.pedirEnfoque();
  };

  const alAccionAviso = (accion: AccionAviso) => {
    const estado = usePekitoUI.getState();
    if (accion === "escribir") {
      if (vozActiva) colgar();
      estado.cambiarVista("chat");
      estado.pedirEnfoque();
    } else if (accion === "activar_audio") {
      void controlador.iniciarVoz();
    } else {
      // «Reintentar» y «Reconectar»: se descarta la sesión caída; el siguiente mensaje abre otra.
      for (const aviso of controlador.store.getState().avisos) controlador.store.getState().descartarAviso(aviso.id);
      void controlador.reconectar();
    }
  };

  const borrar = () => {
    controlador.cerrar();
    setSilenciado(false);
    usePekitoUI.getState().reiniciarConversacion();
  };

  const revisar = (llamadaId: string) => {
    repetirNavegacion(llamadaId);
    cerrar();
  };

  const irA = (ruta: string) => {
    cerrar();
    void navigate(ruta);
  };

  const enLlamada = vista === "llamada";

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby={idTitulo}
      onKeyDown={manejarTeclado}
      data-asistente-ui
      data-lado={lado}
      data-guia="asistente.panel"
      className={cx(
        "pekito pekito-noche m-0 flex-col overflow-hidden p-0 open:flex",
        modal
          ? "h-dvh max-h-none w-full max-w-none backdrop:bg-black/60"
          : "pekito-panel-flotante z-50 rounded-[22px] shadow-flotante ring-1 ring-(--pk-borde)",
      )}
    >
      {abierto ? (
        <>
          <header className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 sm:px-5">
            <div className="flex items-center gap-2">
              {vista === "chat" && !vozActiva ? (
                <button
                  type="button"
                  onClick={() => usePekitoUI.getState().cambiarVista("lanzador")}
                  aria-label={t("Volver a «Por texto o por voz»")}
                  data-guia="asistente.volver"
                  className={`${CLASE_ICONO_ENCABEZADO} -ml-2`}
                >
                  <ArrowLeft aria-hidden="true" className="size-5" />
                </button>
              ) : (
                <PekitoMascota ancho={34} estado={estadoMascota} className="shrink-0" />
              )}
              <h2
                id={idTitulo}
                ref={tituloRef}
                tabIndex={-1}
                className="pekito-marca min-w-0 flex-1 text-lg leading-tight font-normal tracking-[0.02em] text-(--pk-texto) outline-none"
              >
                PEKITO
              </h2>
              <button
                type="button"
                onClick={() => usePekitoUI.getState().moverA(lado === "derecha" ? "izquierda" : "derecha")}
                aria-label={lado === "derecha" ? t("Mover Pekito al lado izquierdo") : t("Mover Pekito al lado derecho")}
                data-guia="asistente.mover"
                className={CLASE_ICONO_ENCABEZADO}
              >
                <ArrowLeftRight aria-hidden="true" className="size-5" />
              </button>
              {hayMensajes ? (
                <button type="button" onClick={borrar} aria-label={t("Borrar conversación")} data-guia="asistente.borrar" className={CLASE_ICONO_ENCABEZADO}>
                  <Trash2 aria-hidden="true" className="size-5" />
                </button>
              ) : null}
              <button type="button" onClick={cerrar} aria-label={t("Cerrar Pekito")} data-guia="asistente.cerrar" className={`${CLASE_ICONO_ENCABEZADO} -mr-2`}>
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <EtiquetaModoPekito etiqueta={etiqueta} oscuro className="mt-1" />
            <p className="pekito-rotulo mt-2 text-[0.6875rem] leading-snug text-(--pk-texto-suave)">{t(TEXTO_ROTULO_DEMO)}</p>
          </header>

          {vista === "lanzador" ? (
            <LanzadorPekito
              servidor={servidor}
              onHablar={() => void hablar()}
              onEscribir={escribir}
              onVerBienvenida={() => usePekitoUI.getState().abrirBienvenida()}
              onAccionAviso={alAccionAviso}
              conectando={conectandoVoz}
            />
          ) : enLlamada ? (
            <LlamadaPekito silenciado={silenciado} onSilenciar={silenciar} onColgar={colgar} onAccionAviso={alAccionAviso} />
          ) : (
            <ConversacionPekito
              borrador={borrador}
              onCambiarBorrador={(texto) => usePekitoUI.getState().cambiarBorrador(texto)}
              onSugerencia={(texto) => usePekitoUI.getState().prellenar(texto)}
              onEnviar={enviar}
              onAccionAviso={alAccionAviso}
              onIrA={irA}
              onRevisar={revisar}
              vozDisponible={vozDisponible}
              onHablar={() => void hablar()}
              enfoquePendiente={enfoquePendiente}
              onEnfocado={consumirEnfoque}
            />
          )}
        </>
      ) : null}
    </dialog>
  );
}
