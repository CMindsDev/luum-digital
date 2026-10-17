import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { escribirEstadoVisor, leerEstadoVisor, type EstadoVisor } from "../estado-url";

/**
 * Estado del Visor en la URL. Los cambios reemplazan la entrada del historial (no la llenan de
 * pasos) y no mueven el desplazamiento: al volver desde un detalle, se recupera tal cual.
 */
export function useEstadoVisor() {
  const [parametros, setParametros] = useSearchParams();
  const estado = useMemo(() => leerEstadoVisor(parametros), [parametros]);

  const actualizar = useCallback(
    (cambios: Partial<EstadoVisor>) => {
      setParametros((actuales) => escribirEstadoVisor({ ...leerEstadoVisor(actuales), ...cambios }), {
        replace: true,
        preventScrollReset: true,
      });
    },
    [setParametros],
  );

  return { estado, actualizar };
}
