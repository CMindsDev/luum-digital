import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ExpertoAsistente } from "@shared/asistente/expertos";
import { AVATARES } from "./expertos";
import { ESTADOS_MASCOTA } from "./estado-mascota";
import { PekitoAnimado } from "./PekitoAnimado";

describe("avatares de orientación", () => {
  it.each(Object.keys(AVATARES) as ExpertoAsistente[])("%s conserva su recurso y proporción en los diez estados", (experto) => {
    const avatar = AVATARES[experto];
    for (const estado of ESTADOS_MASCOTA) {
      const { container, unmount } = render(<PekitoAnimado experto={experto} estado={estado} ancho={100} />);
      const figura = container.querySelector("svg");
      expect(figura).toHaveAttribute("data-estado", estado);
      expect(figura).toHaveAttribute("data-experto", experto);
      expect(figura).toHaveAttribute("aria-hidden", "true");
      const imagen = container.querySelector("image");
      expect(imagen).toHaveAttribute("href", `/brand/laboratorio/agente/${avatar.ruta}`);
      const proporcion = Number(imagen?.getAttribute("width")) / Number(imagen?.getAttribute("height"));
      expect(proporcion).toBeCloseTo(avatar.ancho / avatar.alto, 5);
      unmount();
    }
  });
});
