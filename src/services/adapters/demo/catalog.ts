import { buscarEnIndice, indexarServicio, type IndiceServicio } from "@/domain/busqueda";
import { detectarIntencion } from "@/domain/intencion";
import { CATEGORIAS } from "@/data/categorias";
import type { ServiceCatalogRepository } from "@/services/contracts";
import type { CoberturaCatalogo, FiltroCatalogo, Servicio } from "@/types";
import { operacionDemo, type ContextoDemo } from "./storage";

interface CatalogoCargado {
  servicios: readonly Servicio[];
  porId: Map<string, Servicio>;
  indice: IndiceServicio[];
  cobertura: CoberturaCatalogo;
}

let carga: Promise<CatalogoCargado> | null = null;

/** Carga diferida del catálogo (≈400 fichas): no entra en el paquete inicial. */
function cargarCatalogo(): Promise<CatalogoCargado> {
  carga ??= import("@/data/catalogo").then(({ SERVICIOS, COBERTURA_IMPORTACION }) => {
    const porId = new Map<string, Servicio>();
    for (const servicio of SERVICIOS) {
      porId.set(servicio.id, servicio);
      if (servicio.clave) porId.set(servicio.clave.toLowerCase(), servicio);
    }
    return {
      servicios: SERVICIOS,
      porId,
      indice: SERVICIOS.map((s) => indexarServicio(s, CATEGORIAS)),
      cobertura: COBERTURA_IMPORTACION,
    };
  });
  return carga;
}

function coincideFiltro(servicio: Servicio, filtro: FiltroCatalogo): boolean {
  if (filtro.categoria && servicio.categoria !== filtro.categoria && !servicio.categoriasSecundarias?.includes(filtro.categoria)) {
    return false;
  }
  if (filtro.estadoDeInformacion && servicio.estadoDeInformacion !== filtro.estadoDeInformacion) return false;
  if (filtro.tipoDeRecorrido && servicio.tipoDeRecorrido !== filtro.tipoDeRecorrido) return false;
  return true;
}

const ORDEN_INFORMACION = { verificada: 0, pendiente: 1, demostracion: 2 } as const;

export function crearCatalogoDemo(contexto: ContextoDemo): ServiceCatalogRepository {
  return {
    listCategories: () => operacionDemo(contexto, "catalog", "lectura", () => [...CATEGORIAS]),

    list: (filtro = {}) =>
      operacionDemo(contexto, "catalog", "lectura", () => cargarCatalogo()).then((catalogo) => {
        const texto = filtro.texto?.trim();
        if (texto) {
          return buscarEnIndice(texto, catalogo.indice, 200)
            .map((r) => r.servicio)
            .filter((s) => coincideFiltro(s, filtro));
        }
        return catalogo.servicios
          .filter((s) => coincideFiltro(s, filtro))
          .sort((a, b) => {
            // Primero la categoría principal, luego la información verificada, luego por nombre.
            const principalA = filtro.categoria && a.categoria === filtro.categoria ? 0 : 1;
            const principalB = filtro.categoria && b.categoria === filtro.categoria ? 0 : 1;
            return (
              principalA - principalB ||
              ORDEN_INFORMACION[a.estadoDeInformacion] - ORDEN_INFORMACION[b.estadoDeInformacion] ||
              a.nombre.localeCompare(b.nombre, "es")
            );
          });
      }),

    get: (id) =>
      operacionDemo(contexto, "catalog", "lectura", () => cargarCatalogo()).then(
        (catalogo) => catalogo.porId.get(id.trim().toLowerCase()) ?? null,
      ),

    search: (consulta) =>
      operacionDemo(contexto, "catalog", "lectura", () => cargarCatalogo()).then((catalogo) => {
        const resultados = buscarEnIndice(consulta, catalogo.indice, 20);
        return { consulta, intencion: detectarIntencion(consulta, { resultados }), resultados };
      }),

    coverage: () => operacionDemo(contexto, "catalog", "lectura", () => cargarCatalogo()).then((catalogo) => catalogo.cobertura),
  };
}
