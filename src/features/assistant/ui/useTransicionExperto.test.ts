import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExpertoAsistente } from "@shared/asistente/expertos";
import { DURACION_MORPH_MS } from "./expertos";
import { useTransicionExperto } from "./useTransicionExperto";

function movimientoReducido(matches: boolean) {
  vi.stubGlobal("matchMedia", vi.fn((media: string) => ({
    matches, media, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
}

function montar(experto: ExpertoAsistente = "general") {
  return renderHook(({ tema }: { tema: ExpertoAsistente }) => useTransicionExperto(tema), { initialProps: { tema: experto } });
}

beforeEach(() => {
  vi.useFakeTimers();
  movimientoReducido(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("feedback del cambio de experto", () => {
  it("no anuncia un cambio al montar ni al repetir el mismo tema", () => {
    const { result, rerender } = montar();
    expect(result.current).toBe(false);
    rerender({ tema: "general" });
    expect(result.current).toBe(false);
  });

  it("acompaña todo el morph de 1.4 segundos, no sólo el inicio", () => {
    const { result, rerender } = montar();
    rerender({ tema: "urbano" });
    expect(result.current).toBe(true);
    act(() => vi.advanceTimersByTime(DURACION_MORPH_MS - 1));
    expect(result.current).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(false);
  });

  it("los cambios rápidos reinician el feedback sin que un temporizador anterior lo borre", () => {
    const { result, rerender, unmount } = montar();
    rerender({ tema: "urbano" });
    act(() => vi.advanceTimersByTime(800));
    rerender({ tema: "juridico" });
    act(() => vi.advanceTimersByTime(800));
    expect(result.current).toBe(true);
    act(() => vi.advanceTimersByTime(DURACION_MORPH_MS - 800));
    expect(result.current).toBe(false);
    rerender({ tema: "tramites" });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("con movimiento reducido el tema cambia sin un falso estado de espera", () => {
    movimientoReducido(true);
    const { result, rerender } = montar();
    rerender({ tema: "bienestar" });
    expect(result.current).toBe(false);
  });
});
