import { CONTADORES_INICIALES } from "@/domain/folios";
import { crearDocumentosSemilla } from "@/data/expediente";
import { crearGestionesSemilla, TOTAL_GESTIONES_CON_FOLIO } from "@/data/gestiones-semilla";
import { crearMovimientosSemilla } from "@/data/movimientos-semilla";
import { crearNotificacionesSemilla } from "@/data/notificaciones";
import { crearReportesSemilla, crearVerificacionesSemilla } from "@/data/reportes-semilla";
import type { ColeccionesDemo } from "./storage";

/** Estado inicial completo de la demostración, con fechas relativas a `ahora`. */
export function crearSemillaDemo(ahora: Date): ColeccionesDemo {
  const reportes = crearReportesSemilla(ahora);
  return {
    reportes,
    verificaciones: crearVerificacionesSemilla(ahora),
    movimientos: crearMovimientosSemilla(ahora),
    canjes: [],
    gestiones: crearGestionesSemilla(ahora),
    pagos: [],
    citas: [],
    documentos: crearDocumentosSemilla(ahora),
    privacidad: {},
    notificaciones: crearNotificacionesSemilla(ahora),
    folios: { ...CONTADORES_INICIALES, reporte: reportes.length, gestion: TOTAL_GESTIONES_CON_FOLIO },
  };
}
