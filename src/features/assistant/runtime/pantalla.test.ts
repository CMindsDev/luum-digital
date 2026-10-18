import { afterEach, describe, expect, it, vi } from "vitest";
import { LIMITES_PANTALLA, PantallaActualSchema } from "@shared/asistente/pantalla";
import { construirPantalla, observarPantalla, seccionDeRuta } from "./pantalla";

afterEach(() => {
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("construirPantalla", () => {
  it("ignora la interfaz del propio asistente (data-asistente-ui): ni controles, ni formulario, ni diálogo", () => {
    document.body.innerHTML = `
      <h1>Inicio</h1>
      <button data-guia="nav.reportes">Reportes</button>
      <div data-asistente-ui>
        <button data-guia="asistente.abrir">Peekito</button>
        <div role="dialog" aria-modal="true" aria-label="Peekito">
          <form aria-label="Escribe a Peekito"><textarea data-guia="asistente.mensaje">texto privado</textarea></form>
        </div>
      </div>
    `;
    const pantalla = construirPantalla({ rol: "ciudadania", ruta: "/" });
    expect(pantalla.objetivos).toEqual([{ id: "nav.reportes", etiqueta: "Reportes" }]);
    expect(pantalla.dialogoAbierto).toBeNull();
    expect(pantalla.formulario).toBeNull();
    expect(JSON.stringify(pantalla)).not.toContain("privado");
  });

  it("lee ruta, h1, sección, rol y controles data-guia con su etiqueta accesible", () => {
    document.body.innerHTML = `
      <h1>Reportes</h1>
      <a href="/reportes/nuevo/bache" data-guia="reportes.bache_a_la_vista">Bache a la vista</a>
      <button data-guia="reportes.mapa" aria-label="Ver en el mapa"><svg></svg></button>
      <label for="buscar">Buscar reporte</label><input id="buscar" data-guia="reportes.buscar" value="texto privado" />
    `;
    const pantalla = construirPantalla({ rol: "ciudadania", ruta: "/reportes?q=secreto" });
    expect(pantalla).toMatchObject({
      ruta: "/reportes",
      titulo: "Reportes",
      seccion: "reportes",
      rol: "ciudadania",
      dialogoAbierto: null,
      formulario: null,
    });
    expect(pantalla.objetivos).toEqual([
      { id: "reportes.bache_a_la_vista", etiqueta: "Bache a la vista" },
      { id: "reportes.mapa", etiqueta: "Ver en el mapa" },
      { id: "reportes.buscar", etiqueta: "Buscar reporte" },
    ]);
    expect(JSON.stringify(pantalla)).not.toContain("secreto");
    expect(JSON.stringify(pantalla)).not.toContain("texto privado");
    expect(PantallaActualSchema.safeParse(pantalla).success).toBe(true);
  });

  it("respeta los límites del esquema (objetivos, etiquetas y errores)", () => {
    const enlaces = Array.from({ length: 60 }, (_, i) => `<button data-guia="lista.item_${i}">${"Etiqueta muy larga ".repeat(10)}${i}</button>`).join("");
    const errores = Array.from({ length: 15 }, (_, i) => `<p role="alert">Error ${i}</p>`).join("");
    document.body.innerHTML = `<h1>${"Título ".repeat(40)}</h1>${enlaces}<form aria-label="Formulario largo">${errores}</form>`;
    const pantalla = construirPantalla({ rol: "operador", ruta: "/operador" });
    expect(pantalla.objetivos).toHaveLength(LIMITES_PANTALLA.objetivos);
    expect(pantalla.objetivos.every((objetivo) => objetivo.etiqueta.length <= 80)).toBe(true);
    expect(pantalla.titulo.length).toBeLessThanOrEqual(120);
    expect(pantalla.formulario?.errores).toHaveLength(LIMITES_PANTALLA.errores);
    expect(PantallaActualSchema.safeParse(pantalla).success).toBe(true);
  });

  it("excluye controles ocultos, inertes, aria-hidden, deshabilitados o con id inválido", () => {
    document.body.innerHTML = `
      <h1>Inicio</h1>
      <button data-guia="ok.visible">Visible</button>
      <button data-guia="no.hidden" hidden>Oculto</button>
      <div inert><button data-guia="no.inerte">Inerte</button></div>
      <div aria-hidden="true"><button data-guia="no.aria">Aria</button></div>
      <div style="display:none"><button data-guia="no.display">Display</button></div>
      <button data-guia="no.deshabilitado" disabled>Deshabilitado</button>
      <button data-guia="ID Inválido">Malo</button>
      <button data-guia="ok.visible">Repetido</button>
    `;
    const pantalla = construirPantalla({ rol: "ciudadania", ruta: "/" });
    expect(pantalla.objetivos).toEqual([{ id: "ok.visible", etiqueta: "Visible" }]);
  });

  it("con un diálogo modal abierto sólo cuenta lo que hay dentro", () => {
    document.body.innerHTML = `
      <h1>Ficha</h1>
      <button data-guia="ficha.iniciar">Iniciar</button>
      <div role="dialog" aria-modal="true" aria-labelledby="titulo-dialogo">
        <h2 id="titulo-dialogo">Usar datos de mi expediente</h2>
        <button data-guia="expediente.confirmar_reutilizar">Confirmar</button>
      </div>
    `;
    const pantalla = construirPantalla({ rol: "ciudadania", ruta: "/servicios/x/iniciar" });
    expect(pantalla.dialogoAbierto).toBe("Usar datos de mi expediente");
    expect(pantalla.objetivos).toEqual([{ id: "expediente.confirmar_reutilizar", etiqueta: "Confirmar" }]);
  });

  it("incluye los mensajes de error visibles del formulario, nunca los valores de los campos", () => {
    document.body.innerHTML = `
      <h1>Bache a la vista</h1>
      <form aria-label="Nuevo reporte" data-paso="Describe la incidencia">
        <label for="d">Descripción</label>
        <textarea id="d" aria-invalid="true" aria-describedby="d-ayuda d-error">Mi teléfono es 9991234567</textarea>
        <p id="d-ayuda">Entre 15 y 300 caracteres.</p>
        <p id="d-error">La descripción es muy corta.</p>
        <select data-guia="reporte.colonia"><option selected>Colonia privada</option></select>
        <input type="hidden" name="secreto" value="valor-oculto" />
      </form>
    `;
    const pantalla = construirPantalla({ rol: "ciudadania", ruta: "/reportes/nuevo/bache" });
    expect(pantalla.formulario).toEqual({ nombre: "Nuevo reporte", paso: "Describe la incidencia", errores: ["La descripción es muy corta."] });
    const serializada = JSON.stringify(pantalla);
    expect(serializada).not.toContain("9991234567");
    expect(serializada).not.toContain("Colonia privada");
    expect(serializada).not.toContain("valor-oculto");
    expect(serializada).not.toContain("Entre 15 y 300");
  });

  it("deriva la sección de la ruta con los nombres del registro", () => {
    expect(seccionDeRuta("/")).toBe("inicio");
    expect(seccionDeRuta("/reportes/mis-reportes")).toBe("mis_reportes");
    expect(seccionDeRuta("/bienestar/salud-mental")).toBe("salud_mental");
    expect(seccionDeRuta("/bienestar/linea-mujer")).toBe("linea_mujer");
    expect(seccionDeRuta("/servicios/abc")).toBe("servicios");
  });
});

describe("observarPantalla", () => {
  it("notifica con debounce y sólo cuando la instantánea cambia", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<h1>Inicio</h1>`;
    const alCambiar = vi.fn();
    const dejar = observarPantalla(alCambiar, { obtenerRol: () => "ciudadania", debounceMs: 100 });
    await vi.advanceTimersByTimeAsync(150);
    expect(alCambiar).toHaveBeenCalledTimes(1);

    const boton = document.createElement("button");
    boton.dataset.guia = "inicio.buscador";
    boton.textContent = "Buscar";
    document.body.append(boton);
    await vi.advanceTimersByTimeAsync(50);
    expect(alCambiar).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(100);
    expect(alCambiar).toHaveBeenCalledTimes(2);
    expect(alCambiar.mock.lastCall?.[0]).toMatchObject({ objetivos: [{ id: "inicio.buscador", etiqueta: "Buscar" }] });

    // Un cambio que no altera la instantánea no notifica.
    boton.className = "otra-clase";
    await vi.advanceTimersByTimeAsync(200);
    expect(alCambiar).toHaveBeenCalledTimes(2);
    dejar();
  });
});
