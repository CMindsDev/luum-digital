import { Building2, ExternalLink, Globe, Mail, Phone, Smartphone, type LucideIcon } from "lucide-react";
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

/** Número marcable para tel: (sólo dígitos y +). */
function numeroMarcable(valor: string): string {
  return valor.replace(/[^\d+]/g, "");
}

const CLASES_ENLACE = "inline-flex min-h-11 items-center gap-1.5 font-semibold break-words text-enlace underline underline-offset-2";

function AccionCanal({ canal }: { canal: CanalAtencion }) {
  if (!canal.verificado) {
    return <span className="break-all text-tinta">{canal.valor}</span>;
  }
  switch (canal.tipo) {
    case "telefono":
      return (
        <a href={`tel:${numeroMarcable(canal.valor)}`} className={CLASES_ENLACE}>
          <Phone aria-hidden="true" className="size-4 shrink-0" />
          Llamar al {canal.valor}
        </a>
      );
    case "correo":
      return (
        <a href={`mailto:${canal.valor}`} className={CLASES_ENLACE}>
          <Mail aria-hidden="true" className="size-4 shrink-0" />
          Escribir a {canal.valor}
        </a>
      );
    case "en_linea":
    case "app":
      return (
        <a href={canal.valor} target="_blank" rel="noopener noreferrer" className={CLASES_ENLACE}>
          {canal.tipo === "app" ? "Ver la app oficial" : "Abrir el sitio oficial"}
          <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
          <span className="sr-only">(se abre en otra pestaña)</span>
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
                {ETIQUETA_TIPO_CANAL[canal.tipo]} · <span className="font-semibold text-tinta">{canal.etiqueta}</span>
              </p>
              <div className="mt-0.5">
                <AccionCanal canal={canal} />
              </div>
              {canal.horario ? <p className="text-sm text-tinta-suave">Horario publicado: {canal.horario}</p> : null}
              {!canal.verificado ? (
                <Badge tono="aviso" className="mt-1.5">
                  Pendiente de verificar
                </Badge>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
