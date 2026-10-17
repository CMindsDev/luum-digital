import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createRepositories } from "@/services/registry";
import type { Repositories } from "@/services/contracts";
import { renderWithProviders } from "@/test/renderWithProviders";
import { AyudaInmediata } from "./AyudaInmediata";

function repositoriosConLineasFallidas(): Repositories {
  const base = createRepositories("demo");
  return { ...base, wellbeing: { ...base.wellbeing, listHelpLines: () => Promise.reject(new Error("falla simulada")) } };
}

describe("AyudaInmediata", () => {
  it("abre la hoja con el 911 primero y enlaces tel: que la persona toca", async () => {
    const { user } = renderWithProviders(<AyudaInmediata />);
    const boton = screen.getByRole("button", { name: "Ayuda inmediata" });
    expect(boton).toHaveAttribute("data-guia", "ayuda.inmediata");
    await user.click(boton);

    const hoja = await screen.findByRole("dialog", { name: "Ayuda inmediata" });
    await within(hoja).findByRole("heading", { name: "Línea Mujer" });
    const llamadas = within(hoja).getAllByRole("link", { name: /^Llamar/ });
    expect(llamadas[0]).toHaveAttribute("href", "tel:911");
    expect(llamadas.map((enlace) => enlace.getAttribute("href"))).toContain("tel:8004557672");
    // Línea de la Vida se muestra con su nota de verificación.
    expect(within(hoja).getByRole("heading", { name: "Línea de la Vida (CONASAMA)" })).toBeInTheDocument();
    expect(within(hoja).getByText(/Pendiente de verificar: confirma el número/)).toBeInTheDocument();
    // No simula que alguien atiende ni que se avisó a un equipo.
    expect(within(hoja).getByText(/no avisa a nadie/)).toBeInTheDocument();
  });

  it("en salud mental, Línea de la Vida va antes que Línea Mujer", async () => {
    const { user } = renderWithProviders(<AyudaInmediata enfoque="salud_mental" />);
    await user.click(screen.getByRole("button", { name: "Ayuda inmediata" }));
    const hoja = await screen.findByRole("dialog", { name: "Ayuda inmediata" });
    await within(hoja).findByRole("heading", { name: "Línea Mujer" });
    const titulos = within(hoja)
      .getAllByRole("heading", { level: 4 })
      .map((titulo) => titulo.textContent);
    expect(titulos.indexOf("Línea de la Vida (CONASAMA)")).toBeLessThan(titulos.indexOf("Línea Mujer"));
    expect(titulos[0]).toBe("Emergencias 911");
  });

  it("si las líneas no cargan, el 911 sigue disponible", async () => {
    const { user } = renderWithProviders(<AyudaInmediata />, { repositories: repositoriosConLineasFallidas() });
    await user.click(screen.getByRole("button", { name: "Ayuda inmediata" }));
    const hoja = await screen.findByRole("dialog", { name: "Ayuda inmediata" });
    expect(within(hoja).getByRole("link", { name: /Llamar al 911/ })).toHaveAttribute("href", "tel:911");
    await within(hoja).findByText("No se pudieron cargar las demás líneas");
    expect(within(hoja).getByRole("link", { name: /Llamar al 911/ })).toHaveAttribute("href", "tel:911");
  });

  it("variante tarjeta: llamar al 911 directo o abrir todas las líneas", async () => {
    const { user } = renderWithProviders(<AyudaInmediata variante="tarjeta" guia="bienestar.ayuda_inmediata" />);
    expect(screen.getByRole("heading", { level: 2, name: "¿Necesitas ayuda ahora?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Llamar al 911/ })).toHaveAttribute("href", "tel:911");
    await user.click(screen.getByRole("button", { name: "Ver líneas de ayuda" }));
    expect(await screen.findByRole("dialog", { name: "Ayuda inmediata" })).toBeInTheDocument();
  });

  it("modo controlado: se abre desde fuera y avisa al cerrar", async () => {
    let abierto = true;
    const { user } = renderWithProviders(<AyudaInmediata abierto onAbiertoChange={(valor) => (abierto = valor)} />);
    const hoja = await screen.findByRole("dialog", { name: "Ayuda inmediata" });
    await user.click(within(hoja).getByRole("button", { name: "Cerrar" }));
    await waitFor(() => expect(abierto).toBe(false));
  });
});
