import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { RespuestaInteligente } from "./RespuestaInteligente";

const RESPUESTA_BASE = {
  respuesta: "Puedes iniciar el trámite en línea [1] y revisar los requisitos antes de avanzar [2].",
  generada: true,
  citas: [
    { n: 1, titulo: "Licencia de funcionamiento", url: "https://merida.gob.mx/licencias", ruta: "/servicios/licencia-funcionamiento", fechaConsulta: "2026-10-10" },
    { n: 2, titulo: "Requisitos del trámite", ruta: "/servicios/licencia-funcionamiento#requisitos", fechaConsulta: "2026-10-09" },
  ],
  pasajes: [
    {
      id: "pasaje-1",
      tipo: "servicio",
      titulo: "Licencia de funcionamiento",
      texto:
        "Reúne tu identificación, comprobante del domicilio del negocio y los documentos del predio. También revisa el apartado de costos y tiempos antes de enviar la solicitud.",
      fuente: { titulo: "Ficha del servicio", fechaConsulta: "2026-10-08" },
      ruta: "/servicios/licencia-funcionamiento",
    },
  ],
  intencion: { categoria: "consulta_tramite", modo: "shadow" },
} as const;

function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
}

function renderRespuesta(consulta: string) {
  return renderWithProviders(<RespuestaInteligente consulta={consulta} />, {
    ruta: "/buscar",
    patron: "/buscar",
    rutasExtra: [{ path: "*", element: <p>Destino</p> }],
  });
}

describe("RespuestaInteligente", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra un estado de carga compacto mientras consulta", async () => {
    let resolver!: (valor: Response) => void;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => {
      resolver = resolve;
    }));
    vi.stubGlobal("fetch", fetchMock);

    renderRespuesta("licencia de funcionamiento");

    expect(screen.getByRole("heading", { level: 2, name: "Respuesta de Pekito" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Buscando información…");

    resolver(respuestaJson(RESPUESTA_BASE));
    expect(await screen.findByText(/Puedes iniciar el trámite en línea/)).toBeInTheDocument();
  });

  it("convierte los marcadores en atajos accesibles y muestra fuentes y relacionados", async () => {
    const fetchMock = vi.fn(async () => respuestaJson(RESPUESTA_BASE));
    vi.stubGlobal("fetch", fetchMock);
    const { user } = renderRespuesta("licencia de funcionamiento");

    await screen.findByText(/Pekito puede equivocarse/);
    const region = screen.getByRole("region", { name: "Respuesta de Pekito" });
    const botonFuente = within(region).getByRole("button", { name: "Ir a la fuente 1" });
    await user.click(botonFuente);

    const fuentes = within(region).getByRole("heading", { name: "Fuentes" }).closest("section");
    expect(fuentes).not.toBeNull();
    if (!fuentes) return;
    const fuenteUno = within(fuentes).getByText(/\[1\] Licencia de funcionamiento/).closest("li");
    expect(fuenteUno).not.toBeNull();
    if (!fuenteUno) return;
    await waitFor(() => expect(fuenteUno).toHaveFocus());
    expect(within(fuenteUno).getByText(/Consultada el 10 de octubre de 2026/i)).toBeInTheDocument();
    expect(within(fuenteUno).getByRole("link", { name: "Abrir fuente oficial" })).toHaveAttribute("href", "https://merida.gob.mx/licencias");
    expect(within(fuenteUno).getByRole("link", { name: "Ver ficha en la app" })).toHaveAttribute("href", "/servicios/licencia-funcionamiento");

    const relacionados = within(region).getByRole("heading", { name: "Información relacionada" }).closest("section");
    expect(relacionados).not.toBeNull();
    if (!relacionados) return;
    expect(within(relacionados).getByText("Licencia de funcionamiento")).toBeInTheDocument();
    expect(within(relacionados).getByRole("link", { name: "Ver ficha en la app" })).toHaveAttribute("href", "/servicios/licencia-funcionamiento");
  });

  it("se oculta sin bloquear cuando la respuesta es nula o el servidor falla", async () => {
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(respuestaJson({ ...RESPUESTA_BASE, respuesta: null, pasajes: [], citas: [] }))
      .mockResolvedValueOnce(respuestaJson({ error: "Sin configuración" }, 503));
    vi.stubGlobal("fetch", fetchMock);

    const primera = renderWithProviders(<RespuestaInteligente consulta="licencia" />, {
      ruta: "/buscar",
      patron: "/buscar",
      rutasExtra: [{ path: "*", element: <p>Destino</p> }],
    });

    await waitFor(() => expect(screen.queryByRole("region", { name: "Respuesta de Pekito" })).not.toBeInTheDocument());

    primera.unmount();
    renderRespuesta("predial");
    await waitFor(() => expect(screen.queryByRole("region", { name: "Respuesta de Pekito" })).not.toBeInTheDocument());
  });

  it("muestra un mensaje amable cuando la consulta queda fuera de alcance", async () => {
    const fetchMock = vi.fn(async () =>
      respuestaJson({ ...RESPUESTA_BASE, respuesta: null, citas: [], pasajes: [], intencion: { categoria: "fuera_de_alcance", modo: "shadow" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderRespuesta("cuéntame un chiste");

    await screen.findByText(/Eso queda fuera de lo que puedo ayudarte aquí/);
    const region = screen.getByRole("region", { name: "Respuesta de Pekito" });
    expect(within(region).getByRole("link", { name: "Quiero reportar un bache" })).toBeInTheDocument();
  });

  it("no envía consultas sensibles", async () => {
    const fetchMock = vi.fn(async () => respuestaJson(RESPUESTA_BASE));
    vi.stubGlobal("fetch", fetchMock);

    renderRespuesta("Busco apoyo psicológico");

    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled());
    expect(screen.queryByRole("region", { name: "Respuesta de Pekito" })).not.toBeInTheDocument();
  });
});
