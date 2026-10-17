import { afterEach, describe, expect, it, vi } from "vitest";
import type { NombreAccion } from "@shared/asistente/acciones";
import type { RespuestaGuardaAccion } from "@shared/asistente/servidor";
import { ACTOR, crearRepositorios, LICENCIA, pantallaDe, REPORTE } from "./__fixtures__/repositorios";
import { suscribirActuacion, type EventoActuacion } from "./acting-bus";
import { ejecutarAccion, fuentesDeRecibo, type ContextoEjecucion } from "./ejecutor";
import type { ClienteGuardas } from "./guardas";

function contexto(cambios: Partial<ContextoEjecucion> = {}) {
  const navegar = vi.fn<ContextoEjecucion["navegar"]>();
  const repositorios = crearRepositorios();
  const ctx: ContextoEjecucion = { ambito: "general", repositorios, actor: ACTOR, navegar, pantalla: pantallaDe(), ...cambios };
  return { contexto: ctx, navegar, repositorios };
}

function llamada(accion: NombreAccion, argumentos: unknown) {
  return { llamadaId: `llamada-${accion}`, accion, argumentos };
}

let dejarDeEscuchar: (() => void) | null = null;
afterEach(() => {
  dejarDeEscuchar?.();
  dejarDeEscuchar = null;
});

describe("ejecutarAccion", () => {
  it("rechaza argumentos inválidos sin ejecutar nada", async () => {
    const { contexto: ctx, navegar } = contexto();
    const recibo = await ejecutarAccion(llamada("prepararReporte", { categoria: "ovni" }), ctx);
    expect(recibo.estado).toBe("fallida");
    expect(recibo.mensaje).toMatch(/argumentos/i);
    expect(navegar).not.toHaveBeenCalled();

    const sinArgumentos = await ejecutarAccion(llamada("buscarServicios", null), ctx);
    expect(sinArgumentos.estado).toBe("fallida");
  });

  it("rechaza acciones fuera del ámbito: bienestar sólo puede mostrar ayuda y señalar", async () => {
    const { contexto: ctx, navegar, repositorios } = contexto({ ambito: "bienestar" });
    for (const accion of ["navegar", "buscarServicios", "prepararReporte", "consultarGestionesDemo"] as const) {
      const argumentos = accion === "navegar" ? { seccion: "inicio" } : accion === "buscarServicios" ? { consulta: "licencia" } : accion === "prepararReporte" ? { categoria: "bache" } : {};
      const recibo = await ejecutarAccion(llamada(accion, argumentos), ctx);
      expect(recibo.estado).toBe("fallida");
      expect(recibo.mensaje).toMatch(/no está disponible en este espacio/);
    }
    expect(navegar).not.toHaveBeenCalled();
    expect(repositorios.catalog.search).not.toHaveBeenCalled();

    const ayuda = await ejecutarAccion(llamada("mostrarApoyoHumano", { motivo: "salud_mental" }), ctx);
    expect(ayuda.estado).toBe("completada");
  });

  it("nivel B prepara con prefill y nunca envía: devuelve preparada_para_confirmar", async () => {
    const { contexto: ctx, navegar } = contexto();
    const recibo = await ejecutarAccion(
      llamada("prepararReporte", { categoria: "bache", descripcion: "Bache en la calle 60 del Centro.", referenciaUbicacion: "calle 60 del Centro" }),
      ctx,
    );
    expect(recibo.estado).toBe("preparada_para_confirmar");
    expect(navegar).toHaveBeenCalledWith("/reportes/nuevo/bache", {
      prefill: {
        tipo: "reporte",
        categoria: "bache",
        descripcion: "Bache en la calle 60 del Centro.",
        referenciaUbicacion: "calle 60 del Centro",
        origen: "asistente",
      },
    });

    const tramite = await ejecutarAccion(llamada("iniciarTramiteDemo", { servicioId: LICENCIA.id }), ctx);
    expect(tramite.estado).toBe("preparada_para_confirmar");
    expect(navegar).toHaveBeenLastCalledWith(`/servicios/${LICENCIA.id}/iniciar`, {
      prefill: { tipo: "tramite", servicioId: LICENCIA.id, origen: "asistente" },
    });
    // Ningún repositorio de escritura existe en el contexto: el ejecutor no puede enviar.
    expect(Object.keys(ctx.repositorios.reports)).toEqual(["list", "findByFolio"]);
  });

  it("en modo enforce, si la guarda pide preguntar, no prepara nada", async () => {
    const respuesta: RespuestaGuardaAccion = { probabilidad: 0.1, decision: "preguntar", modo: "enforce", aplica: true };
    const guardas: ClienteGuardas = { evaluarAccion: vi.fn(async () => respuesta), clasificarIntencion: vi.fn(async () => null) };
    const { contexto: ctx, navegar } = contexto({ guardas });
    const recibo = await ejecutarAccion(llamada("prepararReporte", { categoria: "luminaria" }), ctx);
    expect(recibo.estado).toBe("fallida");
    expect(navegar).not.toHaveBeenCalled();
    // Las acciones de nivel A no consultan la guarda.
    await ejecutarAccion(llamada("navegar", { seccion: "mapa" }), ctx);
    expect(guardas.evaluarAccion).toHaveBeenCalledTimes(1);
  });

  it("senalarElemento sólo acepta ids visibles en la pantalla actual", async () => {
    const eventos: EventoActuacion[] = [];
    dejarDeEscuchar = suscribirActuacion((evento) => eventos.push(evento));
    const { contexto: ctx } = contexto();
    const oculto = await ejecutarAccion(llamada("senalarElemento", { objetivo: "reportes.enviar" }), ctx);
    expect(oculto).toMatchObject({ estado: "fallida", mensaje: "Ese elemento no está visible ahora." });
    expect(eventos.some((evento) => evento.tipo === "point")).toBe(false);

    const visible = await ejecutarAccion(llamada("senalarElemento", { objetivo: "navegacion.mapa" }), ctx);
    expect(visible.estado).toBe("completada");
    expect(eventos).toContainEqual({ tipo: "point", objetivo: "navegacion.mapa", etiqueta: "Visor Urbano" });
    expect(eventos.map((evento) => evento.tipo)).toEqual(["intent", "run", "done", "intent", "run", "point", "done"]);
  });

  it("consultarReporte nunca inventa folios: dice que no lo encontró", async () => {
    const { contexto: ctx, navegar } = contexto();
    const inexistente = await ejecutarAccion(llamada("consultarReporte", { folio: "DEMO-R-9999999" }), ctx);
    expect(inexistente.estado).toBe("fallida");
    expect(inexistente.mensaje).toContain("No encontré un reporte con el folio DEMO-R-9999999");
    expect(JSON.stringify(inexistente)).not.toMatch(/DEMO-R-(?!9999999)\d+/);
    expect(navegar).not.toHaveBeenCalled();

    const formato = await ejecutarAccion(llamada("consultarReporte", { folio: "ABC-123" }), ctx);
    expect(formato.estado).toBe("fallida");

    const encontrado = await ejecutarAccion(llamada("consultarReporte", { folio: " demo-r-0000001 " }), ctx);
    expect(encontrado.estado).toBe("completada");
    expect(navegar).toHaveBeenCalledWith(`/reportes/${REPORTE.id}`);
    // Datos compactos: sin descripción, referencia ni identidad.
    const datos = JSON.stringify(encontrado.datos);
    expect(datos).toContain("En proceso de atención");
    expect(datos).not.toContain(REPORTE.descripcion);
    expect(datos).not.toContain(REPORTE.ubicacion.referencia);
    expect(datos).not.toContain("identidadId");

    const gestion = await ejecutarAccion(llamada("consultarReporte", { folio: "DEMO-G-0000007" }), ctx);
    expect(gestion.estado).toBe("completada");
    expect(JSON.stringify(gestion.datos)).not.toContain("Dato capturado privado");
  });

  it("consultarRequisitos devuelve requisitos con fuente o «pendiente de verificar»", async () => {
    const { contexto: ctx, navegar } = contexto();
    const verificada = await ejecutarAccion(llamada("consultarRequisitos", { servicioId: LICENCIA.id }), ctx);
    expect(verificada.estado).toBe("completada");
    expect(navegar).toHaveBeenCalledWith(`/servicios/${LICENCIA.id}`, { enfocar: "requisitos" });
    expect(JSON.stringify(verificada.datos)).toContain("Formato de solicitud de prueba");
    expect(fuentesDeRecibo(verificada)[0]).toMatchObject({ titulo: LICENCIA.fuenteOficial.nombre, estadoDeInformacion: "verificada" });

    const pendiente = await ejecutarAccion(llamada("consultarRequisitos", { servicioId: "agenda-cultural" }), ctx);
    expect(pendiente.mensaje).toMatch(/pendientes de verificar/);
    expect(pendiente.datos).toMatchObject({ requisitos: "pendiente de verificar", costo: "pendiente de verificar" });

    const inexistente = await ejecutarAccion(llamada("abrirServicio", { servicioId: "no-existe" }), ctx);
    expect(inexistente.estado).toBe("fallida");
  });

  it("buscarServicios devuelve hasta 5 resultados con id, nombre, estado y fuente, y abre /buscar", async () => {
    const { contexto: ctx, navegar } = contexto();
    const recibo = await ejecutarAccion(llamada("buscarServicios", { consulta: "licencia de funcionamiento" }), ctx);
    expect(recibo.estado).toBe("completada");
    expect(navegar).toHaveBeenCalledWith("/buscar?q=licencia%20de%20funcionamiento");
    expect(recibo.datos).toMatchObject({
      resultados: [{ id: LICENCIA.id, nombre: LICENCIA.nombre, estadoDeInformacion: "verificada", fuente: { nombre: LICENCIA.fuenteOficial.nombre } }],
    });
  });

  it("navega a las rutas acordadas y resume gestiones, recompensas y ayuda verificada", async () => {
    const { contexto: ctx, navegar } = contexto();
    await ejecutarAccion(llamada("navegar", { seccion: "mis_reportes" }), ctx);
    expect(navegar).toHaveBeenLastCalledWith("/reportes/mis-reportes");
    await ejecutarAccion(llamada("navegar", { seccion: "linea_mujer" }), ctx);
    expect(navegar).toHaveBeenLastCalledWith("/bienestar/linea-mujer");
    await ejecutarAccion(llamada("abrirMapa", { categoria: "bache", vista: "calor" }), ctx);
    expect(navegar).toHaveBeenLastCalledWith("/mapa?categoria=bache&vista=calor", {
      prefill: { tipo: "mapa", origen: "asistente", categoria: "bache", vista: "calor" },
    });

    const gestiones = await ejecutarAccion(llamada("consultarGestionesDemo", {}), ctx);
    expect(gestiones.datos).toMatchObject({ total: 1, recientes: [{ folio: "DEMO-G-0000007", estado: "En revisión" }] });
    expect(JSON.stringify(gestiones.datos)).not.toContain("Dato capturado privado");

    const beneficios = await ejecutarAccion(llamada("explicarBeneficiosDemo", {}), ctx);
    expect(navegar).toHaveBeenLastCalledWith("/participacion/recompensas");
    expect(beneficios.datos).toMatchObject({ saldo: { disponible: 25, pendientes: 10 } });

    const abrirApoyoHumano = vi.fn();
    const ayuda = await ejecutarAccion(llamada("mostrarApoyoHumano", { motivo: "salud_mental" }), { ...ctx, abrirApoyoHumano });
    expect(abrirApoyoHumano).toHaveBeenCalledWith("salud_mental");
    expect(JSON.stringify(ayuda.datos)).toContain("Línea de prueba verificada");
    expect(JSON.stringify(ayuda.datos)).not.toContain("Línea no verificada");
  });

  it("muestra ayuda humana aunque fallen los datos de bienestar", async () => {
    const { contexto: ctx, repositorios } = contexto();
    repositorios.wellbeing.listHelpLines.mockRejectedValueOnce(new Error("sin red"));
    const abrirApoyoHumano = vi.fn();
    const recibo = await ejecutarAccion(llamada("mostrarApoyoHumano", { motivo: "emergencia" }), { ...ctx, abrirApoyoHumano });
    expect(abrirApoyoHumano).toHaveBeenCalledWith("emergencia");
    expect(recibo.estado).toBe("completada");
  });

  it("traduce errores de los repositorios sin filtrar detalles internos", async () => {
    const { contexto: ctx, repositorios } = contexto();
    repositorios.procedures.list.mockRejectedValueOnce(new Error("detalle interno secreto"));
    const recibo = await ejecutarAccion(llamada("consultarGestionesDemo", {}), ctx);
    expect(recibo.estado).toBe("fallida");
    expect(recibo.mensaje).not.toContain("secreto");
  });
});
