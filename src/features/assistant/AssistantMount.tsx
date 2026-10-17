import { lazy, Suspense, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import type { NombreAccion } from "@shared/asistente/acciones";
import { esRutaSinPekito } from "./rutas-privadas";
import { suscribirActuacion } from "./runtime/acting-bus";
import { useAsistenteStore } from "./runtime/store";
import { CapaActuacion } from "./ui/CapaActuacion";
import { usePekitoUI } from "./ui/estado-pekito";
import { PekitoOnboarding } from "./ui/PekitoOnboarding";
import { leerPreferenciasPekito } from "./ui/pekito-preferencias";
import { describirPresencia, TIEMPOS_PRESENCIA, ultimoMensajeAsistente } from "./ui/presencia";
import { PresenciaPekito } from "./ui/PresenciaPekito";
import { CONSULTA_TARJETA, useMediaQuery } from "./ui/useMediaQuery";
import { useControladorPekito } from "./useControladorPekito";
import "./ui/pekito.css";

// El panel (lanzador, chat, llamada) se carga la primera vez que se abre; la presencia es mínima.
const PanelPekito = lazy(() => import("./ui/PanelPekito"));

/** Espacio que se reserva al contenido para que la mascota nunca quede sobre texto ni botones al final de la página. */
const ESPACIO_ASISTENTE = "5rem";

/** Acciones que no necesitan que el panel ceda la pantalla (se muestran dentro de la conversación). */
const SIN_CEDER: readonly NombreAccion[] = ["mostrarApoyoHumano"];

/**
 * Punto de montaje del asistente global (Pekito) en el AppShell.
 *
 * - Presencia mínima: mascota pequeña que se estira en una píldora de una línea sólo cuando hay
 *   algo que decir o hacer. Publica --espacio-asistente y se ancla sobre la navegación inferior.
 * - Panel: lanzador «Por texto o por voz», chat y llamada. Cede la pantalla cuando Pekito actúa.
 * - Capa de actuación: cursor guía que vuela desde la mascota al control que va a operar.
 * - NO se muestra en salud mental ni en Línea Mujer (ámbitos separados, con su propia ayuda humana).
 */
export function AssistantMount() {
  const { pathname } = useLocation();
  const oculto = esRutaSinPekito(pathname);
  const pekito = useControladorPekito();
  const { controlador } = pekito;
  const botonRef = useRef<HTMLButtonElement>(null);
  const tarjeta = useMediaQuery(CONSULTA_TARJETA);

  const abierto = usePekitoUI((estado) => estado.abierto);
  const panelMontado = usePekitoUI((estado) => estado.panelMontado);
  const bienvenidaAbierta = usePekitoUI((estado) => estado.bienvenidaAbierta);
  const lado = usePekitoUI((estado) => estado.lado);
  const mensajeVisto = usePekitoUI((estado) => estado.mensajeVisto);
  const avisoVisto = usePekitoUI((estado) => estado.avisoVisto);
  const estadoSesion = useAsistenteStore("general", (estado) => estado.estadoSesion);
  const vozActiva = useAsistenteStore("general", (estado) => estado.vozActiva);
  const accionesEnCurso = useAsistenteStore("general", (estado) => estado.accionesEnCurso);
  const avisos = useAsistenteStore("general", (estado) => estado.avisos);
  const mensajes = useAsistenteStore("general", (estado) => estado.mensajes);

  // Espacio reservado: sólo mientras Pekito está a la vista (en salud mental y Línea Mujer se libera).
  useEffect(() => {
    if (oculto) return;
    const raiz = document.documentElement;
    raiz.style.setProperty("--espacio-asistente", ESPACIO_ASISTENTE);
    return () => {
      raiz.style.removeProperty("--espacio-asistente");
    };
  }, [oculto]);

  // Al entrar a un espacio sin Pekito: se cierra todo, se cuelga la voz y se corta la sesión (los mensajes se conservan).
  useEffect(() => {
    if (!oculto) return;
    const estado = usePekitoUI.getState();
    estado.cerrar();
    estado.cerrarBienvenida();
    controlador.pausar();
  }, [oculto, controlador]);

  // «[Pantalla actual]» para el proveedor, sólo mientras Pekito está a la vista.
  useEffect(() => {
    if (oculto) return;
    return controlador.observarPantalla();
  }, [oculto, controlador]);

  // El panel cede la pantalla cuando Pekito actúa, para que se vea lo que hizo:
  // en pantalla completa (modal) desde que la acción se anuncia; como tarjeta, al terminar bien.
  useEffect(() => {
    const acciones = new Map<string, NombreAccion>();
    return suscribirActuacion((evento) => {
      if (evento.tipo === "intent") {
        acciones.set(evento.id, evento.accion);
        if (!tarjeta && !SIN_CEDER.includes(evento.accion)) usePekitoUI.getState().cerrar();
      } else if (evento.tipo === "done") {
        const accion = acciones.get(evento.id);
        acciones.delete(evento.id);
        if (tarjeta && accion && evento.estado !== "fallida" && accion !== "senalarElemento" && !SIN_CEDER.includes(accion)) {
          usePekitoUI.getState().cerrar();
        }
      }
    });
  }, [tarjeta]);

  // Con el panel abierto, lo último que dijo Pekito ya está a la vista: la píldora no lo repite.
  useEffect(() => {
    if (!abierto) return;
    const estado = usePekitoUI.getState();
    const ultimo = ultimoMensajeAsistente(mensajes);
    if (ultimo && estado.mensajeVisto !== ultimo.id) estado.marcarMensajeVisto(ultimo.id);
    const aviso = avisos.at(-1);
    if (aviso && estado.avisoVisto !== aviso.id) estado.marcarAvisoVisto(aviso.id);
  }, [abierto, mensajes, avisos]);

  const linea = describirPresencia({ panelAbierto: abierto, estadoSesion, vozActiva, accionesEnCurso, avisos, mensajes, mensajeVisto, avisoVisto });

  // La píldora se repliega sola: una respuesta tras 12 s y un aviso tras 6 s (el historial los conserva).
  const tipoLinea = linea?.tipo;
  const ultimoId = ultimoMensajeAsistente(mensajes)?.id ?? null;
  const ultimoAvisoId = avisos.at(-1)?.id ?? null;
  useEffect(() => {
    if (tipoLinea !== "respuesta" && tipoLinea !== "aviso") return;
    const temporizador = window.setTimeout(
      () => {
        const estado = usePekitoUI.getState();
        if (tipoLinea === "respuesta") estado.marcarMensajeVisto(ultimoId);
        else estado.marcarAvisoVisto(ultimoAvisoId);
      },
      tipoLinea === "respuesta" ? TIEMPOS_PRESENCIA.respuestaMs : TIEMPOS_PRESENCIA.avisoMs,
    );
    return () => window.clearTimeout(temporizador);
  }, [tipoLinea, ultimoId, ultimoAvisoId]);

  if (oculto) return null;

  const alAbrir = () => {
    const estado = usePekitoUI.getState();
    if (estado.abierto) {
      estado.cerrar();
      return;
    }
    if (!leerPreferenciasPekito().bienvenidaVista) {
      estado.abrirBienvenida();
      return;
    }
    estado.abrir(vozActiva ? "llamada" : mensajes.length > 0 ? "chat" : "lanzador");
  };

  return (
    <>
      <PresenciaPekito
        lado={lado}
        abierto={abierto}
        linea={linea}
        botonRef={botonRef}
        onAbrir={alAbrir}
        onDescartarLinea={() => {
          const estado = usePekitoUI.getState();
          estado.marcarMensajeVisto(ultimoId);
          estado.marcarAvisoVisto(ultimoAvisoId);
        }}
        onColgar={() => controlador.detenerVoz()}
        onMover={(nuevo) => usePekitoUI.getState().moverA(nuevo)}
      />

      <PekitoOnboarding
        abierto={bienvenidaAbierta}
        onCerrar={(modo) => {
          const estado = usePekitoUI.getState();
          estado.cerrarBienvenida();
          estado.abrir(modo === "escribir" ? "chat" : "lanzador");
        }}
      />

      {panelMontado ? (
        <Suspense fallback={null}>
          <PanelPekito pekito={pekito} retornoRespaldo={botonRef} />
        </Suspense>
      ) : null}

      <CapaActuacion />
    </>
  );
}
