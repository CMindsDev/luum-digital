import { siguienteFolio, type TipoFolio } from "@/domain/folios";
import { NoEncontradoError, PermisoDemoError, ReglaDeNegocioError } from "@/services/contracts/errors";
import type { IdentidadDemo, Notificacion } from "@/types";
import type { z } from "zod";
import type { ContextoDemo } from "./storage";

/** Sólo operador o administración de demostración. */
export function exigirOperador(actor: IdentidadDemo): void {
  if (actor.rol !== "operador" && actor.rol !== "administracion") throw new PermisoDemoError();
}

export function exigirAdministracionOOperador(actor: IdentidadDemo, mensaje: string): void {
  if (actor.rol !== "operador" && actor.rol !== "administracion") throw new PermisoDemoError(mensaje);
}

/** Asigna el siguiente folio DEMO del tipo indicado (contador persistido, nunca se reutiliza). */
export function asignarFolio(contexto: ContextoDemo, tipo: TipoFolio, existentes?: ReadonlySet<string>): string {
  return contexto.almacen.modificar("folios", (contadores) => {
    const { folio, contadores: nuevos } = siguienteFolio(contadores, tipo, existentes);
    return { valor: nuevos, resultado: folio };
  });
}

/** Agrega una notificación simulada. Bienestar nunca llama a esta función. */
export function notificar(contexto: ContextoDemo, datos: Omit<Notificacion, "id" | "fecha" | "leida" | "sensible"> & { sensible?: boolean }): void {
  const notificacion: Notificacion = {
    id: contexto.nuevoId("not"),
    fecha: contexto.almacen.ahora().toISOString(),
    leida: false,
    sensible: datos.sensible ?? false,
    identidadId: datos.identidadId,
    tipo: datos.tipo,
    titulo: datos.titulo,
    cuerpo: datos.cuerpo,
    ...(datos.enlace ? { enlace: datos.enlace } : {}),
  };
  contexto.almacen.modificar("notificaciones", (lista) => ({ valor: [notificacion, ...lista], resultado: undefined }));
}

/** Valida con zod y traduce el primer error a una regla de negocio legible. */
export function validarEntrada<T>(esquema: z.ZodType<T>, valor: unknown): T {
  const resultado = esquema.safeParse(valor);
  if (!resultado.success) {
    throw new ReglaDeNegocioError("datos_invalidos", resultado.error.issues[0]?.message ?? "Revisa los datos.");
  }
  return resultado.data;
}

export function exigir<T>(valor: T | null | undefined, recurso: string): T {
  if (valor === null || valor === undefined) throw new NoEncontradoError(recurso);
  return valor;
}

export function porFechaDesc<T>(campo: (item: T) => string): (a: T, b: T) => number {
  return (a, b) => {
    const fa = campo(a);
    const fb = campo(b);
    return fa < fb ? 1 : fa > fb ? -1 : 0;
  };
}
