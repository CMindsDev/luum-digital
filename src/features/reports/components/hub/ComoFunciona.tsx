import { BadgeCheck, Inbox, Trophy } from "lucide-react";
import { Card } from "@/design-system";

const PUNTOS = [
  {
    icono: Inbox,
    titulo: "Estado municipal",
    texto: "Registrado, En proceso de atención, Solucionado o Cancelado: lo informa el Ayuntamiento (aquí, una simulación).",
  },
  {
    icono: BadgeCheck,
    titulo: "Verificación ciudadana",
    texto: "Tras la atención, otras personas pueden verificar si quedó resuelto. Un voto nunca cierra ni reabre un reporte.",
  },
  {
    icono: Trophy,
    titulo: "Puntos de demostración",
    texto: "Quedan pendientes al enviar y sólo se suman cuando el operador de demostración valida el reporte. Aportar a un reporte existente no da puntos.",
  },
];

/** Explicación breve de los dos ejes del reporte y de los puntos (sin inventar procesos oficiales). */
export function ComoFunciona() {
  return (
    <Card as="section" tono="crema" aria-labelledby="como-funciona">
      <h2 id="como-funciona" className="text-lg font-semibold text-marino">
        ¿Cómo se sigue un reporte?
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {PUNTOS.map(({ icono: Icono, titulo, texto }) => (
          <li key={titulo} className="flex items-start gap-3">
            <Icono aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" />
            <p className="text-[0.9375rem] text-tinta">
              <strong className="font-semibold">{titulo}. </strong>
              {texto}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
