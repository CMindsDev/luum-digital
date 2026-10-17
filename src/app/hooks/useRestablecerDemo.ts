import { useCallback, useState } from "react";
import { borrarDatosDemo } from "@/utils/almacenamiento";

/**
 * Restablece la demostración: borra todas las claves merida-demo:v1: y recarga en "/".
 * La recarga completa también limpia el estado en memoria (caché de consultas, asistente).
 */
export function useRestablecerDemo() {
  const [restableciendo, setRestableciendo] = useState(false);
  const restablecer = useCallback(() => {
    setRestableciendo(true);
    borrarDatosDemo();
    window.location.assign("/");
  }, []);
  return { restablecer, restableciendo };
}
