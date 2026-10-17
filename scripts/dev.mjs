// Levanta el servidor ligero (claves de proveedores) y Vite juntos; si uno termina, se detienen ambos.
import { spawn } from "node:child_process";

const children = [
  spawn(process.execPath, ["node_modules/tsx/dist/cli.mjs", "watch", "server/index.ts"], { stdio: "inherit" }),
  spawn(process.execPath, ["node_modules/vite/bin/vite.js", ...process.argv.slice(2)], { stdio: "inherit" }),
];

let stopping = false;
function stop() {
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of children) {
  child.on("exit", (code) => {
    if (!stopping) {
      stop();
      process.exitCode = code ?? 1;
    }
  });
}
