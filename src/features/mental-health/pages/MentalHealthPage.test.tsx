import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { storeAsistenteGeneral } from "@/features/assistant/runtime";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ROTULO_ACOMPANANTE } from "../textos";
import MentalHealthPage from "./MentalHealthPage";

function contenidoAlmacenado(): string {
  const partes: string[] = [];
  for (const almacen of [window.localStorage, window.sessionStorage]) {
    for (let indice = 0; indice < almacen.length; indice += 1) {
      const clave = almacen.key(indice) ?? "";
      partes.push(clave, almacen.getItem(clave) ?? "");
    }
  }
  return partes.join("\n");
}

async function escribir(user: ReturnType<typeof renderWithProviders>["user"], texto: string) {
  await user.type(screen.getByRole("textbox", { name: "Escribe tu mensaje" }), texto);
  await user.click(screen.getByRole("button", { name: "Enviar" }));
}

describe("Salud mental", () => {
  it("muestra las cuatro entradas, el rótulo del acompañante y la ayuda inmediata", () => {
    renderWithProviders(<MentalHealthPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Salud mental" })).toBeInTheDocument();
    for (const entrada of ["Quiero hablar de cómo me siento", "Busco apoyo para alguien", "Quiero encontrar atención", "Necesito ayuda inmediata"]) {
      expect(screen.getAllByRole("button", { name: new RegExp(entrada) }).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(ROTULO_ACOMPANANTE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ayuda inmediata" })).toHaveAttribute("data-guia", "salud_mental.ayuda_inmediata");
  });

  it("«Necesito ayuda inmediata» abre la ayuda humana sin conversar", async () => {
    const { user } = renderWithProviders(<MentalHealthPage />);
    await user.click(screen.getByRole("button", { name: /Necesito ayuda inmediata.*sin conversar/ }));
    const hoja = await screen.findByRole("dialog", { name: "Ayuda inmediata" });
    expect(within(hoja).getAllByRole("link", { name: /Llamar/ })[0]).toHaveAttribute("href", "tel:911");
    expect(screen.queryByText(/Acompañante \(simulación\):/)).not.toBeInTheDocument();
  });

  it("ante palabras de riesgo muestra la ayuda humana de inmediato, antes de la respuesta", async () => {
    const { user } = renderWithProviders(<MentalHealthPage />);
    await escribir(user, "ya no quiero vivir");
    // La hoja se abre en el mismo gesto, sin esperar al acompañante.
    expect(await screen.findByRole("dialog", { name: "Ayuda inmediata" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Lo más importante ahora es hablar con una persona");
  });

  it("conversa con respuestas programadas y «Borrar conversación» la elimina sin guardarla", async () => {
    const { user } = renderWithProviders(<MentalHealthPage />);
    const mensaje = "Hoy tuve un día muy pesado en el trabajo";
    await user.click(screen.getAllByRole("button", { name: "Quiero hablar de cómo me siento" }).at(-1)!);
    await screen.findByText(/Gracias por darte este espacio/, undefined, { timeout: 3000 });
    await escribir(user, mensaje);
    const registro = screen.getByRole("log", { name: /Conversación con el acompañante/ });
    expect(within(registro).getByText(mensaje)).toBeInTheDocument();
    await within(registro).findByText(/Te leo\. Gracias por compartirlo/, undefined, { timeout: 3000 });

    // No se diagnostica ni se puntúa, y nada queda en el almacenamiento ni en el asistente general.
    expect(registro.textContent).not.toMatch(/diagn[oó]stico:|puntuaci[oó]n:|racha/i);
    expect(contenidoAlmacenado()).not.toContain("pesado");
    expect(JSON.stringify(storeAsistenteGeneral.getState().mensajes)).not.toContain("pesado");

    await user.click(screen.getByRole("button", { name: "Borrar conversación" }));
    await waitFor(() => expect(within(registro).queryByText(mensaje)).not.toBeInTheDocument());
    expect(screen.getByText("Conversación borrada de la memoria de esta pestaña.")).toBeInTheDocument();
  });

  it("«Quiero encontrar atención» lleva a la atención verificada (Alma Nova) con su fuente", async () => {
    const { user } = renderWithProviders(<MentalHealthPage />);
    await user.click(screen.getByRole("button", { name: /Quiero encontrar atención.*con cita/ }));
    const titulo = screen.getByRole("heading", { level: 2, name: "Dónde hay atención" });
    expect(titulo).toHaveFocus();
    expect(await screen.findByRole("heading", { name: "Apoyo Psicológico (centros Alma Nova)" })).toBeInTheDocument();
    expect(screen.getAllByText(/Ficha MID-BIH-007/).length).toBeGreaterThan(0);
    expect(screen.getByText(/no implica vigencia/)).toBeInTheDocument();
  });
});
