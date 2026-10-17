/**
 * Une la interfaz de Pekito con el núcleo del asistente: crea UN controlador (proveedor demo por
 * omisión), consulta al servidor si hay OpenAI Realtime y guardas Clef, conecta el ejecutor con
 * React Router y recuerda a qué pantalla llevó cada acción (para «Revisar y confirmar»).
 *
 * Nota de arquitectura: el ejecutor necesita los repositorios de forma imperativa (sólo lectura),
 * por eso este hook usa useRepositories() igual que los hooks de src/services/hooks.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { buscarIdentidad, useDemoSession } from "@/app/session/store";
import { useRepositories } from "@/services/repositories-context";
import type { EstadoNavegacionAsistente } from "@/types";
import type { RespuestaGuardaAccion } from "@shared/asistente/servidor";
import { DemoAssistantProvider } from "./providers/demo/DemoAssistantProvider";
import { elegirProveedores } from "./providers/elegirProveedor";
import type { RealtimeAssistantProvider } from "./providers/realtime/RealtimeAssistantProvider";
import { suscribirActuacion } from "./runtime/acting-bus";
import { crearControladorAsistente, type ControladorAsistente } from "./runtime/controlador";
import { crearClienteGuardas, type ClienteGuardas } from "./runtime/guardas";
import { usePekitoUI } from "./ui/estado-pekito";

export type ProveedorElegido = "demo" | "realtime";

export const MOTIVO_SIN_VOZ_PREDETERMINADO =
  "La voz necesita IA real: configura OPENAI_API_KEY en el servidor del prototipo. Mientras, puedes escribir.";

export interface ServidorPekito {
  /** Ya respondió (o falló) GET /api/asistente/estado. */
  consultado: boolean;
  /** Proveedor real, sólo si el servidor lo ofrece. La persona debe elegirlo. */
  realtime: RealtimeAssistantProvider | null;
  /** Por qué no hay voz ni IA real (texto legible del servidor o el predeterminado). */
  motivoSinVoz: string;
}

export interface NavegacionPreparada {
  ruta: string;
  estado?: EstadoNavegacionAsistente;
}

export interface Pekito {
  controlador: ControladorAsistente;
  servidor: ServidorPekito;
  proveedor: ProveedorElegido;
  elegirProveedor(proveedor: ProveedorElegido): void;
  /** Vuelve a abrir la pantalla que preparó una acción (si la persona se movió). */
  repetirNavegacion(llamadaId: string): boolean;
}

const SIN_SENAL: RespuestaGuardaAccion = { probabilidad: null, decision: "sin_senal", modo: "off", aplica: true };
const MAX_NAVEGACIONES = 30;

export function useControladorPekito(): Pekito {
  const repositorios = useRepositories();
  const navigate = useNavigate();
  const navegarRef = useRef(navigate);
  const navegaciones = useRef(new Map<string, NavegacionPreparada>());
  const enCurso = useRef<string | null>(null);
  const guardasRef = useRef<ClienteGuardas | null>(null);
  const [servidor, setServidor] = useState<ServidorPekito>({ consultado: false, realtime: null, motivoSinVoz: MOTIVO_SIN_VOZ_PREDETERMINADO });
  const [proveedor, setProveedor] = useState<ProveedorElegido>("demo");
  const [demo] = useState(() => new DemoAssistantProvider());

  useEffect(() => {
    navegarRef.current = navigate;
  }, [navigate]);

  const [controlador] = useState(() =>
    crearControladorAsistente({
      ambito: "general",
      proveedor: demo,
      repositorios,
      obtenerActor: () => buscarIdentidad(useDemoSession.getState().identidadId),
      navegar: (ruta, estado) => {
        const id = enCurso.current;
        if (id) {
          navegaciones.current.set(id, estado ? { ruta, estado } : { ruta });
          if (navegaciones.current.size > MAX_NAVEGACIONES) {
            const primera = navegaciones.current.keys().next().value;
            if (primera !== undefined) navegaciones.current.delete(primera);
          }
        }
        void navegarRef.current(ruta, estado ? { state: estado } : undefined);
      },
      // La ayuda humana se muestra dentro de la conversación, sin sacar a la persona de donde está.
      abrirApoyoHumano: (motivo) => usePekitoUI.getState().mostrarApoyo(motivo),
      // Clef sólo si el servidor lo ofrece; si no, "sin señal" sin hacer peticiones.
      guardas: {
        evaluarAccion: (entrada) => guardasRef.current?.evaluarAccion(entrada) ?? Promise.resolve(SIN_SENAL),
        clasificarIntencion: (texto) => guardasRef.current?.clasificarIntencion(texto) ?? Promise.resolve(null),
      },
    }),
  );

  // Qué acción está corriendo, para asociarle la navegación que haga.
  useEffect(
    () =>
      suscribirActuacion((evento) => {
        if (evento.tipo === "run") enCurso.current = evento.id;
        else if (evento.tipo === "done" && enCurso.current === evento.id) enCurso.current = null;
      }),
    [],
  );

  useEffect(() => {
    let vigente = true;
    void elegirProveedores({ ambito: "general" }).then((resultado) => {
      if (!vigente) return;
      guardasRef.current = resultado.estado?.clef.disponible ? crearClienteGuardas() : null;
      setServidor({
        consultado: true,
        realtime: resultado.realtime,
        motivoSinVoz: resultado.motivoSinRealtime ?? MOTIVO_SIN_VOZ_PREDETERMINADO,
      });
    });
    return () => {
      vigente = false;
    };
  }, []);

  // Al desmontar el AppShell se cuelga y se borra la conversación (sólo vive en memoria).
  useEffect(() => () => controlador.cerrar(), [controlador]);

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

  const repetirNavegacion = useCallback((llamadaId: string) => {
    const navegacion = navegaciones.current.get(llamadaId);
    if (!navegacion) return false;
    const actual = `${window.location.pathname}${window.location.search}`;
    if (actual !== navegacion.ruta) void navegarRef.current(navegacion.ruta, navegacion.estado ? { state: navegacion.estado } : undefined);
    return true;
  }, []);

  return { controlador, servidor, proveedor, elegirProveedor, repetirNavegacion };
}
