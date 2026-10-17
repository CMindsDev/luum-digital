import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IconButtonLink } from "@/design-system";
import { useUnreadCount } from "@/services/hooks";

/** Campana del encabezado con el número de notificaciones sin leer de la identidad activa. */
export function NotificationBell() {
  const { t } = useTranslation();
  const sinLeer = useUnreadCount();
  const etiqueta = sinLeer > 0 ? t("Notificaciones, {{n}} sin leer", { n: sinLeer }) : t("Notificaciones");
  return <IconButtonLink to="/notificaciones" etiqueta={etiqueta} icono={Bell} variante="oscuro" insignia={sinLeer} data-guia="encabezado.notificaciones" />;
}
