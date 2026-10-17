import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "zustand";
import { useActiveIdentity } from "@/app/session/store";
import { i18n } from "@/i18n";
import { DemoAssistantProvider, detectarRiesgo, elegirProveedores, ETIQUETA_DEMO, type ProveedoresAsistente } from "@/features/assistant/providers";
import { createAssistantStore, crearControladorAsistente, type ControladorAsistente, type MotivoApoyo } from "@/features/assistant/runtime";
import type { AssistantProvider } from "@/services/contracts";
import type { LineaAyuda } from "@/types";
import { crearRepositoriosAcompanante } from "./repositorios-acompanante";

export interface OpcionesAcompanante {
  /** Muestra la ayuda humana en la interfaz (hoja de ayuda inmediata o sección de atención). */
  abrirApoyoHumano: (motivo: MotivoApoyo) => void;
  /** Líneas de ayuda ya cargadas (useHelpLines), para el recibo de «mostrarApoyoHumano». */
  lineas: readonly LineaAyuda[] | undefined;
}

interface ConfiguracionProveedor {
  proveedor: AssistantProvider;
  /** Consentimiento explícito para usar IA real en bienestar. */
  consentimiento: boolean;
}

/**
 * Conversación del acompañante de bienestar.
 *
 * - Store propio de esta pantalla (createAssistantStore("bienestar")): sólo en memoria, aislado del
 *   asistente general; se borra al salir de la pantalla, al recargar o con «Borrar conversación».
 * - Por defecto, respuestas programadas (DemoAssistantProvider). IA real sólo si el servidor la
 *   ofrece para bienestar (bienestarIaReal) y la persona da su consentimiento explícito.
 * - Ante palabras de riesgo (lista local, detectarRiesgo) la ayuda humana se muestra ANTES de
 *   enviar el mensaje: no depende del proveedor ni de un clasificador.
 * - Sin guardas remotas: el texto de la conversación no sale del navegador con el proveedor demo.
 */
export function useAcompanante({ abrirApoyoHumano, lineas }: OpcionesAcompanante) {
  const navigate = useNavigate();
  const actor = useActiveIdentity();
  const [store] = useState(() => createAssistantStore("bienestar"));
  const [configuracion, setConfiguracion] = useState<ConfiguracionProveedor>(() => ({
    proveedor: new DemoAssistantProvider(),
    consentimiento: false,
  }));
  const [proveedores, setProveedores] = useState<ProveedoresAsistente | null>(null);

  // Valores vigentes para los callbacks del controlador (se leen al ejecutar, nunca al renderizar).
  const vigente = useRef({ abrirApoyoHumano, lineas: lineas ?? [], actor, navigate });
  useEffect(() => {
    vigente.current = { abrirApoyoHumano, lineas: lineas ?? [], actor, navigate };
  });

  // El controlador se crea al primer mensaje (en un evento, no al renderizar) y se cierra al salir.
  const controladorRef = useRef<{ controlador: ControladorAsistente; configuracion: ConfiguracionProveedor } | null>(null);
  const obtenerControlador = useCallback((): ControladorAsistente => {
    const actual = controladorRef.current;
    if (actual && actual.configuracion === configuracion) return actual.controlador;
    actual?.controlador.cerrar();
    const controlador = crearControladorAsistente({
      ambito: "bienestar",
      proveedor: configuracion.proveedor,
      store,
      guardas: null,
      repositorios: crearRepositoriosAcompanante(() => vigente.current.lineas),
      obtenerActor: () => vigente.current.actor,
      navegar: (ruta, estado) => vigente.current.navigate(ruta, estado ? { state: estado } : undefined),
      abrirApoyoHumano: (motivo) => vigente.current.abrirApoyoHumano(motivo),
      consentimientoBienestar: configuracion.consentimiento,
    });
    controladorRef.current = { controlador, configuracion };
    return controlador;
  }, [configuracion, store]);

  useEffect(() => {
    const alCambiar = () => controladorRef.current?.controlador.pausar();
    i18n.on("languageChanged", alCambiar);
    return () => i18n.off("languageChanged", alCambiar);
  }, []);

  // Al salir de la pantalla (o al cambiar de proveedor) se cuelga y se borra la conversación.
  useEffect(() => {
    const referencia = controladorRef;
    return () => {
      referencia.current?.controlador.cerrar();
      referencia.current = null;
      store.getState().resetear();
    };
  }, [configuracion, store]);

  // ¿El servidor ofrece IA real para bienestar? Sólo se consulta el estado (sin texto de la conversación).
  useEffect(() => {
    const cancelar = new AbortController();
    void elegirProveedores({ ambito: "bienestar", signal: cancelar.signal }).then((resultado) => {
      if (!cancelar.signal.aborted) setProveedores(resultado);
    });
    return () => cancelar.abort();
  }, []);

  const mensajes = useStore(store, (estado) => estado.mensajes);
  const estadoSesion = useStore(store, (estado) => estado.estadoSesion);
  const avisos = useStore(store, (estado) => estado.avisos);
  const etiquetaModo = useStore(store, (estado) => estado.etiquetaModo);

  const enviar = useCallback(
    async (texto: string) => {
      const limpio = texto.trim();
      if (!limpio) return;
      // Primero la ayuda humana: lista local de señales de riesgo, antes de cualquier respuesta.
      const riesgo = detectarRiesgo(limpio);
      if (riesgo) vigente.current.abrirApoyoHumano(riesgo);
      const controlador = obtenerControlador();
      controlador.actualizarPantalla();
      await controlador.enviarTexto(limpio);
    },
    [obtenerControlador],
  );

  const borrar = useCallback(() => {
    controladorRef.current?.controlador.cerrar();
    store.getState().resetear();
  }, [store]);
  const descartarAviso = useCallback((id: string) => store.getState().descartarAviso(id), [store]);

  const usarIaReal = useCallback(() => {
    if (proveedores?.realtime) setConfiguracion({ proveedor: proveedores.realtime, consentimiento: true });
  }, [proveedores]);
  const usarRespuestasProgramadas = useCallback(() => setConfiguracion({ proveedor: new DemoAssistantProvider(), consentimiento: false }), []);

  return {
    mensajes,
    estadoSesion,
    avisos,
    etiquetaModo: etiquetaModo ?? configuracion.proveedor.etiqueta ?? ETIQUETA_DEMO,
    modo: configuracion.proveedor.modo,
    iaRealDisponible: Boolean(proveedores?.realtime),
    enviar,
    borrar,
    descartarAviso,
    usarIaReal,
    usarRespuestasProgramadas,
  };
}

export type EstadoAcompanante = ReturnType<typeof useAcompanante>;
