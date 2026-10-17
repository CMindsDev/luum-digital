import { useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Card, Field, Select, Switch } from "@/design-system";
import { msg } from "@/i18n";
import { useDemoControls, type RepositorioConError } from "@/services/demo-controls";

const LATENCIAS = [
  { valor: "0", etiqueta: msg("Sin espera (0 ms)") },
  { valor: "250", etiqueta: msg("Normal (250 ms)") },
  { valor: "1000", etiqueta: msg("Lenta (1 s)") },
  { valor: "3000", etiqueta: msg("Muy lenta (3 s)") },
] as const;

const REPOSITORIOS: { valor: RepositorioConError; etiqueta: string }[] = [
  { valor: "ninguno", etiqueta: msg("Ninguno") },
  { valor: "catalog", etiqueta: msg("Catálogo de servicios") },
  { valor: "procedures", etiqueta: msg("Gestiones y pagos") },
  { valor: "reports", etiqueta: msg("Reportes") },
  { valor: "verifications", etiqueta: msg("Verificaciones") },
  { valor: "rewards", etiqueta: msg("Puntos y recompensas") },
  { valor: "digitalFile", etiqueta: msg("Expediente") },
  { valor: "wellbeing", etiqueta: msg("Bienestar") },
  { valor: "notifications", etiqueta: msg("Notificaciones") },
];

function esRepositorio(valor: string): valor is RepositorioConError {
  return REPOSITORIOS.some((opcion) => opcion.valor === valor);
}

/** Controles para revisar estados de carga, error y sin conexión en cada pantalla. */
export function DemoControlsSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const simularSinConexion = useDemoControls((estado) => estado.simularSinConexion);
  const latenciaMs = useDemoControls((estado) => estado.latenciaMs);
  const forzarErrorEn = useDemoControls((estado) => estado.forzarErrorEn);
  const establecer = useDemoControls((estado) => estado.establecer);

  const aplicar = (cambios: Parameters<typeof establecer>[0]) => {
    establecer(cambios);
    void queryClient.invalidateQueries();
  };

  const latenciaActual = LATENCIAS.some((opcion) => opcion.valor === String(latenciaMs)) ? String(latenciaMs) : "250";
  const modificado = simularSinConexion || latenciaMs !== 250 || forzarErrorEn !== "ninguno";

  return (
    <Card as="section" aria-labelledby="titulo-controles" relleno="lg">
      <h2 id="titulo-controles" className="text-xl font-semibold text-marino">
        {t("Controles de demostración")}
      </h2>
      <p className="mt-1 max-w-prose text-[0.9375rem] text-tinta-suave">
        {t("Sirven para revisar cómo responde cada pantalla cuando no hay conexión, cuando todo tarda o cuando algo falla. No afectan a ningún sistema real.")}
      </p>
      <div className="mt-5 flex flex-col gap-5">
        <Switch
          etiqueta={t("Simular sin conexión")}
          descripcion={t("Las pantallas con datos muestran el aviso de sin conexión y tus datos de demostración se conservan.")}
          activado={simularSinConexion}
          onCambiar={(activado) => aplicar({ simularSinConexion: activado })}
          guia="cuenta.simular_sin_conexion"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field etiqueta={t("Velocidad de respuesta")} ayuda={t("Latencia artificial de los datos de demostración.")}>
            <Select
              value={latenciaActual}
              onChange={(evento) => aplicar({ latenciaMs: Number(evento.target.value) })}
              opciones={LATENCIAS.map((opcion) => ({ ...opcion, etiqueta: t(opcion.etiqueta) }))}
              data-guia="cuenta.latencia"
            />
          </Field>
          <Field etiqueta={t("Forzar un error en")} ayuda={t("Se restablece al recargar la página.")}>
            <Select
              value={forzarErrorEn}
              onChange={(evento) => {
                const valor = evento.target.value;
                if (esRepositorio(valor)) aplicar({ forzarErrorEn: valor });
              }}
              opciones={REPOSITORIOS.map((opcion) => ({ ...opcion, etiqueta: t(opcion.etiqueta) }))}
              data-guia="cuenta.forzar_error"
            />
          </Field>
        </div>
        <div>
          <Button
            variante="secundario"
            tamano="sm"
            iconoInicio={RotateCcw}
            disabled={!modificado}
            onClick={() => aplicar({ simularSinConexion: false, latenciaMs: 250, forzarErrorEn: "ninguno" })}
          >
            {t("Volver a valores normales")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
