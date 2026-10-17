import { calcularSaldo, movimientosDe, registrarCanje } from "@/domain/puntos";
import { BENEFICIOS_DEMO } from "@/data/beneficios";
import { REGLAS_PUNTOS_DEMO } from "@/data/reglas-puntos";
import { ReglaDeNegocioError, type RewardRepository } from "@/services/contracts";
import type { CanjeDemo } from "@/types";
import { asignarFolio, exigir, notificar, porFechaDesc } from "./comun";
import { operacionDemo, type ContextoDemo } from "./storage";

export function crearRecompensasDemo(contexto: ContextoDemo): RewardRepository {
  const { almacen } = contexto;
  return {
    getRules: () => operacionDemo(contexto, "rewards", "lectura", () => REGLAS_PUNTOS_DEMO),

    getBalance: (actor) => operacionDemo(contexto, "rewards", "lectura", () => calcularSaldo(almacen.leer("movimientos"), actor.id)),

    listMovements: (actor) => operacionDemo(contexto, "rewards", "lectura", () => movimientosDe(almacen.leer("movimientos"), actor.id)),

    listBenefits: () => operacionDemo(contexto, "rewards", "lectura", () => [...BENEFICIOS_DEMO]),

    listRedemptions: (actor) =>
      operacionDemo(contexto, "rewards", "lectura", () =>
        almacen
          .leer("canjes")
          .filter((c) => c.identidadId === actor.id)
          .sort(porFechaDesc((c) => c.fecha)),
      ),

    redeem: (beneficioId, actor) =>
      operacionDemo(contexto, "rewards", "mutacion", () => {
        const beneficio = exigir(
          BENEFICIOS_DEMO.find((b) => b.id === beneficioId),
          "el beneficio",
        );
        if (!beneficio.disponible) throw new ReglaDeNegocioError("no_disponible", "Este beneficio de ejemplo no está disponible.");
        const fecha = almacen.ahora().toISOString();
        const id = contexto.nuevoId("can");
        // registrarCanje rechaza el canje si el saldo disponible no alcanza (nunca queda negativo).
        const { libro } = registrarCanje(almacen.leer("movimientos"), {
          id: contexto.nuevoId("mov"),
          identidadId: actor.id,
          claveEvento: `canje:${id}`,
          costo: beneficio.costoPuntos,
          motivo: `Canje de ejemplo: ${beneficio.nombre}`,
          fecha,
          referenciaId: id,
        });
        const canje: CanjeDemo = {
          id,
          codigo: asignarFolio(contexto, "canje"),
          beneficioId: beneficio.id,
          beneficioNombre: beneficio.nombre,
          identidadId: actor.id,
          puntos: beneficio.costoPuntos,
          fecha,
        };
        almacen.escribir("movimientos", libro);
        almacen.modificar("canjes", (lista) => ({ valor: [canje, ...lista], resultado: undefined }));
        notificar(contexto, {
          identidadId: actor.id,
          tipo: "puntos",
          titulo: "Canje de ejemplo registrado",
          cuerpo: `${beneficio.nombre} (${canje.codigo}). Es un beneficio ficticio sin validez.`,
          enlace: "/participacion/recompensas",
        });
        return canje;
      }),
  };
}
