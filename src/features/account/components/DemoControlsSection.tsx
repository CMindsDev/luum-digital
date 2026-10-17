import { useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { Button, Card, Field, Select, Switch } from "@/design-system";
import { useDemoControls, type RepositorioConError } from "@/services/demo-controls";

const LATENCIAS = [
  { valor: "0", etiqueta: "Sin espera (0 ms)" },
  { valor: "250", etiqueta: "Normal (250 ms)" },
  { valor: "1000", etiqueta: "Lenta (1 s)" },
  { valor: "3000", etiqueta: "Muy lenta (3 s)" },
];

const REPOSITORIOS: { valor: RepositorioConError; etiqueta: string }[] = [
  { valor: "ninguno", etiqueta: "Ninguno" },
  { valor: "catalog", etiqueta: "Catálogo de servicios" },
  { valor: "procedures", etiqueta: "Gestiones y pagos" },
  { valor: "reports", etiqueta: "Reportes" },
  { valor: "verifications", etiqueta: "Verificaciones" },
  { valor: "rewards", etiqueta: "Puntos y recompensas" },
  { valor: "digitalFile", etiqueta: "Expediente" },
  { valor: "wellbeing", etiqueta: "Bienestar" },
  { valor: "notifications", etiqueta: "Notificaciones" },
];

function esRepositorio(valor: string): valor is RepositorioConError {
  return REPOSITORIOS.some((opcion) => opcion.valor === valor);
}

/** Controles para revisar estados de carga, error y sin conexión en cada pantalla. */
export function DemoControlsSection() {
  const queryClient = useQueryClient();
  const simularSinConexion = useDemoControls((estado) => estado.simularSinConexion);
  const latenciaMs = useDemoControls((estado) => estado.latenciaMs);
  const forzarErrorEn = useDemoControls((estado) => estado.forzarErrorEn);
  const establecer = useDemoControls((estado) => estado.establecer);

  const aplicar = (cambios: Parameters<typeof establecer>[0]) => {
    establecer(cambios);
    // Las pantallas vuelven a consultar para mostrar el nuevo estado.
    void queryClient.invalidateQueries();
  };

  const latenciaActual = LATENCIAS.some((opcion) => opcion.valor === String(latenciaMs)) ? String(latenciaMs) : "250";
  const modificado = simularSinConexion || latenciaMs !== 250 || forzarErrorEn !== "ninguno";

  return (
    <Card as="section" aria-labelledby="titulo-controles" relleno="lg">
      <h2 id="titulo-controles" className="text-xl font-semibold text-marino">
        Controles de demostración
      </h2>
      <p className="mt-1 max-w-prose text-[0.9375rem] text-tinta-suave">
        Sirven para revisar cómo responde cada pantalla cuando no hay conexión, cuando todo tarda o cuando algo falla. No afectan a
        ningún sistema real.
      </p>
      <div className="mt-5 flex flex-col gap-5">
        <Switch
          etiqueta="Simular sin conexión"
          descripcion="Las pantallas con datos muestran el aviso de sin conexión y tus datos de demostración se conservan."
          activado={simularSinConexion}
          onCambiar={(activado) => aplicar({ simularSinConexion: activado })}
          guia="cuenta.simular_sin_conexion"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field etiqueta="Velocidad de respuesta" ayuda="Latencia artificial de los datos de demostración.">
            <Select
              value={latenciaActual}
              onChange={(evento) => aplicar({ latenciaMs: Number(evento.target.value) })}
              opciones={LATENCIAS}
              data-guia="cuenta.latencia"
            />
          </Field>
          <Field etiqueta="Forzar un error en" ayuda="Se restablece al recargar la página.">
            <Select
              value={forzarErrorEn}
              onChange={(evento) => {
                const valor = evento.target.value;
                if (esRepositorio(valor)) aplicar({ forzarErrorEn: valor });
              }}
              opciones={REPOSITORIOS}
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
            Volver a valores normales
          </Button>
        </div>
      </div>
    </Card>
  );
}
