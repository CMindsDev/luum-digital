import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AyudaInmediata } from "@/components/ayuda/AyudaInmediata";
import { Button } from "@/design-system";

export interface BarraLineaMujerProps {
  onSalir: () => void;
  /** Id del texto que explica qué hace (y qué no) la salida rápida. */
  idExplicacion: string;
}

/**
 * Barra fija bajo el encabezado del AppShell con «Salida rápida» y «Ayuda inmediata»: siempre a la
 * mano al desplazarse. La explicación completa está en la página (idExplicacion).
 */
export function BarraLineaMujer({ onSalir, idExplicacion }: BarraLineaMujerProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-[calc(var(--altura-encabezado)+0.5rem)] z-30 mb-6">
      <div className="rounded-tarjeta border border-magenta/40 bg-superficie/95 p-2.5 shadow-elevada backdrop-blur-sm sm:px-4 sm:py-3">
        <div className="flex gap-2">
          <Button
            variante="primario"
            iconoInicio={LogOut}
            onClick={onSalir}
            aria-describedby={idExplicacion}
            data-guia="linea_mujer.salida_rapida"
            tamano="sm"
            className="flex-1"
          >
            {t("Salida rápida")}
          </Button>
          <AyudaInmediata enfoque="violencia" guia="linea_mujer.ayuda_inmediata" tamano="sm" className="flex-1" />
        </div>
        <p className="mt-2 hidden text-sm text-tinta-suave sm:block">
          {t("También puedes pulsar")}{" "}
          <kbd className="rounded border border-borde bg-superficie-2 px-1 font-mono text-[0.8125rem]">Esc</kbd>{" "}
          {t("dos veces. No borra tu historial ni garantiza ocultar tu actividad.")}
        </p>
      </div>
    </div>
  );
}
