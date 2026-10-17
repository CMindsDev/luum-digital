/**
 * Une la interfaz de Pekito con el núcleo del asistente: crea UN controlador (proveedor demo por
 * omisión), consulta al servidor si hay OpenAI Realtime y guardas Clef, conecta el ejecutor con
 * React Router y recuerda a qué pantalla llevó cada acción (para «Revisar y confirmar»).
 *
 * Nota de arquitectura: el ejecutor necesita los repositorios de forma imperativa (sólo lectura),
 * por eso este hook usa useRepositories() igual que los hooks de src/services/hooks.
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { buscarIdentidad, useDemoSession } from "@/app/session/store";
import { useRepositories } from "@/services/repositories-context";
import { DemoAssistantProvider } from "./providers/demo/DemoAssistantProvider";
import { elegirProveedores } from "./providers/elegirProveedor";
import type { RealtimeAssistantProvider } from "./providers/realtime/RealtimeAssistantProvider";
import { PuenteNavegacion } from "./puente-navegacion";
import { suscribirActuacion } from "./runtime/acting-bus";
import { crearControladorAsistente, type ControladorAsistente } from "./runtime/controlador";
import { crearClienteGuardas } from "./runtime/guardas";
import { usePekitoUI } from "./ui/estado-pekito";

export type ProveedorElegido = "demo" | "realtime";

export const MOTIVO_SIN_VOZ_PREDETERMINADO =
  "La voz requiere IA real: configura OPENAI_API_KEY en el servidor del prototipo. Mientras, puedes escribir con las respuestas programadas.";

export interface ServidorPekito {
  /** Ya respondió (o falló) GET /api/asistente/estado. */
  consultado: boolean;
  /** Proveedor real, sólo si el servidor lo ofrece. La persona debe elegirlo. */
  realtime: RealtimeAssistantProvider | null;
  /** Por qué no hay voz ni IA real (siempre explica que requiere OPENAI_API_KEY en el servidor). */
  motivoSinVoz: string;
}

export interface Pekito {
  controlador: ControladorAsistente;
  servidor: ServidorPekito;
  proveedor: ProveedorElegido;
  elegirProveedor(proveedor: ProveedorElegido): void;
  /** Vuelve a abrir la pantalla que preparó una acción (si la persona se movió). */
  repetirNavegacion(llamadaId: string): boolean;
}

export function useControladorPekito(): Pekito {
  const repositorios = useRepositories();
  const navigate = useNavigate();
  const [puente] = useState(() => new PuenteNavegacion());
  const [demo] = useState(() => new DemoAssistantProvider());
  const [servidor, setServidor] = useState<ServidorPekito>({ consultado: false, realtime: null, motivoSinVoz: MOTIVO_SIN_VOZ_PREDETERMINADO });
  const [proveedor, setProveedor] = useState<ProveedorElegido>("demo");

  const [controlador] = useState(() =>
    crearControladorAsistente({
      ambito: "general",
      proveedor: demo,
      repositorios,
      obtenerActor: () => buscarIdentidad(useDemoSession.getState().identidadId),
      navegar: puente.navegar,
      // La ayuda humana se muestra dentro de la conversación, sin sacar a la persona de donde está.
      abrirApoyoHumano: () => usePekitoUI.getState().mostrarApoyo(),
      guardas: puente.guardas,
    }),
  );

  // El navigate de React Router cambia entre renders; el puente siempre usa el vigente.
  useEffect(() => {
    puente.fijarNavegar(navigate);
    return () => puente.fijarNavegar(null);
  }, [navigate, puente]);

  // Qué acción está corriendo, para asociarle la navegación que haga.
  useEffect(
    () =>
      suscribirActuacion((evento) => {
        if (evento.tipo === "run") puente.fijarAccion(evento.id);
        else if (evento.tipo === "done") puente.terminarAccion(evento.id);
      }),
    [puente],
  );

  useEffect(() => {
    let vigente = true;
    void elegirProveedores({ ambito: "general" }).then((resultado) => {
      if (!vigente) return;
      // Clef sólo si el servidor lo ofrece; si no, «sin señal» sin hacer peticiones.
      puente.fijarGuardas(resultado.estado?.clef.disponible ? crearClienteGuardas() : null);
      setServidor({
        consultado: true,
        realtime: resultado.realtime,
        motivoSinVoz: MOTIVO_SIN_VOZ_PREDETERMINADO,
      });
    });
    return () => {
      vigente = false;
    };
  }, [puente]);

  // Al desmontar el AppShell se cuelga y se borra la conversación (sólo vive en memoria).
  useEffect(
    () => () => {
      controlador.cerrar();
      puente.olvidar();
    },
    [controlador, puente],
  );

  const elegirProveedor = useCallback(
    (elegido: ProveedorElegido) => {
      if (elegido === "realtime") {
        if (!servidor.realtime) return;
        controlador.cambiarProveedor(servidor.realtime);
      } else {
        controlador.cambiarProveedor(demo);
      }
      setProveedor(elegido);
    },
    [controlador, demo, servidor.realtime],
  );

  const repetirNavegacion = useCallback(
    (llamadaId: string) => puente.repetir(llamadaId, `${window.location.pathname}${window.location.search}`),
    [puente],
  );

  return { controlador, servidor, proveedor, elegirProveedor, repetirNavegacion };
}
