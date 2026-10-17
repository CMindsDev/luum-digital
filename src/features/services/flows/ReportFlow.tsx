import { Megaphone } from "lucide-react";
import { PuenteModulo } from "./PuenteModulo";
import type { FlowProps } from "./tipos";

/** Ruta del formulario de reportes: la de la ficha si apunta a /reportes, si no la portada de Reportes. */
function rutaDeReporte(rutaInterna: string): string {
  return rutaInterna === "/reportes" || rutaInterna.startsWith("/reportes/") ? rutaInterna : "/reportes";
}

/**
 * Recorrido «reporte»: los reportes en la vía pública se hacen en el módulo de Reportes del
 * prototipo (como «Reportes rápidos» de Mérida Móvil), con folio DEMO-R.
 */
export function ReportFlow({ servicio }: FlowProps) {
  const ruta = rutaDeReporte(servicio.rutaInterna);
  const conCategoria = ruta.startsWith("/reportes/nuevo/");
  return (
    <PuenteModulo
      icono={Megaphone}
      titulo={conCategoria ? "Haz tu reporte en Reportes" : "Elige el tipo de reporte en Reportes"}
      descripcion={
        <>
          <p>
            Como en Mérida Móvil: confirma la ubicación, describe el problema, agrega una foto si quieres y obtén un folio{" "}
            <strong className="font-semibold">DEMO-R</strong> sin validez oficial.
          </p>
          <p className="mt-2 text-tinta-suave">
            Antes de enviar te mostramos si ya hay un reporte parecido cerca, para que puedas sumarte en lugar de duplicarlo.
          </p>
        </>
      }
      ruta={ruta}
      textoBoton={conCategoria ? "Ir al formulario de reporte" : "Ir a Reportes"}
      guia="servicios.ir_reporte"
    />
  );
}
