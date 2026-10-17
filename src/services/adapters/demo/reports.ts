import { buscarPosiblesDuplicados } from "@/domain/duplicados";
import { normalizarFolio } from "@/domain/folios";
import { anularPorReferencia, aprobarCredito, registrarCredito } from "@/domain/puntos";
import {
  agregarAportacion,
  cancelarReporte,
  claveEventoReporteValidado,
  crearReporte,
  motivoPuntosCancelacion,
  NOMBRE_CATEGORIA_REPORTE,
  ordenarPorFecha,
  registrarAtencion,
  registrarSeguimiento,
  validarReporte,
} from "@/domain/reportes";
import { aportacionSchema, nuevoReporteSchema } from "@/domain/validaciones";
import { REGLAS_PUNTOS_DEMO } from "@/data/reglas-puntos";
import type { ReportRepository } from "@/services/contracts";
import type { FiltroReportes, Reporte } from "@/types";
import { asignarFolio, exigir, exigirOperador, notificar, validarEntrada } from "./comun";
import { operacionDemo, type ContextoDemo } from "./storage";

function coincide(reporte: Reporte, filtro: FiltroReportes): boolean {
  if (filtro.categorias?.length && !filtro.categorias.includes(reporte.categoria)) return false;
  if (filtro.estados?.length && !filtro.estados.includes(reporte.estadoMunicipal)) return false;
  if (filtro.identidadId && reporte.identidadId !== filtro.identidadId) return false;
  if (filtro.desde && reporte.creadoEn < filtro.desde) return false;
  if (filtro.hasta && reporte.creadoEn > `${filtro.hasta}T23:59:59.999Z`) return false;
  if (filtro.folio && !reporte.folio.includes(normalizarFolio(filtro.folio))) return false;
  return true;
}

export function crearReportesDemo(contexto: ContextoDemo): ReportRepository {
  const { almacen } = contexto;
  const ahoraIso = () => almacen.ahora().toISOString();

  /** Reemplaza un reporte en la colección y lo devuelve. */
  function guardarReporte(actualizado: Reporte): Reporte {
    almacen.modificar("reportes", (lista) => ({
      valor: lista.map((r) => (r.id === actualizado.id ? actualizado : r)),
      resultado: undefined,
    }));
    return actualizado;
  }

  function obtener(id: string): Reporte {
    return exigir(
      almacen.leer("reportes").find((r) => r.id === id),
      "el reporte",
    );
  }

  return {
    list: (filtro = {}) =>
      operacionDemo(contexto, "reports", "lectura", () => ordenarPorFecha(almacen.leer("reportes").filter((r) => coincide(r, filtro)))),

    get: (id) => operacionDemo(contexto, "reports", "lectura", () => almacen.leer("reportes").find((r) => r.id === id) ?? null),

    findByFolio: (folio) =>
      operacionDemo(contexto, "reports", "lectura", () => {
        const buscado = normalizarFolio(folio);
        return almacen.leer("reportes").find((r) => r.folio === buscado) ?? null;
      }),

    findPossibleDuplicates: (input) =>
      operacionDemo(contexto, "reports", "lectura", () => buscarPosiblesDuplicados(input, almacen.leer("reportes"), almacen.ahora())),

    create: (input, actor) =>
      operacionDemo(contexto, "reports", "mutacion", () => {
        const datos = validarEntrada(nuevoReporteSchema, input);
        const fecha = ahoraIso();
        const id = contexto.nuevoId("rep");
        const folio = asignarFolio(contexto, "reporte", new Set(almacen.leer("reportes").map((r) => r.folio)));
        const reporte = crearReporte({ ...input, ...datos }, { id, folio, identidadId: actor.id, fecha });
        almacen.modificar("reportes", (lista) => ({ valor: [reporte, ...lista], resultado: undefined }));
        // Puntos PENDIENTES: no suman al saldo hasta la validación simulada del operador.
        almacen.modificar("movimientos", (libro) => ({
          valor: registrarCredito(libro, {
            id: contexto.nuevoId("mov"),
            identidadId: actor.id,
            claveEvento: claveEventoReporteValidado(id),
            tipo: "reporte_validado",
            puntos: REGLAS_PUNTOS_DEMO.reporteValidado,
            motivo: `Reporte ${folio} (pendiente de validación)`,
            fecha,
            estado: "pendiente",
            referenciaId: id,
          }).libro,
          resultado: undefined,
        }));
        notificar(contexto, {
          identidadId: actor.id,
          tipo: "reporte",
          titulo: `Reporte ${folio} registrado`,
          cuerpo: `${NOMBRE_CATEGORIA_REPORTE[reporte.categoria]}: tu reporte quedó registrado en la simulación.`,
          enlace: `/reportes/${id}`,
        });
        return reporte;
      }),

    addContribution: (reporteId, input, actor) =>
      operacionDemo(contexto, "reports", "mutacion", () => {
        const datos = validarEntrada(aportacionSchema, input);
        const reporte = obtener(reporteId);
        const actualizado = agregarAportacion(reporte, {
          id: contexto.nuevoId("apo"),
          identidadId: actor.id,
          fecha: ahoraIso(),
          descripcion: datos.descripcion,
          tieneFoto: input.tieneFoto,
        });
        if (reporte.identidadId !== actor.id) {
          notificar(contexto, {
            identidadId: reporte.identidadId,
            tipo: "reporte",
            titulo: `Nueva aportación en ${reporte.folio}`,
            cuerpo: "Otra persona aportó información al mismo incidente.",
            enlace: `/reportes/${reporte.id}`,
          });
        }
        // Una aportación nunca crea reporte ni puntos (evita premiar duplicados).
        return guardarReporte(actualizado);
      }),

    followUp: (reporteId, tipo, texto, actor) =>
      operacionDemo(contexto, "reports", "mutacion", () => {
        exigirOperador(actor);
        return guardarReporte(registrarSeguimiento(obtener(reporteId), tipo, texto, ahoraIso()));
      }),

    validate: (reporteId, actor) =>
      operacionDemo(contexto, "reports", "mutacion", () => {
        exigirOperador(actor);
        const fecha = ahoraIso();
        const actualizado = guardarReporte(validarReporte(obtener(reporteId), fecha));
        almacen.modificar("movimientos", (libro) => ({
          valor: aprobarCredito(libro, claveEventoReporteValidado(reporteId), fecha).libro,
          resultado: undefined,
        }));
        notificar(contexto, {
          identidadId: actualizado.identidadId,
          tipo: "reporte",
          titulo: `${actualizado.folio}: en proceso de atención`,
          cuerpo: "El operador de demostración validó tu reporte. Tus puntos quedaron aprobados.",
          enlace: `/reportes/${actualizado.id}`,
        });
        return actualizado;
      }),

    registerAttention: (reporteId, nota, actor) =>
      operacionDemo(contexto, "reports", "mutacion", () => {
        exigirOperador(actor);
        const actualizado = guardarReporte(registrarAtencion(obtener(reporteId), nota, ahoraIso()));
        notificar(contexto, {
          identidadId: actualizado.identidadId,
          tipo: "reporte",
          titulo: `${actualizado.folio}: solucionado (atención reportada)`,
          cuerpo: "El Ayuntamiento simulado reportó la atención. Otras personas pueden verificar el resultado.",
          enlace: `/reportes/${actualizado.id}`,
        });
        return actualizado;
      }),

    cancel: (reporteId, motivo, actor) =>
      operacionDemo(contexto, "reports", "mutacion", () => {
        exigirOperador(actor);
        const fecha = ahoraIso();
        const reporte = obtener(reporteId);
        const actualizado = guardarReporte(cancelarReporte(reporte, motivo, fecha));
        almacen.modificar("movimientos", (libro) => ({
          valor: anularPorReferencia(libro, reporteId, {
            motivo: motivoPuntosCancelacion(reporte, motivo),
            fecha,
            nuevoId: () => contexto.nuevoId("mov"),
          }).libro,
          resultado: undefined,
        }));
        notificar(contexto, {
          identidadId: actualizado.identidadId,
          tipo: "reporte",
          titulo: `${actualizado.folio}: cancelado`,
          cuerpo: motivoPuntosCancelacion(reporte, motivo),
          enlace: `/reportes/${actualizado.id}`,
        });
        return actualizado;
      }),
  };
}
