/**
 * Rutas /api/asistente/*: estado, conexiones Realtime (proxy SDP) y guardas Clef.
 * Patrones de Vital Oceans (AlexRuntime) y Tricologs (rutas del asistente).
 */
import { Hono } from "hono";
import { SolicitudConocimientoSchema } from "../../shared/asistente/conocimiento";
import {
  CODIGOS_ERROR,
  SolicitudConexionSchema,
  SolicitudGuardaAccionSchema,
  SolicitudGuardaIntencionSchema,
  type EstadoServidor,
  type RespuestaConexion,
} from "../../shared/asistente/servidor";
import type { ConfiguracionServidor } from "../config";
import type { IndiceConocimiento } from "../conocimiento/indice";
import type { ClienteClef } from "../proveedores/clef";
import type { ClienteRealtime } from "../proveedores/openai-realtime";
import type { Registrador } from "../registro";
import { ipDe, leerJson, respuestaError, type LimitadorVentana } from "../seguridad";
import { clasificarIntencion, evaluarAccionSolicitada } from "./guardas";
import type { RegistroLlamadas } from "./llamadas";
import { armarSesionRealtime } from "./sesion-realtime";

/** Tras "insufficient_quota" las conexiones nuevas no llaman al proveedor durante este tiempo. */
const PAUSA_SIN_CREDITOS_MS = 60_000;

export interface DependenciasRutasAsistente {
  config: ConfiguracionServidor;
  clef: ClienteClef;
  realtime: ClienteRealtime;
  llamadas: RegistroLlamadas;
  limitadorInicios: LimitadorVentana;
  limitadorGuardas: LimitadorVentana;
  conocimiento: IndiceConocimiento;
  registrar: Registrador;
  ahora: () => number;
}

export function rutasAsistente(dependencias: DependenciasRutasAsistente): Hono {
  const { config, clef, realtime, llamadas, limitadorInicios, limitadorGuardas, conocimiento, registrar, ahora } = dependencias;
  const app = new Hono();
  let sinCreditosHasta = 0;

  function estado(): EstadoServidor {
    let disponibilidad: EstadoServidor["realtime"];
    if (!realtime.configurado) {
      disponibilidad = {
        disponible: false,
        motivo: "El asistente con IA no está configurado en este servidor (falta OPENAI_API_KEY). Puedes usar las respuestas programadas.",
      };
    } else if (sinCreditosHasta > ahora()) {
      disponibilidad = { disponible: false, motivo: "El proveedor de IA no está disponible en este momento. Intenta más tarde." };
    } else {
      disponibilidad = { disponible: true, modelo: config.modeloRealtime };
    }
    return {
      realtime: disponibilidad,
      clef: { disponible: clef.configurado && config.guardas !== "off", modo: config.guardas },
      bienestarIaReal: config.bienestarIaReal,
    };
  }

  app.get("/estado", (c) => c.json(estado()));

  app.post("/conexiones", async (c) => {
    const lectura = await leerJson(c);
    if (!lectura.ok) return lectura.respuesta;
    const resultado = SolicitudConexionSchema.safeParse(lectura.valor);
    if (!resultado.success) {
      const soloPantalla = resultado.error.issues.every((problema) => problema.path[0] === "pantalla");
      if (soloPantalla) {
        return respuestaError(c, 422, { error: "La pantalla enviada no es válida.", codigo: CODIGOS_ERROR.pantallaInvalida });
      }
      return respuestaError(c, 400, { error: "La solicitud de conexión no es válida.", codigo: CODIGOS_ERROR.solicitudInvalida });
    }
    const solicitud = resultado.data;

    if (solicitud.ambito === "bienestar") {
      if (!config.bienestarIaReal) {
        return respuestaError(c, 403, {
          error: "La IA real no está habilitada en Bienestar en este prototipo. Puedes usar el acompañante con respuestas programadas.",
          codigo: CODIGOS_ERROR.bienestarDesactivado,
        });
      }
      if (solicitud.consentimientoBienestar !== true) {
        return respuestaError(c, 403, {
          error: "Para conversar con IA real en Bienestar necesitas aceptar antes el aviso de consentimiento.",
          codigo: CODIGOS_ERROR.consentimientoRequerido,
        });
      }
    }

    if (!realtime.configurado) {
      return respuestaError(c, 503, {
        error: "El asistente con IA no está configurado en este servidor. Puedes seguir con las respuestas programadas.",
        codigo: CODIGOS_ERROR.sinConfiguracion,
      });
    }

    const pausa = Math.ceil((sinCreditosHasta - ahora()) / 1000);
    if (pausa > 0) {
      return respuestaError(c, 503, {
        error: "El asistente con IA no está disponible en este momento. Puedes seguir sin él; tu avance se conserva.",
        codigo: CODIGOS_ERROR.sinCreditos,
        reintentarEnSegundos: pausa,
      });
    }

    const liberarCupo = llamadas.reservar();
    if (!liberarCupo) {
      return respuestaError(c, 503, {
        error: "El asistente está atendiendo a muchas personas. Vuelve a intentarlo en un minuto; tu avance se conserva.",
        codigo: CODIGOS_ERROR.ocupado,
        reintentarEnSegundos: 60,
      });
    }

    try {
      const ip = ipDe(c);
      const limite = limitadorInicios.intentar(ip);
      if (!limite.permitido) {
        const minutos = Math.max(1, Math.ceil(limite.reintentarEnSegundos / 60));
        return respuestaError(c, 429, {
          error: `Se alcanzó el límite de conversaciones por hora en este equipo. Puedes seguir sin el asistente con IA y volver a intentarlo en ${minutos === 1 ? "un minuto" : `${minutos} minutos`}.`,
          codigo: CODIGOS_ERROR.limite,
          reintentarEnSegundos: limite.reintentarEnSegundos,
        });
      }

      const sesion = armarSesionRealtime({
        ambito: solicitud.ambito,
        pantalla: solicitud.pantalla,
        modelo: config.modeloRealtime,
        voz: config.voz,
        ...(solicitud.nombreParaSaludo ? { nombreParaSaludo: solicitud.nombreParaSaludo } : {}),
      });
      const llamada = await realtime.crearLlamada(solicitud.sdp, sesion);
      if (!llamada.ok) {
        // No se abrió ninguna llamada: este intento no cuenta para el límite por hora.
        limite.devolver();
        switch (llamada.tipo) {
          case "sin_creditos":
            sinCreditosHasta = ahora() + PAUSA_SIN_CREDITOS_MS;
            return respuestaError(c, 503, {
              error: "El asistente con IA no está disponible en este momento. Puedes seguir sin él; tu avance se conserva.",
              codigo: CODIGOS_ERROR.sinCreditos,
              reintentarEnSegundos: PAUSA_SIN_CREDITOS_MS / 1000,
            });
          case "ocupado":
            return respuestaError(c, 503, {
              error: "El asistente con IA está recibiendo demasiadas solicitudes. Vuelve a intentarlo en unos segundos.",
              codigo: CODIGOS_ERROR.ocupado,
              reintentarEnSegundos: 20,
            });
          default:
            return respuestaError(c, 502, {
              error: "No se pudo conectar con el asistente con IA. Inténtalo de nuevo.",
              codigo: CODIGOS_ERROR.proveedor,
            });
        }
      }

      const activa = llamadas.registrar({ callId: llamada.callId, ip, ambito: solicitud.ambito });
      registrar("realtime_llamada_creada", { ambito: solicitud.ambito, activas: llamadas.activas });
      const cuerpo: RespuestaConexion = {
        id: activa.id,
        sdp: llamada.sdp,
        modelo: config.modeloRealtime,
        maxSegundos: config.maxSegundos,
      };
      return c.json(cuerpo, 201);
    } finally {
      liberarCupo();
    }
  });

  app.delete("/conexiones/:id", async (c) => {
    const id = c.req.param("id");
    const llamada = /^[A-Za-z0-9_-]{10,100}$/.test(id) ? llamadas.obtener(id) : null;
    // Una conversación de otra IP responde igual que una inexistente.
    if (!llamada || llamada.ip !== ipDe(c)) {
      return respuestaError(c, 404, { error: "Conversación no disponible.", codigo: CODIGOS_ERROR.noEncontrada });
    }
    await llamadas.cerrar(id);
    registrar("realtime_llamada_cerrada", { ambito: llamada.ambito, activas: llamadas.activas });
    return c.body(null, 204);
  });

  // Conocimiento (RAG): sólo devuelve pasajes del corpus verificado. No registra la consulta.
  app.post("/conocimiento", async (c) => {
    const limite = limitadorGuardas.intentar(ipDe(c));
    if (!limite.permitido) {
      return respuestaError(c, 429, {
        error: "Demasiadas consultas en poco tiempo.",
        codigo: CODIGOS_ERROR.limite,
        reintentarEnSegundos: limite.reintentarEnSegundos,
      });
    }
    const lectura = await leerJson(c);
    if (!lectura.ok) return lectura.respuesta;
    const resultado = SolicitudConocimientoSchema.safeParse(lectura.valor);
    if (!resultado.success) {
      return respuestaError(c, 400, { error: "La consulta no es válida.", codigo: CODIGOS_ERROR.solicitudInvalida });
    }
    return c.json(await conocimiento.buscar(resultado.data.consulta));
  });

  app.post("/guardas/accion", async (c) => {
    const limite = limitadorGuardas.intentar(ipDe(c));
    if (!limite.permitido) {
      return respuestaError(c, 429, {
        error: "Demasiadas consultas en poco tiempo.",
        codigo: CODIGOS_ERROR.limite,
        reintentarEnSegundos: limite.reintentarEnSegundos,
      });
    }
    const lectura = await leerJson(c);
    if (!lectura.ok) return lectura.respuesta;
    const resultado = SolicitudGuardaAccionSchema.safeParse(lectura.valor);
    if (!resultado.success) {
      return respuestaError(c, 400, { error: "La consulta de la guarda no es válida.", codigo: CODIGOS_ERROR.solicitudInvalida });
    }
    const respuesta = await evaluarAccionSolicitada({
      clef,
      modo: config.guardas,
      accion: resultado.data.accion,
      argumentos: resultado.data.argumentos,
      mensajes: resultado.data.mensajesRecientes,
      registrar,
    });
    return c.json(respuesta);
  });

  app.post("/guardas/intencion", async (c) => {
    const limite = limitadorGuardas.intentar(ipDe(c));
    if (!limite.permitido) {
      return respuestaError(c, 429, {
        error: "Demasiadas consultas en poco tiempo.",
        codigo: CODIGOS_ERROR.limite,
        reintentarEnSegundos: limite.reintentarEnSegundos,
      });
    }
    const lectura = await leerJson(c);
    if (!lectura.ok) return lectura.respuesta;
    const resultado = SolicitudGuardaIntencionSchema.safeParse(lectura.valor);
    if (!resultado.success) {
      return respuestaError(c, 400, { error: "La consulta de intención no es válida.", codigo: CODIGOS_ERROR.solicitudInvalida });
    }
    const respuesta = await clasificarIntencion({ clef, modo: config.guardas, texto: resultado.data.texto, registrar });
    return c.json(respuesta);
  });

  return app;
}
