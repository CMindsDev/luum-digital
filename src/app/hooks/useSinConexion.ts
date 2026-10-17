import { useSyncExternalStore } from "react";
import { useDemoControls } from "@/services/demo-controls";

function suscribir(aviso: () => void) {
  window.addEventListener("online", aviso);
  window.addEventListener("offline", aviso);
  return () => {
    window.removeEventListener("online", aviso);
    window.removeEventListener("offline", aviso);
  };
}

const enLinea = () => navigator.onLine;
const enLineaServidor = () => true;

/** true si no hay red (navigator.onLine) o si se simula sin conexión en «Cuenta de demostración». */
export function useSinConexion(): boolean {
  const simulada = useDemoControls((estado) => estado.simularSinConexion);
  const conRed = useSyncExternalStore(suscribir, enLinea, enLineaServidor);
  return simulada || !conRed;
}
