import { beforeEach, describe, expect, it } from "vitest";
import { IDENTIDADES_DEMO } from "@/data/identidades";
import { PermisoDemoError, ReglaDeNegocioError, SinConexionError } from "@/services/contracts";
import { entradaReporte } from "@/test/fixtures";
import type { Repositories } from "@/services/contracts";
import type { IdentidadDemo } from "@/types";
import { crearRepositoriosDemo } from "./index";
import { crearContextoDemo, type ControlesSimulacion } from "./storage";

function almacenEnMemoria(): Storage {
  const datos = new Map<string, string>();
  return {
    get length() {
      return datos.size;
    },
    clear: () => datos.clear(),
    getItem: (k) => datos.get(k) ?? null,
    key: (i) => Array.from(datos.keys())[i] ?? null,
    removeItem: (k) => void datos.delete(k),
    setItem: (k, v) => void datos.set(k, v),
  };
}

const identidad = (id: string): IdentidadDemo => {
  const encontrada = IDENTIDADES_DEMO.find((i) => i.id === id);
  if (!encontrada) throw new Error(`Identidad ${id} no existe`);
  return encontrada;
};

const ana = identidad("ana");
const bruno = identidad("bruno");
const operador = identidad("operador");
const admin = identidad("admin");

let storage: Storage;
let controles: ControlesSimulacion;
let repos: Repositories;
let contador = 0;

beforeEach(() => {
  storage = almacenEnMemoria();
  controles = { sinConexion: false, latenciaMs: 0, forzarErrorEn: "ninguno" };
  contador = 0;
  repos = crearRepositoriosDemo(
    crearContextoDemo({
      storage: () => storage,
      ahora: () => new Date("2026-10-17T18:00:00.000Z"),
      controles: () => controles,
      nuevoId: (prefijo) => `${prefijo}-t${(contador += 1)}`,
    }),
  );
});

describe("reportes, puntos y operador (recorridos B, C, D)", () => {
  it("crear un reporte da folio DEMO-R, aparece en Mis reportes y deja puntos PENDIENTES", async () => {
    const reporte = await repos.reports.create(entradaReporte({ descripcion: "Bache grande frente a la escuela primaria" }), ana);
    expect(reporte.folio).toMatch(/^DEMO-R-\d{7}$/);
    expect(reporte.estadoMunicipal).toBe("registrado");
    const mios = await repos.reports.list({ identidadId: ana.id });
    expect(mios.map((r) => r.id)).toContain(reporte.id);
    expect(await repos.reports.findByFolio(reporte.folio.toLowerCase())).toMatchObject({ id: reporte.id });
    const saldoAntes = (await repos.rewards.getBalance(ana)).pendientes;
    expect(saldoAntes).toBeGreaterThanOrEqual(40);
    const disponible = (await repos.rewards.getBalance(ana)).disponible;
    expect(disponible).toBe(105); // semilla: los puntos del reporte nuevo no suman hasta validar
  });

  it("rechaza un reporte inválido (descripción corta o fuera de Mérida) sin crear nada", async () => {
    const antes = (await repos.reports.list()).length;
    await expect(repos.reports.create(entradaReporte({ descripcion: "corto" }), ana)).rejects.toBeInstanceOf(ReglaDeNegocioError);
    await expect(
      repos.reports.create(entradaReporte({ ubicacion: { lat: 19.4, lng: -99.1, referencia: "Calle 1 x 2 y 3", origen: "mapa" } }), ana),
    ).rejects.toBeInstanceOf(ReglaDeNegocioError);
    expect((await repos.reports.list()).length).toBe(antes);
  });

  it("encuentra el bache semilla de Bruno como posible duplicado y aportar NO crea reporte ni puntos", async () => {
    const duplicados = await repos.reports.findPossibleDuplicates({
      categoria: "bache",
      ubicacion: { lat: 20.9674, lng: -89.6243, referencia: "Calle 60 x 59 y 61", colonia: "Centro", origen: "manual" },
    });
    const semilla = duplicados.find((d) => d.reporte.id === "rep-0001");
    expect(semilla).toBeDefined();
    const reportesAntes = (await repos.reports.list()).length;
    const saldoAntes = await repos.rewards.getBalance(ana);
    const movimientosAntes = (await repos.rewards.listMovements(ana)).length;
    const actualizado = await repos.reports.addContribution("rep-0001", { descripcion: "Sigue creciendo y ya daña los autos", tieneFoto: false }, ana);
    expect(actualizado.aportaciones).toHaveLength(1);
    expect((await repos.reports.list()).length).toBe(reportesAntes);
    expect(await repos.rewards.getBalance(ana)).toEqual(saldoAntes);
    expect((await repos.rewards.listMovements(ana)).length).toBe(movimientosAntes);
  });

  it("sólo el operador valida: la validación aprueba los puntos una sola vez", async () => {
    const reporte = await repos.reports.create(entradaReporte({ descripcion: "Luminaria apagada desde hace semanas" }), ana);
    await expect(repos.reports.validate(reporte.id, ana)).rejects.toBeInstanceOf(PermisoDemoError);
    const validado = await repos.reports.validate(reporte.id, operador);
    expect(validado.estadoMunicipal).toBe("en_proceso");
    const tras = await repos.rewards.getBalance(ana);
    expect(tras.disponible).toBe(105 + 40);
    // Repetir la validación falla y NO duplica puntos.
    await expect(repos.reports.validate(reporte.id, operador)).rejects.toBeInstanceOf(ReglaDeNegocioError);
    expect((await repos.rewards.getBalance(ana)).disponible).toBe(145);
  });

  it("registrar atención deja el reporte «solucionado» y abre la verificación ciudadana", async () => {
    const enProceso = (await repos.reports.list({ estados: ["en_proceso"] }))[0];
    expect(enProceso).toBeDefined();
    if (!enProceso) return;
    await expect(repos.reports.registerAttention(enProceso.id, "Se rellenó", bruno)).rejects.toBeInstanceOf(PermisoDemoError);
    const resuelto = await repos.reports.registerAttention(enProceso.id, "Se rellenó con mezcla asfáltica", operador);
    expect(resuelto.estadoMunicipal).toBe("solucionado");
    expect(resuelto.verificacion).toBe("pendiente");
  });

  it("cancelar un reporte anula sus puntos pendientes y revierte los aprobados, con motivo", async () => {
    const reporte = await repos.reports.create(entradaReporte({ descripcion: "Basura acumulada en la esquina de la calle" , categoria: "basura_via_publica"}), ana);
    await repos.reports.validate(reporte.id, operador);
    expect((await repos.rewards.getBalance(ana)).disponible).toBe(145);
    const cancelado = await repos.reports.cancel(reporte.id, "no_procede", operador);
    expect(cancelado).toMatchObject({ estadoMunicipal: "cancelado", motivoCancelacion: "no_procede" });
    const saldo = await repos.rewards.getBalance(ana);
    expect(saldo.disponible).toBe(105);
    const movimientos = await repos.rewards.listMovements(ana);
    expect(movimientos.find((m) => m.tipo === "reversion")?.motivo).toContain(reporte.folio);
  });
});

describe("verificación ciudadana y recompensas (recorridos E y F)", () => {
  const entrada = (reporteId: string) => ({
    reporteId,
    resultado: "problema_persiste" as const,
    comentario: "El bache sigue ahí y el hueco se ve más grande que antes",
    ubicacionConfirmada: true,
    tieneFoto: false,
  });

  it("nadie verifica su propio reporte ni el mismo reporte dos veces", async () => {
    await expect(repos.verifications.submit(entrada("rep-0002"), ana)).rejects.toMatchObject({ codigo: "reporte_propio" });
    await repos.verifications.submit(entrada("rep-0002"), bruno);
    await expect(repos.verifications.submit(entrada("rep-0002"), bruno)).rejects.toMatchObject({ codigo: "ya_verificado" });
  });

  it("rechaza una verificación sin resultado válido", async () => {
    await expect(repos.verifications.submit({ ...entrada("rep-0002"), resultado: "otra" as never }, bruno)).rejects.toBeInstanceOf(ReglaDeNegocioError);
  });

  it("un reporte propio no aparece entre los verificables y uno ajeno solucionado sí", async () => {
    const deAna = await repos.verifications.listVerifiable(ana);
    expect(deAna.map((r) => r.id)).not.toContain("rep-0002");
    const deBruno = await repos.verifications.listVerifiable(bruno);
    expect(deBruno.map((r) => r.id)).toContain("rep-0002");
  });

  it("la verificación queda pendiente; al aprobarla se acreditan puntos UNA sola vez y el reporte no se cierra por voto", async () => {
    const verificacion = await repos.verifications.submit(entrada("rep-0002"), bruno);
    expect(verificacion.estadoRevision).toBe("pendiente_revision");
    const antes = await repos.rewards.getBalance(bruno);
    await expect(repos.verifications.approve(verificacion.id, bruno)).rejects.toBeInstanceOf(PermisoDemoError);
    await repos.verifications.approve(verificacion.id, operador);
    const tras = await repos.rewards.getBalance(bruno);
    expect(tras.disponible).toBeGreaterThan(antes.disponible);
    // Aprobar otra vez no duplica.
    await repos.verifications.approve(verificacion.id, operador);
    expect(await repos.rewards.getBalance(bruno)).toEqual(tras);
    const reporte = await repos.reports.get("rep-0002");
    expect(reporte?.estadoMunicipal).toBe("solucionado");
    expect(reporte?.verificacion).toBe("discrepancia");
  });

  it("rechazar exige motivo y cancela los puntos; revertir descuenta con motivo", async () => {
    const v1 = await repos.verifications.submit(entrada("rep-0002"), bruno);
    await expect(repos.verifications.reject(v1.id, "", operador)).rejects.toBeInstanceOf(ReglaDeNegocioError);
    await repos.verifications.reject(v1.id, "Comentario sin información útil", operador);
    const saldo = await repos.rewards.getBalance(bruno);
    expect(saldo.pendientes).toBe(40 + 30); // semilla: rep-0001 y ver-0002; la rechazada ya no cuenta

  });

  it("revertir una aprobación descuenta los puntos con un movimiento con motivo", async () => {
    const verificacion = await repos.verifications.submit(entrada("rep-0002"), bruno);
    await repos.verifications.approve(verificacion.id, operador);
    const conPuntos = (await repos.rewards.getBalance(bruno)).disponible;
    await expect(repos.verifications.revert(verificacion.id, " ", operador)).rejects.toBeInstanceOf(ReglaDeNegocioError);
    await repos.verifications.revert(verificacion.id, "Validación hecha por error", operador);
    expect((await repos.rewards.getBalance(bruno)).disponible).toBeLessThan(conPuntos);
    const reversion = (await repos.rewards.listMovements(bruno)).find((m) => m.tipo === "reversion");
    expect(reversion?.motivo).toContain("Validación hecha por error");
    expect((await repos.reports.get("rep-0002"))?.verificacion).toBe("pendiente");
  });

  it("canjear un beneficio ficticio actualiza el saldo y nunca lo deja negativo", async () => {
    const beneficios = await repos.rewards.listBenefits();
    const barato = [...beneficios].filter((b) => b.disponible).sort((a, b) => a.costoPuntos - b.costoPuntos)[0];
    expect(barato).toBeDefined();
    if (!barato) return;
    const antes = await repos.rewards.getBalance(ana);
    const canje = await repos.rewards.redeem(barato.id, ana);
    expect(canje.codigo).toMatch(/^DEMO-B-\d{7}$/);
    const despues = await repos.rewards.getBalance(ana);
    expect(despues.disponible).toBe(antes.disponible - barato.costoPuntos);
    expect(despues.totalCanjeado).toBe(antes.totalCanjeado + barato.costoPuntos);
    // Con el saldo restante ya no alcanza para otro igual.
    await expect(repos.rewards.redeem(barato.id, ana)).rejects.toMatchObject({ codigo: "saldo_insuficiente" });
    expect((await repos.rewards.getBalance(ana)).disponible).toBeGreaterThanOrEqual(0);
    expect(await repos.rewards.listRedemptions(ana)).toHaveLength(1);
    expect(await repos.rewards.listRedemptions(bruno)).toHaveLength(0);
  });

  it("los beneficios agotados y los puntos pendientes no permiten canjear", async () => {
    const agotado = (await repos.rewards.listBenefits()).find((b) => !b.disponible);
    expect(agotado).toBeDefined();
    if (agotado) await expect(repos.rewards.redeem(agotado.id, ana)).rejects.toBeInstanceOf(ReglaDeNegocioError);
    const caro = (await repos.rewards.listBenefits()).find((b) => b.costoPuntos > 105 && b.disponible);
    if (caro) await expect(repos.rewards.redeem(caro.id, ana)).rejects.toMatchObject({ codigo: "saldo_insuficiente" });
  });
});

describe("gestiones, pagos y citas simulados (recorrido A)", () => {
  it("guarda borrador, envía con folio DEMO-G y el envío es idempotente", async () => {
    const borrador = await repos.procedures.saveDraft(
      { servicioId: "mid-obp-275", identidadId: ana.id, tipo: "formulario", datos: { nombre: "Ana Ek" } },
      ana,
    );
    expect(borrador.estado).toBe("borrador");
    expect(borrador.folio).toBeNull();
    const enviada = await repos.procedures.submit(borrador.id, ana);
    expect(enviada.estado).toBe("enviada");
    expect(enviada.folio).toMatch(/^DEMO-G-\d{7}$/);
    const otraVez = await repos.procedures.submit(borrador.id, ana);
    expect(otraVez.folio).toBe(enviada.folio);
    expect((await repos.procedures.list(ana)).filter((g) => g.id === borrador.id)).toHaveLength(1);
    expect(await repos.procedures.findByFolio(enviada.folio ?? "", ana)).toMatchObject({ id: borrador.id });
  });

  it("cada identidad ve sólo sus gestiones", async () => {
    const borrador = await repos.procedures.saveDraft({ servicioId: "mid-obp-275", identidadId: ana.id, tipo: "formulario", datos: {} }, ana);
    expect(await repos.procedures.get(borrador.id, bruno)).toBeNull();
    await expect(repos.procedures.submit(borrador.id, bruno)).rejects.toThrow();
  });

  it("el pago es siempre «Pago simulado» y la cita sólo una solicitud simulada", async () => {
    const pago = await repos.procedures.simulatePayment({ concepto: "Predial de demostración", montoDemo: 100, metodo: "tarjeta_demo" }, ana);
    expect(pago.leyenda).toBe("Pago simulado");
    expect(pago.referencia).toMatch(/^DEMO-P-/);
    expect(pago.estado).toBe("simulado_aprobado");
    const rechazado = await repos.procedures.simulatePayment({ concepto: "x", montoDemo: 1, metodo: "referencia_demo", resultado: "rechazado" }, ana);
    expect(rechazado.estado).toBe("simulado_rechazado");
    const cita = await repos.procedures.requestAppointment({ servicioId: "mid-bih-016", fecha: "2026-11-02", hora: "10:00", sede: "Sede por confirmar" }, ana);
    expect(cita.estado).toBe("solicitud_simulada");
    expect(cita.referencia).toMatch(/^DEMO-C-/);
  });
});

describe("expediente, bienestar y notificaciones", () => {
  it("el expediente es ficticio y cada identidad ve el suyo; la confirmación antes de reutilizar no se puede desactivar", async () => {
    const perfil = await repos.digitalFile.getProfile(ana);
    expect(perfil.leyenda).toBe("Datos ficticios de demostración");
    expect(perfil.correo).toMatch(/@ejemplo\.mx$/);
    const docsAna = await repos.digitalFile.listDocuments(ana);
    expect(docsAna.every((d) => d.identidadId === ana.id)).toBe(true);
    expect(docsAna.every((d) => d.vistaPrevia.join(" ").includes("DOCUMENTO DE EJEMPLO"))).toBe(true);
    if (docsAna[0]) expect(await repos.digitalFile.getDocument(docsAna[0].id, bruno)).toBeNull();
    const privacidad = await repos.digitalFile.updatePrivacy({ notificacionesDiscretas: true }, ana);
    expect(privacidad.notificacionesDiscretas).toBe(true);
    expect(privacidad.confirmarAntesDeReutilizar).toBe(true);
  });

  it("la demanda de bienestar sólo la ven operador y administración y oculta celdas pequeñas", async () => {
    await expect(repos.wellbeing.getAggregatedDemand(ana)).rejects.toBeInstanceOf(PermisoDemoError);
    for (const actor of [operador, admin]) {
      const demanda = await repos.wellbeing.getAggregatedDemand(actor);
      expect(demanda.celdas.every((c) => c.conteo >= demanda.umbralMinimo)).toBe(true);
      expect(demanda.celdasOcultas).toBeGreaterThan(0);
      expect(demanda.leyenda).toMatch(/no provienen de conversaciones/i);
    }
  });

  it("bienestar no deja rastro: las solicitudes son simuladas y no se persiste nada ni se notifica", async () => {
    await repos.wellbeing.listHelpLines();
    const solicitud = await repos.wellbeing.requestSupportDemo("salud_mental");
    expect(solicitud.leyenda).toBe("Solicitud simulada: nadie la ha recibido");
    expect(solicitud.referencia).toMatch(/^DEMO-S-/);
    const claves = Array.from({ length: storage.length }, (_, i) => storage.key(i) ?? "");
    expect(claves.filter((k) => /bienestar|salud|mujer|apoyo/i.test(k))).toEqual([]);
    const notificaciones = await repos.notifications.list(ana);
    expect(notificaciones.some((n) => /salud mental|apoyo|bienestar/i.test(n.titulo))).toBe(false);
  });

  it("las líneas de ayuda ponen el 911 primero y no incluyen números no verificados", async () => {
    const lineas = await repos.wellbeing.listHelpLines();
    expect(lineas[0]?.telefono).toBe("911");
    const numeros = lineas.map((l) => l.telefonoMarcable).join(" ");
    for (const prohibido of ["9901010714", "9999999999", "9999230973"]) expect(numeros).not.toContain(prohibido);
    const almaNova = lineas.find((l) => l.id.includes("alma-nova"));
    expect(almaNova?.descripcion).toMatch(/no es una línea de crisis/i);
  });

  it("las notificaciones se marcan como leídas por identidad", async () => {
    const antes = await repos.notifications.list(ana);
    expect(antes.some((n) => !n.leida)).toBe(true);
    await repos.notifications.markRead(antes.find((n) => !n.leida)?.id ?? "", ana);
    await repos.notifications.markAllRead(ana);
    expect((await repos.notifications.list(ana)).every((n) => n.leida)).toBe(true);
    expect((await repos.notifications.list(bruno)).some((n) => !n.leida)).toBe(true);
  });
});

describe("estados de la demostración: sin conexión y errores forzados", () => {
  it("sin conexión fallan las escrituras pero siguen funcionando las lecturas locales", async () => {
    controles = { ...controles, sinConexion: true };
    await expect(repos.reports.create(entradaReporte(), ana)).rejects.toBeInstanceOf(SinConexionError);
    expect((await repos.reports.list()).length).toBeGreaterThan(0);
  });

  it("forzar un error en un repositorio lo hace fallar con un mensaje legible y no afecta a los demás", async () => {
    controles = { ...controles, forzarErrorEn: "reports" };
    await expect(repos.reports.list()).rejects.toThrow(/Error simulado/);
    expect(await repos.rewards.getRules()).toBeDefined();
  });
});

describe("catálogo", () => {
  it("expone la cobertura real sin declarar que están todos los servicios", async () => {
    const cobertura = await repos.catalog.coverage();
    expect(cobertura.totalImportado).toBe(cobertura.totalFuente);
    expect(cobertura.verificados + cobertura.pendientes + cobertura.demostracion).toBe(cobertura.totalImportado);
    expect(cobertura.pendientes).toBeGreaterThan(cobertura.verificados);
  });

  it("las seis consultas del brief producen una intención y acciones concretas", async () => {
    const casos: [string, string][] = [
      ["Quiero reportar un bache", "reportar"],
      ["Necesito saber qué documentos pide este trámite", "requisitos"],
      ["Quiero consultar mi folio", "consultar_folio"],
      ["Busco apoyo psicológico", "apoyo_psicologico"],
      ["Quiero revisar un trámite de mi negocio", "negocio"],
      ["Busco actividades culturales", "cultura"],
    ];
    for (const [consulta, intencion] of casos) {
      const respuesta = await repos.catalog.search(consulta);
      expect(respuesta.intencion.intencion, consulta).toBe(intencion);
      expect(respuesta.intencion.acciones.length, consulta).toBeGreaterThan(0);
    }
  });

  it("cada categoría pedida existe y tiene servicios: empleo, cultura, educación, deporte, negocios, pagos, regulaciones, visitas domiciliarias y atención ciudadana", async () => {
    const categorias = (await repos.catalog.listCategories()).map((c) => c.id);
    for (const id of ["empleo", "cultura", "educacion", "deporte", "negocios", "pagos", "regulaciones", "visitas_domiciliarias", "atencion_ciudadana"] as const) {
      expect(categorias, id).toContain(id);
    }
    for (const id of ["empleo", "cultura", "negocios", "pagos", "atencion_ciudadana"] as const) {
      expect((await repos.catalog.list({ categoria: id })).length, id).toBeGreaterThan(0);
    }
    expect((await repos.catalog.get("bache-a-la-vista"))?.nombre).toBe("Bache a la vista");
    expect((await repos.catalog.get("MID-OBP-275"))?.id).toBe("mid-obp-275");
  });
});
