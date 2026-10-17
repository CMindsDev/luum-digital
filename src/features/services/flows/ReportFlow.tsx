import { Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PuenteModulo } from "./PuenteModulo";
import type { FlowProps } from "./tipos";

function rutaDeReporte(rutaInterna: string): string {
  return rutaInterna === "/reportes" || rutaInterna.startsWith("/reportes/") ? rutaInterna : "/reportes";
}

export function ReportFlow({ servicio }: FlowProps) {
  const { t } = useTranslation();
  const ruta = rutaDeReporte(servicio.rutaInterna);
  const conCategoria = ruta.startsWith("/reportes/nuevo/");
  return (
    <PuenteModulo
      icono={Megaphone}
      titulo={conCategoria ? t("Haz tu reporte en Reportes") : t("Elige el tipo de reporte en Reportes")}
      descripcion={
        <>
          <p>
            {t("Como en Mérida Móvil: confirma la ubicación, describe el problema, agrega una foto si quieres y obtén un folio ")}
            <strong className="font-semibold">{t("DEMO-R")}</strong>
            {t(" sin validez oficial.")}
          </p>
          <p className="mt-2 text-tinta-suave">{t("Antes de enviar te mostramos si ya hay un reporte parecido cerca, para que puedas sumarte en lugar de duplicarlo.")}</p>
        </>
      }
      ruta={ruta}
      textoBoton={conCategoria ? t("Ir al formulario de reporte") : t("Ir a Reportes")}
      guia="servicios.ir_reporte"
    />
  );
}
