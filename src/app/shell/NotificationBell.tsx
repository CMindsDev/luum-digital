import { Bell } from "lucide-react";
import { IconButtonLink } from "@/design-system";
import { useUnreadCount } from "@/services/hooks";

/** Campana del encabezado con el número de notificaciones sin leer de la identidad activa. */
export function NotificationBell() {
  const sinLeer = useUnreadCount();
  const etiqueta = sinLeer > 0 ? `Notificaciones, ${sinLeer} sin leer` : "Notificaciones";
  return <IconButtonLink to="/notificaciones" etiqueta={etiqueta} icono={Bell} variante="oscuro" insignia={sinLeer} data-guia="encabezado.notificaciones" />;
}
