import { Building2, ExternalLink, Globe, Mail, Phone, Smartphone, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ETIQUETA_TIPO_CANAL } from "@/components/catalogo";
import { Badge, cx } from "@/design-system";
import type { CanalAtencion } from "@/types";

const ICONO_CANAL: Record<CanalAtencion["tipo"], LucideIcon> = {
  telefono: Phone,
  presencial: Building2,
  en_linea: Globe,
  correo: Mail,
  app: Smartphone,
};

function numeroMarcable(valor: string): string {
  return valor.replace(/[^\d+]/g, "");
}

const CLASES_ENLACE = "inline-flex min-h-11 items-center gap-1.5 font-semibold break-words text-enlace underline underline-offset-2";

function AccionCanal({ canal }: { canal: CanalAtencion }) {
  const { t } = useTranslation();

  if (!canal.verificado) {
    return <span className="break-all text-tinta">{canal.valor}</span>;
  }
  switch (canal.tipo) {
    case "telefono":
      return (
        <a href={`tel:${numeroMarcable(canal.valor)}`} className={CLASES_ENLACE}>
          <Phone aria-hidden="true" className="size-4 shrink-0" />
          {t("Llamar al {{valor}}", { valor: canal.valor })}
        </a>
      );
    case "correo":
      return (
        <a href={`mailto:${canal.valor}`} className={CLASES_ENLACE}>
          <Mail aria-hidden="true" className="size-4 shrink-0" />
          {t("Escribir a {{valor}}", { valor: canal.valor })}
        </a>
      );
    case "en_linea":
    case "app":
      return (
        <a href={canal.valor} target="_blank" rel="noopener noreferrer" className={CLASES_ENLACE}>
          {canal.tipo === "app" ? t("Ver la app oficial") : t("Abrir el sitio oficial")}
          <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
          <span className="sr-only">{t("(se abre en otra pestaña)")}</span>
        </a>
      );
    case "presencial":
      return <span className="text-tinta">{canal.valor}</span>;
  }
}

export interface ListaCanalesProps {
  canales: readonly CanalAtencion[];
  className?: string;
}

/**
 * Canales de atención publicados por la fuente. Sólo los verificados se muestran como acción
 * (tel:, mailto: o enlace externo que la persona elige abrir); los demás, como texto pendiente.
 */
export function ListaCanales({ canales, className }: ListaCanalesProps) {
  const { t } = useTranslation();

  return (
    <ul className={cx("divide-y divide-borde", className)}>
      {canales.map((canal, indice) => {
        const Icono = ICONO_CANAL[canal.tipo];
        return (
          <li key={`${canal.tipo}-${canal.valor}-${indice}`} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span aria-hidden="true" className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-boton bg-marino-suave text-marino">
              <Icono className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-tinta-suave">
                {t(ETIQUETA_TIPO_CANAL[canal.tipo])} · <span className="font-semibold text-tinta">{canal.etiqueta}</span>
              </p>
              <div className="mt-0.5">
                <AccionCanal canal={canal} />
              </div>
              {canal.horario ? <p className="text-sm text-tinta-suave">{t("Horario publicado: {{horario}}", { horario: canal.horario })}</p> : null}
              {!canal.verificado ? (
                <Badge tono="aviso" className="mt-1.5">
                  {t("Pendiente de verificar")}
                </Badge>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
