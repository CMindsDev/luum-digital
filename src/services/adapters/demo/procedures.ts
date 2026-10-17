import { normalizarFolio } from "@/domain/folios";
import { ReglaDeNegocioError, type ProcedureRepository } from "@/services/contracts";
import type { CitaDemo, EventoGestion, Gestion, IdentidadDemo, PagoDemo } from "@/types";
import { asignarFolio, exigir, notificar, porFechaDesc } from "./comun";
import { operacionDemo, type ContextoDemo } from "./storage";

/** Nombre del servicio desde el catálogo integrado (carga diferida). */
async function nombreServicio(servicioId: string): Promise<string> {
  const { SERVICIOS } = await import("@/data/catalogo");
  const id = servicioId.trim().toLowerCase();
  return SERVICIOS.find((s) => s.id === id || s.clave?.toLowerCase() === id)?.nombre ?? "Trámite de demostración";
}

export function crearGestionesDemo(contexto: ContextoDemo): ProcedureRepository {
  const { almacen } = contexto;
  const ahoraIso = () => almacen.ahora().toISOString();

  function propia(id: string, actor: IdentidadDemo): Gestion {
    return exigir(
      almacen.leer("gestiones").find((g) => g.id === id && g.identidadId === actor.id),
      "la gestión",
    );
  }

  function guardar(actualizada: Gestion): Gestion {
    almacen.modificar("gestiones", (lista) => ({
      valor: lista.map((g) => (g.id === actualizada.id ? actualizada : g)),
      resultado: undefined,
    }));
    return actualizada;
  }

  function conEvento(gestion: Gestion, evento: Omit<EventoGestion, "fecha">, cambios: Partial<Gestion> = {}): Gestion {
    const fecha = ahoraIso();
    return { ...gestion, ...cambios, actualizadaEn: fecha, historial: [...gestion.historial, { ...evento, fecha }] };
  }

  return {
    list: (actor) =>
      operacionDemo(contexto, "procedures", "lectura", () =>
        almacen
          .leer("gestiones")
          .filter((g) => g.identidadId === actor.id)
          .sort(porFechaDesc((g) => g.actualizadaEn)),
      ),

    get: (id, actor) =>
      operacionDemo(contexto, "procedures", "lectura", () => almacen.leer("gestiones").find((g) => g.id === id && g.identidadId === actor.id) ?? null),

    findByFolio: (folio, actor) =>
      operacionDemo(contexto, "procedures", "lectura", () => {
        const buscado = normalizarFolio(folio);
        return almacen.leer("gestiones").find((g) => g.folio === buscado && g.identidadId === actor.id) ?? null;
      }),

    saveDraft: async (input, actor) => {
      const servicioNombre = await nombreServicio(input.servicioId);
      return operacionDemo(contexto, "procedures", "mutacion", () => {
        const existente = input.id ? almacen.leer("gestiones").find((g) => g.id === input.id && g.identidadId === actor.id) : undefined;
        if (existente) {
          if (existente.estado !== "borrador") {
            throw new ReglaDeNegocioError("ya_enviada", "Esta gestión ya se envió; ya no se puede editar el borrador.");
          }
          return guardar(
            conEvento(
              existente,
              { estado: "borrador", descripcion: "Borrador actualizado", actor: "ciudadania" },
              { datos: input.datos, camposReutilizados: input.camposReutilizados ?? existente.camposReutilizados },
            ),
          );
        }
        const fecha = ahoraIso();
        const gestion: Gestion = {
          id: contexto.nuevoId("ges"),
          folio: null,
          servicioId: input.servicioId,
          servicioNombre,
          identidadId: actor.id,
          tipo: input.tipo,
          estado: "borrador",
          datos: input.datos,
          camposReutilizados: input.camposReutilizados ?? [],
          creadaEn: fecha,
          actualizadaEn: fecha,
          historial: [{ fecha, estado: "borrador", descripcion: "Borrador guardado", actor: "ciudadania" }],
        };
        almacen.modificar("gestiones", (lista) => ({ valor: [gestion, ...lista], resultado: undefined }));
        return gestion;
      });
    },

    submit: (id, actor) =>
      operacionDemo(contexto, "procedures", "mutacion", () => {
        const gestion = propia(id, actor);
        // Idempotente: enviar dos veces devuelve la misma gestión con el mismo folio.
        if (gestion.estado !== "borrador") return gestion;
        const folio = asignarFolio(
          contexto,
          "gestion",
          new Set(
            almacen
              .leer("gestiones")
              .map((g) => g.folio)
              .filter((f): f is string => f !== null),
          ),
        );
        const enviada = guardar(
          conEvento(
            gestion,
            { estado: "enviada", descripcion: `Gestión enviada a la simulación con folio ${folio}.`, actor: "ciudadania" },
            { estado: "enviada", folio, enviadaEn: ahoraIso() },
          ),
        );
        notificar(contexto, {
          identidadId: actor.id,
          tipo: "gestion",
          titulo: `Gestión ${folio} enviada`,
          cuerpo: `${enviada.servicioNombre}: envío simulado. No es un trámite oficial.`,
          enlace: `/gestiones/${enviada.id}`,
        });
        return enviada;
      }),

    cancel: (id, actor) =>
      operacionDemo(contexto, "procedures", "mutacion", () => {
        const gestion = propia(id, actor);
        if (gestion.estado === "cancelada") return gestion;
        if (gestion.estado === "resuelta") throw new ReglaDeNegocioError("ya_resuelta", "Una gestión resuelta ya no se puede cancelar.");
        return guardar(conEvento(gestion, { estado: "cancelada", descripcion: "Gestión cancelada por la persona.", actor: "ciudadania" }, { estado: "cancelada" }));
      }),

    simulatePayment: (input, actor) =>
      operacionDemo(contexto, "procedures", "mutacion", () => {
        if (!Number.isFinite(input.montoDemo) || input.montoDemo < 0) {
          throw new ReglaDeNegocioError("monto_invalido", "El monto de demostración no es válido.");
        }
        const pago: PagoDemo = {
          id: contexto.nuevoId("pag"),
          referencia: asignarFolio(contexto, "pago"),
          ...(input.gestionId ? { gestionId: input.gestionId } : {}),
          identidadId: actor.id,
          concepto: input.concepto,
          montoDemo: input.montoDemo,
          metodo: input.metodo,
          estado: input.resultado === "rechazado" ? "simulado_rechazado" : "simulado_aprobado",
          fecha: ahoraIso(),
          leyenda: "Pago simulado",
        };
        almacen.modificar("pagos", (lista) => ({ valor: [pago, ...lista], resultado: undefined }));
        if (input.gestionId) {
          const gestion = propia(input.gestionId, actor);
          guardar(
            conEvento(
              gestion,
              {
                estado: gestion.estado,
                descripcion: `Pago simulado ${pago.estado === "simulado_aprobado" ? "aprobado" : "rechazado"} (${pago.referencia}).`,
                actor: "sistema_demo",
              },
              { pagoId: pago.id },
            ),
          );
        }
        return pago;
      }),

    requestAppointment: (input, actor) =>
      operacionDemo(contexto, "procedures", "mutacion", () => {
        const cita: CitaDemo = {
          id: contexto.nuevoId("cit"),
          referencia: asignarFolio(contexto, "cita"),
          servicioId: input.servicioId,
          identidadId: actor.id,
          fecha: input.fecha,
          hora: input.hora,
          sede: input.sede,
          estado: "solicitud_simulada",
          creadaEn: ahoraIso(),
        };
        almacen.modificar("citas", (lista) => ({ valor: [cita, ...lista], resultado: undefined }));
        notificar(contexto, {
          identidadId: actor.id,
          tipo: "gestion",
          titulo: `Solicitud de cita simulada ${cita.referencia}`,
          cuerpo: "Es una solicitud de demostración: no hay una cita confirmada.",
          enlace: "/gestiones",
        });
        return cita;
      }),
  };
}
