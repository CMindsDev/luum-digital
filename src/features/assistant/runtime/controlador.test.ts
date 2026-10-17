import { describe, expect, it, vi } from "vitest";
import type { AssistantProvider, EventoAsistente, OpcionesSesion, SesionAsistente } from "@/services/contracts";
import { DemoAssistantProvider } from "../providers/demo/DemoAssistantProvider";
import { ACTOR, crearRepositorios, pantallaDe } from "./__fixtures__/repositorios";
import { crearControladorAsistente } from "./controlador";
import { createAssistantStore } from "./store";

/** Proveedor falso cuya sesión puede cerrarse sola (como una red cortada en Realtime). */
class ProveedorFalso implements AssistantProvider {
  readonly modo = "openai_realtime" as const;
  readonly etiqueta = "Proveedor de prueba";
  readonly admiteVoz = false;
  readonly sesiones: Array<SesionAsistente & { cortar(): void; textos: string[] }> = [];

  async iniciar(opciones: OpcionesSesion) {
    const oyentes = new Set<(evento: EventoAsistente) => void>();
    const textos: string[] = [];
    const sesion = {
      ambito: opciones.ambito,
      textos,
      enviarTexto: (texto: string) => {
        textos.push(texto);
      },
      actualizarPantalla: () => undefined,
      entregarRecibo: () => undefined,
      cerrar: () => {
        for (const oyente of oyentes) oyente({ tipo: "estado", estado: "cerrado" });
        oyentes.clear();
      },
      suscribir: (oyente: (evento: EventoAsistente) => void) => {
        oyentes.add(oyente);
        return () => {
          oyentes.delete(oyente);
        };
      },
      cortar: () => {
        for (const oyente of [...oyentes]) {
          oyente({ tipo: "aviso", aviso: { tono: "critico", titulo: "Se cortó la conexión" } });
          oyente({ tipo: "estado", estado: "cerrado" });
        }
        oyentes.clear();
      },
    };
    this.sesiones.push(sesion);
    return sesion;
  }
}

function crear(proveedor: AssistantProvider) {
  const store = createAssistantStore("general");
  const navegar = vi.fn();
  const controlador = crearControladorAsistente({
    ambito: "general",
    proveedor,
    repositorios: crearRepositorios(),
    obtenerActor: () => ACTOR,
    navegar,
    obtenerPantalla: () => pantallaDe(),
    guardas: null,
    store,
  });
  return { controlador, store, navegar };
}

describe("crearControladorAsistente", () => {
  it("si la sesión se cierra sola, el siguiente mensaje abre una nueva (no se pierde en silencio)", async () => {
    const proveedor = new ProveedorFalso();
    const { controlador, store } = crear(proveedor);
    await controlador.enviarTexto("Hola");
    expect(proveedor.sesiones).toHaveLength(1);

    proveedor.sesiones[0]?.cortar();
    expect(controlador.sesion).toBeNull();
    expect(store.getState().avisos.map((aviso) => aviso.titulo)).toContain("Se cortó la conexión");

    await controlador.enviarTexto("¿Sigues ahí?");
    expect(proveedor.sesiones).toHaveLength(2);
    expect(proveedor.sesiones[1]?.textos).toEqual(["¿Sigues ahí?"]);
  });

  it("reconectar descarta la sesión vigente y abre otra conservando los mensajes", async () => {
    const proveedor = new ProveedorFalso();
    const { controlador, store } = crear(proveedor);
    await controlador.enviarTexto("Hola");
    const resultado = await controlador.reconectar();
    expect(resultado).toEqual({ ok: true });
    expect(proveedor.sesiones).toHaveLength(2);
    expect(store.getState().mensajes.map((mensaje) => mensaje.texto)).toEqual(["Hola"]);
  });

  it("silenciar sólo aplica a una llamada de OpenAI Realtime", async () => {
    const { controlador } = crear(new DemoAssistantProvider({ retrasoMs: 0 }));
    await controlador.iniciar();
    expect(controlador.silenciarVoz(true)).toBe(false);
  });

  it("con el proveedor demo prepara «Bache a la vista» y deja el recibo anclado tras el mensaje de la persona", async () => {
    const { controlador, store, navegar } = crear(new DemoAssistantProvider({ retrasoMs: 0 }));
    await controlador.enviarTexto("Quiero reportar un bache en la calle 60 del Centro");
    await vi.waitFor(() => expect(store.getState().recibos).toHaveLength(1));
    await vi.waitFor(() => expect(store.getState().mensajes).toHaveLength(2));
    const [recibo] = store.getState().recibos;
    expect(recibo).toMatchObject({ accion: "prepararReporte", estado: "preparada_para_confirmar" });
    expect(store.getState().anclasRecibos[recibo?.llamadaId ?? ""]).toBe(1);
    expect(navegar).toHaveBeenCalledWith("/reportes/nuevo/bache", expect.objectContaining({ prefill: expect.objectContaining({ categoria: "bache" }) }));
    controlador.cerrar();
    expect(store.getState().mensajes).toEqual([]);
  });
});
