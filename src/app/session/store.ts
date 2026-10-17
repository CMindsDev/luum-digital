import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { IDENTIDAD_INICIAL_ID, IDENTIDADES_DEMO } from "@/data/identidades";
import type { IdentidadDemo } from "@/types";
import { almacenamientoSeguro } from "@/utils/almacenamiento";

/**
 * Sesión de demostración compartida por toda la app (estado de interfaz).
 * No es autenticación: sólo elige cuál identidad ficticia está activa.
 */
interface DemoSessionState {
  identidadId: string;
  cambiarIdentidad: (id: string) => void;
}

export const useDemoSession = create<DemoSessionState>()(
  persist(
    (set) => ({
      identidadId: IDENTIDAD_INICIAL_ID,
      cambiarIdentidad: (id) => {
        if (IDENTIDADES_DEMO.some((identidad) => identidad.id === id)) set({ identidadId: id });
      },
    }),
    {
      name: "merida-demo:v1:sesion",
      storage: createJSONStorage(() => almacenamientoSeguro()),
    },
  ),
);

export function buscarIdentidad(id: string): IdentidadDemo {
  return IDENTIDADES_DEMO.find((identidad) => identidad.id === id) ?? IDENTIDADES_DEMO[0]!;
}

/** Identidad ficticia activa. */
export function useActiveIdentity(): IdentidadDemo {
  const identidadId = useDemoSession((state) => state.identidadId);
  return buscarIdentidad(identidadId);
}
