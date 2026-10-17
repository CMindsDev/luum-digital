import { Clock, Phone } from "lucide-react";
import { ProgramaBienestarCard } from "@/components/ayuda/ProgramaBienestarCard";
import { ErrorState, LoadingState } from "@/design-system";
import { useHelpLines, usePrograms, useServiceLocations } from "@/services/hooks";

const NOTAS: Readonly<Record<string, string>> = {
  "prog-refugio":
    "El sitio del Instituto de las Mujeres (captura del 27 de junio de 2026) indica que el refugio opera las 24 horas, los 365 días del año. No publica un teléfono propio del refugio.",
  "prog-app-linea-mujer": "Un enlace a la tienda no es una integración: este prototipo no se conecta con la app ni envía alertas.",
};

/**
 * Consultar información (sin abrir ningún canal): Línea Mujer, atención especializada, refugio y la
 * app oficial, con su fuente. El número aparece como texto: para llamar está «Abrir el canal oficial».
 */
export function InformacionLineaMujer() {
  const programas = usePrograms("mujeres");
  const ubicaciones = useServiceLocations();
  const lineas = useHelpLines();
  const lineaMujer = lineas.data?.find((linea) => linea.tipo === "violencia");

  if (programas.isPending) return <LoadingState variante="tarjetas" etiqueta="Cargando información de Línea Mujer…" />;
  if (programas.isError) {
    return <ErrorState nivel={3} error={programas.error} titulo="No se pudo cargar la información" onReintentar={() => void programas.refetch()} />;
  }

  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {programas.data.map((programa) => (
        <li key={programa.id}>
          <ProgramaBienestarCard programa={programa} ubicaciones={ubicaciones.data ?? []} nota={NOTAS[programa.id]}>
            {programa.id === "prog-linea-mujer" && lineaMujer ? (
              <div className="space-y-1 rounded-control bg-magenta-suave px-3 py-2 text-sm text-tinta">
                <p className="flex items-center gap-2">
                  <Phone aria-hidden="true" className="size-4 shrink-0 text-magenta-tinta" />
                  <span>
                    Número gratuito: <span className="font-semibold">{lineaMujer.telefono}</span>
                  </span>
                </p>
                {lineaMujer.disponibilidad ? (
                  <p className="flex items-center gap-2">
                    <Clock aria-hidden="true" className="size-4 shrink-0 text-magenta-tinta" />
                    <span>{lineaMujer.disponibilidad}</span>
                  </p>
                ) : null}
                <p className="text-tinta-suave">Para llamar, usa «Abrir el canal oficial».</p>
              </div>
            ) : null}
          </ProgramaBienestarCard>
        </li>
      ))}
    </ul>
  );
}
