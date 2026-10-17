// @vitest-environment node
import { describe, expect, it } from "vitest";
import { leerConfiguracion, MODELO_REALTIME_PREDETERMINADO, VOZ_PREDETERMINADA } from "./config";

describe("leerConfiguracion", () => {
  it("usa valores por defecto seguros sin variables", () => {
    const { config, variablesInvalidas } = leerConfiguracion({});
    expect(variablesInvalidas).toEqual([]);
    expect(config).toMatchObject({
      puerto: 8787,
      openaiApiKey: null,
      modeloRealtime: MODELO_REALTIME_PREDETERMINADO,
      voz: VOZ_PREDETERMINADA,
      maxSegundos: 900,
      maxIniciosHora: 20,
      cloudflareAccountId: null,
      cloudflareAiToken: null,
      clefModelo: "clef",
      clefTimeoutMs: 2500,
      guardas: "shadow",
      bienestarIaReal: false,
      origenesPermitidos: ["http://localhost:5173", "http://localhost:4173"],
    });
  });

  it("acota los números y conserva los valores válidos", () => {
    const { config } = leerConfiguracion({
      ASISTENTE_MAX_SEGUNDOS: "5",
      ASISTENTE_MAX_INICIOS_HORA: "999999",
      CLEF_TIMEOUT_MS: "100",
      PORT: "9000",
      ASISTENTE_GUARDAS: "ENFORCE",
      BIENESTAR_IA_REAL: "true",
      CLEF_MODEL: "clef-flash",
    });
    expect(config.maxSegundos).toBe(60);
    expect(config.maxIniciosHora).toBe(1000);
    expect(config.clefTimeoutMs).toBe(500);
    expect(config.puerto).toBe(9000);
    expect(config.guardas).toBe("enforce");
    expect(config.bienestarIaReal).toBe(true);
    expect(config.clefModelo).toBe("clef-flash");
  });

  it("informa sólo el nombre de las variables inválidas, nunca su valor", () => {
    const { config, variablesInvalidas } = leerConfiguracion({
      OPENAI_API_KEY: "clave con espacios",
      ASISTENTE_GUARDAS: "a veces",
      ASISTENTE_MAX_SEGUNDOS: "mucho",
      ORIGENES_PERMITIDOS: "javascript:alert(1)",
      BIENESTAR_IA_REAL: "quizá",
    });
    expect(config.openaiApiKey).toBeNull();
    expect(config.guardas).toBe("shadow");
    expect(config.maxSegundos).toBe(900);
    expect(config.bienestarIaReal).toBe(false);
    expect(config.origenesPermitidos).toEqual(["http://localhost:5173", "http://localhost:4173"]);
    expect(variablesInvalidas.sort()).toEqual(
      ["ASISTENTE_GUARDAS", "ASISTENTE_MAX_SEGUNDOS", "BIENESTAR_IA_REAL", "OPENAI_API_KEY", "ORIGENES_PERMITIDOS"].sort(),
    );
    expect(JSON.stringify(variablesInvalidas)).not.toContain("clave con espacios");
  });

  it("acepta una lista de orígenes separada por comas", () => {
    const { config } = leerConfiguracion({ ORIGENES_PERMITIDOS: "https://demo.ejemplo.mx, http://localhost:5173/" });
    expect(config.origenesPermitidos).toEqual(["https://demo.ejemplo.mx", "http://localhost:5173"]);
  });
});
