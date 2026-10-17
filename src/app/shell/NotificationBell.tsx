import { Bell } from "lucide-react";
import { IconButtonLink } from "@/design-system";

/**
 * Campana del encabezado. PENDIENTE: el conteo de no leídas usa useUnreadCount() de
 * "@/services/hooks" en cuanto exista la capa de hooks (F2).
 */
export function NotificationBell({ sinLeer = 0 }: { sinLeer?: number }) {
  const etiqueta = sinLeer > 0 ? `Notificaciones, ${sinLeer} sin leer` : "Notificaciones";
  return <IconButtonLink to="/notificaciones" etiqueta={etiqueta} icono={Bell} variante="oscuro" insignia={sinLeer} data-guia="encabezado.notificaciones" />;
}
