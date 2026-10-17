import { agregarPuntoArea } from "@/domain/area-operativa";
import type { Coordenadas } from "@/types";

export interface EstadoTrazado {
  vertices: Coordenadas[];
  anteriores: Coordenadas[][];
  modo: "trazar" | "mover";
  seleccionado: number | null;
  antesDeArrastrar: Coordenadas[] | null;
}
export const TRAZADO_INICIAL: EstadoTrazado = { vertices: [], anteriores: [], modo: "trazar", seleccionado: null, antesDeArrastrar: null };
export type AccionTrazado =
  | { tipo: "iniciar" | "reemplazar"; vertices: Coordenadas[] }
  | { tipo: "agregar"; punto: Coordenadas }
  | { tipo: "modo"; modo: EstadoTrazado["modo"] }
  | { tipo: "seleccionar" | "empezar_arrastre"; indice: number }
  | { tipo: "mover"; indice: number; punto: Coordenadas; provisional?: boolean }
  | { tipo: "terminar_arrastre"; indice: number; punto: Coordenadas }
  | { tipo: "deshacer" | "reiniciar" | "eliminar" };
function iguales(a: Coordenadas[], b: Coordenadas[]) {
  return a.length === b.length && a.every((p, i) => p.lat === b[i]?.lat && p.lng === b[i]?.lng);
}
function guardar(estado: EstadoTrazado, vertices: Coordenadas[]): EstadoTrazado {
  return iguales(estado.vertices, vertices) ? estado : { ...estado, vertices, anteriores: [...estado.anteriores, estado.vertices], seleccionado: null, antesDeArrastrar: null };
}
export function reducirTrazado(estado: EstadoTrazado, accion: AccionTrazado): EstadoTrazado {
  switch (accion.tipo) {
    case "iniciar": return { ...TRAZADO_INICIAL, vertices: [...accion.vertices] };
    case "reemplazar": return guardar(estado, [...accion.vertices]);
    case "agregar": return estado.modo === "trazar" ? guardar(estado, agregarPuntoArea(estado.vertices, accion.punto)) : estado;
    case "modo": return { ...estado, modo: accion.modo };
    case "seleccionar": return { ...estado, seleccionado: accion.indice };
    case "empezar_arrastre": return { ...estado, seleccionado: accion.indice, antesDeArrastrar: estado.vertices };
    case "mover": {
      const vertices = estado.vertices.map((p, i) => i === accion.indice ? accion.punto : p);
      return accion.provisional ? { ...estado, vertices } : { ...guardar(estado, vertices), seleccionado: accion.indice };
    }
    case "terminar_arrastre": {
      const vertices = estado.vertices.map((p, i) => i === accion.indice ? accion.punto : p);
      const base = estado.antesDeArrastrar ?? estado.vertices;
      return { ...estado, vertices, antesDeArrastrar: null, anteriores: iguales(base, vertices) ? estado.anteriores : [...estado.anteriores, base] };
    }
    case "reiniciar": return guardar(estado, []);
    case "eliminar": return estado.seleccionado === null ? estado : guardar(estado, estado.vertices.filter((_, i) => i !== estado.seleccionado));
    case "deshacer": {
      const vertices = estado.anteriores.at(-1);
      return vertices ? { ...estado, vertices, anteriores: estado.anteriores.slice(0, -1), seleccionado: null, antesDeArrastrar: null } : estado;
    }
  }
}
