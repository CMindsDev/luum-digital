/**
 * Arranque del servidor ligero: lee .env.local (sin imprimir valores), valida la configuración y
 * escucha sólo en 127.0.0.1. Vite (puerto 5173) lo alcanza con el proxy /api.
 */
import { existsSync } from "node:fs";
import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { cargarIndiceConocimiento } from "./conocimiento/cargar";
import { leerConfiguracion } from "./config";
import { crearRegistradorConsola } from "./registro";

const registrar = crearRegistradorConsola();

if (process.env.NODE_ENV !== "test" && existsSync(".env.local")) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    registrar("config_env_local_invalido", { archivo: ".env.local" });
  }
}

const { config, variablesInvalidas } = leerConfiguracion(process.env);
for (const variable of variablesInvalidas) registrar("config_variable_invalida", { variable });

const conocimiento = cargarIndiceConocimiento({ apiKey: config.openaiApiKey, registrar });
const app = createApp(config, { registrar, conocimiento });

const servidor = serve({ fetch: app.fetch, hostname: "127.0.0.1", port: config.puerto }, (info) => {
  registrar("servidor_listo", {
    url: `http://127.0.0.1:${info.port}`,
    realtime: config.openaiApiKey !== null,
    clef: config.cloudflareAccountId !== null && config.cloudflareAiToken !== null,
    guardas: config.guardas,
    conocimiento: conocimiento.tamano,
    conocimientoVectores: conocimiento.conVectores,
    bienestarIaReal: config.bienestarIaReal,
  });
});

let apagando = false;
async function apagar() {
  if (apagando) return;
  apagando = true;
  // Cuelga las llamadas abiertas para no dejarlas activas en el proveedor.
  await Promise.race([app.cerrar(), new Promise((resolver) => setTimeout(resolver, 3000))]);
  servidor.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
}

process.on("SIGINT", () => void apagar());
process.on("SIGTERM", () => void apagar());
