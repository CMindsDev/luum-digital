import { Ban, EyeOff, Info, UserRound, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/design-system";
import { msg } from "@/i18n";

interface Punto {
  icono: LucideIcon;
  titulo: string;
  texto: string;
}

const PUNTOS: readonly Punto[] = [
  {
    icono: Info,
    titulo: msg("Es una demostración"),
    texto: msg(
      "El acompañante usa respuestas programadas y revisables. No es una persona, no es un servicio oficial y no es la mascota del Ayuntamiento. Este espacio no está conectado con ningún sistema municipal.",
    ),
  },
  {
    icono: Ban,
    titulo: msg("Lo que no hace"),
    texto: msg(
      "No diagnostica, no receta, no aplica cuestionarios clínicos ni da puntuaciones. No usa rachas, recompensas ni puntos, y nunca te hará sentir culpa por no escribir.",
    ),
  },
  {
    icono: EyeOff,
    titulo: msg("Tu privacidad"),
    texto: msg(
      "La conversación vive sólo en la memoria de esta pestaña: no se guarda en el dispositivo, no va a analítica ni a la URL, y no la ven el asistente general ni tu expediente sin tu consentimiento específico (este prototipo no lo pide). Aun así, no podemos prometer confidencialidad absoluta: alguien con acceso a este dispositivo podría ver la pantalla.",
    ),
  },
  {
    icono: UserRound,
    titulo: msg("Para personas adultas"),
    texto: msg(
      "Este espacio está pensado para personas adultas. Atender a niñas, niños y adolescentes requiere un diseño y una revisión específicos que este prototipo no tiene. Si eres menor de edad, busca a una persona adulta de confianza y, si estás en peligro, llama al 911.",
    ),
  },
];

/** Información sobre el espacio: límites, privacidad y población a la que se dirige. */
export function SobreEsteEspacio() {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="sobre-espacio-titulo" className="space-y-4">
      <h2 id="sobre-espacio-titulo" className="text-xl font-semibold text-marino sm:text-2xl">
        {t("Sobre este espacio")}
      </h2>
      <ul className="grid gap-3 md:grid-cols-2">
        {PUNTOS.map((punto) => {
          const Icono = punto.icono;
          return (
            <li key={punto.titulo}>
              <Card tono="suave" className="flex h-full items-start gap-3">
                <Icono aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" />
                <div>
                  <h3 className="font-semibold text-marino">{t(punto.titulo)}</h3>
                  <p className="mt-1 text-[0.9375rem] text-tinta">{t(punto.texto)}</p>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
