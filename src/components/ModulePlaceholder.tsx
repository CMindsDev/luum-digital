import { Construction, House } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { useMatches } from "react-router";
import { ButtonLink, DemoTag, EmptyState, PageHeader } from "@/design-system";
import { leerHandleMarcador } from "./handle-marcador";

export interface ModulePlaceholderProps {
  /** Carpeta del módulo pendiente (src/features/<modulo>). */
  modulo: string;
  /** Título (h1). Si no se da, se toma de `handle.titulo` de la ruta. */
  titulo?: string;
  descripcion?: string;
  /** Ruta del botón regresar. Si no se da, se toma de `handle.regresar`. */
  regresar?: string;
}

/**
 * Pantalla marcador de un módulo que aún no se implementa. Mantiene la navegación real y un h1
 * por pantalla para que el AppShell, las pruebas y el asistente funcionen desde el inicio.
 */
export function ModulePlaceholder({ modulo, titulo, descripcion, regresar }: ModulePlaceholderProps) {
  const { t } = useTranslation();
  const handle = leerHandleMarcador(useMatches());
  return (
    <>
      <PageHeader titulo={titulo ?? handle?.titulo ?? t("Sección en construcción")} descripcion={descripcion} regresar={regresar ?? handle?.regresar}>
        <DemoTag>{t("En construcción")}</DemoTag>
      </PageHeader>
      <EmptyState
        icono={Construction}
        titulo={t("Esta sección está en construcción")}
        descripcion={
          <Trans
            i18nKey="Falta el módulo <0>«{{modulo}}»</0> de este prototipo. Mientras tanto, puedes explorar las demás secciones desde el menú."
            values={{ modulo }}
            components={[<strong className="font-semibold text-tinta" />]}
          />
        }
        accion={
          <ButtonLink to="/" variante="secundario" iconoInicio={House}>
            {t("Ir al inicio")}
          </ButtonLink>
        }
      />
    </>
  );
}
