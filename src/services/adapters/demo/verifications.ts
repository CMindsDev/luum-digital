import { aprobarCredito, cancelarCredito, registrarCredito, revertirCredito } from "@/domain/puntos";
import { ordenarPorFecha } from "@/domain/reportes";
import { motivoObligatorioSchema } from "@/domain/validaciones";
import {
  calcularPuntosVerificacion,
  claveEventoVerificacion,
  estadoVerificacionAgregado,
  ETIQUETA_RESULTADO,
  evaluarCalidad,
  evaluarElegibilidad,
} from "@/domain/verificacion";
import { REGLAS_PUNTOS_DEMO } from "@/data/reglas-puntos";
import { ReglaDeNegocioError, type VerificationRepository } from "@/services/contracts";
import type { EventoReporte, Verificacion } from "@/types";
import { exigir, exigirOperador, notificar, porFechaDesc, validarEntrada } from "./comun";
import { operacionDemo, type ContextoDemo } from "./storage";

export function crearVerificacionesDemo(contexto: ContextoDemo): VerificationRepository {
  const { almacen } = contexto;
  const ahoraIso = () => almacen.ahora().toISOString();

  function obtener(id: string): Verificacion {
    return exigir(
      almacen.leer("verificaciones").find((v) => v.id === id),
      "la verificación",
    );
  }

  function guardar(actualizada: Verificacion): Verificacion {
    almacen.modificar("verificaciones", (lista) => ({
      valor: lista.map((v) => (v.id === actualizada.id ? actualizada : v)),
      resultado: undefined,
    }));
    return actualizada;
  }

  /** Recalcula la verificación ciudadana del reporte (nunca cambia su estado municipal). */
  function actualizarReporte(reporteId: string, evento: Omit<EventoReporte, "fecha">): void {
    const verificaciones = almacen.leer("verificaciones");
    almacen.modificar("reportes", (lista) => ({
      valor: lista.map((r) => {
        if (r.id !== reporteId) return r;
        const fecha = ahoraIso();
        return {
          ...r,
          verificacion: estadoVerificacionAgregado(r, verificaciones),
          actualizadoEn: fecha,
          historial: [...r.historial, { ...evento, fecha }],
        };
      }),
      resultado: undefined,
    }));
  }

  return {
    listVerifiable: (actor) =>
      operacionDemo(contexto, "verifications", "lectura", () => {
        const verificaciones = almacen.leer("verificaciones");
        return ordenarPorFecha(
          almacen.leer("reportes").filter((r) => evaluarElegibilidad(r, actor.id, verificaciones).elegible),
        );
      }),

    listMine: (actor) =>
      operacionDemo(contexto, "verifications", "lectura", () =>
        almacen
          .leer("verificaciones")
          .filter((v) => v.identidadId === actor.id)
          .sort(porFechaDesc((v) => v.fecha)),
      ),

    listByReport: (reporteId) =>
      operacionDemo(contexto, "verifications", "lectura", () =>
        almacen
          .leer("verificaciones")
          .filter((v) => v.reporteId === reporteId)
          .sort(porFechaDesc((v) => v.fecha)),
      ),

    submit: (input, actor) =>
      operacionDemo(contexto, "verifications", "mutacion", () => {
        const reporte = exigir(
          almacen.leer("reportes").find((r) => r.id === input.reporteId),
          "el reporte",
        );
        const elegibilidad = evaluarElegibilidad(reporte, actor.id, almacen.leer("verificaciones"));
        if (!elegibilidad.elegible) throw new ReglaDeNegocioError(elegibilidad.codigo, elegibilidad.motivo);
        const fecha = ahoraIso();
        const calidad = evaluarCalidad(
          { comentario: input.comentario, ubicacionConfirmada: input.ubicacionConfirmada, tieneFoto: input.tieneFoto },
          REGLAS_PUNTOS_DEMO,
        );
        const verificacion: Verificacion = {
          id: contexto.nuevoId("ver"),
          reporteId: reporte.id,
          reporteFolio: reporte.folio,
          identidadId: actor.id,
          fecha,
          resultado: input.resultado,
          comentario: input.comentario.trim(),
          calidad,
          estadoRevision: "pendiente_revision",
        };
        almacen.modificar("verificaciones", (lista) => ({ valor: [verificacion, ...lista], resultado: undefined }));
        // Puntos pendientes de revisión; el valor no depende de que la respuesta sea positiva.
        almacen.modificar("movimientos", (libro) => ({
          valor: registrarCredito(libro, {
            id: contexto.nuevoId("mov"),
            identidadId: actor.id,
            claveEvento: claveEventoVerificacion(verificacion.id),
            tipo: "verificacion_aprobada",
            puntos: calcularPuntosVerificacion(verificacion.resultado, calidad, REGLAS_PUNTOS_DEMO),
            motivo: `Verificación de ${reporte.folio} (pendiente de revisión)`,
            fecha,
            estado: "pendiente",
            referenciaId: verificacion.id,
          }).libro,
          resultado: undefined,
        }));
        actualizarReporte(reporte.id, {
          tipo: "verificacion_recibida",
          descripcion: `Verificación ciudadana recibida: ${ETIQUETA_RESULTADO[verificacion.resultado]}.`,
          actor: "ciudadania",
        });
        return verificacion;
      }),

    listForReview: (actor) =>
      operacionDemo(contexto, "verifications", "lectura", () => {
        exigirOperador(actor);
        return almacen
          .leer("verificaciones")
          .slice()
          .sort((a, b) => Number(b.estadoRevision === "pendiente_revision") - Number(a.estadoRevision === "pendiente_revision") || (a.fecha < b.fecha ? 1 : -1));
      }),

    approve: (id, actor) =>
      operacionDemo(contexto, "verifications", "mutacion", () => {
        exigirOperador(actor);
        const verificacion = obtener(id);
        // Idempotente: aprobar dos veces no acredita dos veces.
        if (verificacion.estadoRevision === "aprobada") return verificacion;
        if (verificacion.estadoRevision !== "pendiente_revision") {
          throw new ReglaDeNegocioError("estado_invalido", "Sólo se pueden aprobar verificaciones pendientes de revisión.");
        }
        const fecha = ahoraIso();
        const aprobada = guardar({ ...verificacion, estadoRevision: "aprobada", revisadaPor: actor.id });
        almacen.modificar("movimientos", (libro) => ({
          valor: aprobarCredito(libro, claveEventoVerificacion(id), fecha).libro,
          resultado: undefined,
        }));
        actualizarReporte(verificacion.reporteId, {
          tipo: "verificacion_aprobada",
          descripcion: `Verificación aprobada: ${ETIQUETA_RESULTADO[verificacion.resultado]}.`,
          actor: "operador",
        });
        notificar(contexto, {
          identidadId: verificacion.identidadId,
          tipo: "puntos",
          titulo: "Tu verificación fue aprobada",
          cuerpo: `Verificación de ${verificacion.reporteFolio}: los puntos ya están en tu saldo.`,
          enlace: "/participacion/recompensas",
        });
        return aprobada;
      }),

    reject: (id, motivo, actor) =>
      operacionDemo(contexto, "verifications", "mutacion", () => {
        exigirOperador(actor);
        const texto = validarEntrada(motivoObligatorioSchema, motivo);
        const verificacion = obtener(id);
        if (verificacion.estadoRevision !== "pendiente_revision") {
          throw new ReglaDeNegocioError("estado_invalido", "Sólo se pueden rechazar verificaciones pendientes de revisión.");
        }
        const rechazada = guardar({ ...verificacion, estadoRevision: "rechazada", revisadaPor: actor.id, motivoRevision: texto });
        almacen.modificar("movimientos", (libro) => ({
          valor: cancelarCredito(libro, claveEventoVerificacion(id), `Verificación rechazada: ${texto}`).libro,
          resultado: undefined,
        }));
        actualizarReporte(verificacion.reporteId, {
          tipo: "verificacion_rechazada",
          descripcion: `Verificación rechazada: ${texto}`,
          actor: "operador",
        });
        notificar(contexto, {
          identidadId: verificacion.identidadId,
          tipo: "verificacion",
          titulo: "Tu verificación no fue aprobada",
          cuerpo: `Motivo: ${texto}`,
          enlace: "/participacion",
        });
        return rechazada;
      }),

    revert: (id, motivo, actor) =>
      operacionDemo(contexto, "verifications", "mutacion", () => {
        exigirOperador(actor);
        const texto = validarEntrada(motivoObligatorioSchema, motivo);
        const verificacion = obtener(id);
        if (verificacion.estadoRevision !== "aprobada") {
          throw new ReglaDeNegocioError("estado_invalido", "Sólo se pueden revertir verificaciones aprobadas.");
        }
        const revertida = guardar({ ...verificacion, estadoRevision: "revertida", revisadaPor: actor.id, motivoRevision: texto });
        almacen.modificar("movimientos", (libro) => ({
          valor: revertirCredito(libro, claveEventoVerificacion(id), {
            id: contexto.nuevoId("mov"),
            motivo: `Validación revertida: ${texto}`,
            fecha: ahoraIso(),
          }).libro,
          resultado: undefined,
        }));
        actualizarReporte(verificacion.reporteId, {
          tipo: "verificacion_revertida",
          descripcion: `Validación revertida: ${texto}`,
          actor: "operador",
        });
        notificar(contexto, {
          identidadId: verificacion.identidadId,
          tipo: "puntos",
          titulo: "Se revirtió la validación de una verificación",
          cuerpo: `Motivo: ${texto}. Los puntos asociados se descontaron.`,
          enlace: "/participacion/recompensas",
        });
        return revertida;
      }),
  };
}
