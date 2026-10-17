import { Hourglass, Scale, ShieldCheck, UserX, type LucideIcon } from "lucide-react";
import { Card } from "@/design-system";

const PASOS: ReadonlyArray<{ icono: LucideIcon; titulo: string; texto: string }> = [
  {
    icono: Scale,
    titulo: "Se premia la calidad.",
    texto: "Decir que el problema persiste vale lo mismo que decir que parece reparado. Suman el comentario útil, confirmar el punto y la foto.",
  },
  {
    icono: Hourglass,
    titulo: "Primero, revisión.",
    texto: "Tus puntos quedan pendientes hasta que el operador de demostración revisa tu verificación.",
  },
  {
    icono: ShieldCheck,
    titulo: "Tu voto no cierra reportes.",
    texto: "El estado municipal lo informa el Ayuntamiento; tu verificación es otro dato, separado.",
  },
  {
    icono: UserX,
    titulo: "Nada de autoverificarse.",
    texto: "No puedes verificar tus propios reportes y cada reporte se verifica una sola vez por persona.",
  },
];

/** Reglas clave de la verificación ciudadana, en lenguaje claro. */
export function ComoFunciona() {
  return (
    <Card as="section" aria-labelledby="titulo-como-funciona" relleno="lg">
      <h2 id="titulo-como-funciona" className="text-lg font-semibold text-marino">
        ¿Cómo funciona?
      </h2>
      <ul className="mt-4 flex flex-col gap-4">
        {PASOS.map(({ icono: Icono, titulo, texto }) => (
          <li key={titulo} className="flex items-start gap-3 text-[0.9375rem] text-tinta">
            <Icono aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" />
            <span>
              <strong className="font-semibold">{titulo}</strong> {texto}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
