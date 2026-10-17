import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDemoSession } from "@/app/session/store";
import { IDENTIDADES_DEMO } from "@/data/identidades";
import { Avatar, Badge, Card, notificar, RadioCardGroup } from "@/design-system";
import { msg } from "@/i18n";
import type { Rol } from "@/types";

const ETIQUETA_ROL_LOCAL: Record<Rol, string> = {
  ciudadania: msg("Ciudadanía"),
  operador: msg("Operación"),
  administracion: msg("Administración"),
};

const DESCRIPCION_IDENTIDAD_LOCAL: Record<string, string> = {
  ana: msg("Ciudadana ficticia"),
  bruno: msg("Ciudadano ficticio"),
  operador: msg("Operadora de demostración"),
  admin: msg("Administración de demostración"),
};

/** Selector de identidad ficticia (no es autenticación municipal). */
export function IdentitySection() {
  const { t } = useTranslation();
  const navegar = useNavigate();
  const identidadId = useDemoSession((estado) => estado.identidadId);
  const cambiarIdentidad = useDemoSession((estado) => estado.cambiarIdentidad);

  const elegir = (id: string) => {
    if (id === identidadId) return;
    cambiarIdentidad(id);
    if (id === "admin" || id === "operador") navegar("/operador");
    const elegida = IDENTIDADES_DEMO.find((identidad) => identidad.id === id);
    if (elegida) notificar({ tono: "info", titulo: t("Ahora usas la demostración como {{nombre}}", { nombre: elegida.nombre }) });
  };

  return (
    <Card as="section" aria-labelledby="titulo-identidad" relleno="lg">
      <h2 id="titulo-identidad" className="text-xl font-semibold text-marino">
        {t("Identidad ficticia")}
      </h2>
      <p className="mt-1 max-w-prose text-[0.9375rem] text-tinta-suave">
        {t("Elige con quién quieres recorrer la demostración. ")}
        <strong className="font-semibold text-tinta">{t("No es una cuenta ni una autenticación municipal")}</strong>
        {t(": sólo cambia qué datos ficticios ves (reportes, gestiones, puntos) y qué acciones de operación tienes disponibles.")}
      </p>
      <RadioCardGroup
        className="mt-5"
        leyenda={t("Identidad activa")}
        ocultarLeyenda
        name="identidad-demo"
        columnas={2}
        guia="cuenta.identidad"
        valor={identidadId}
        onCambiar={elegir}
        opciones={IDENTIDADES_DEMO.map((identidad) => ({
          valor: identidad.id,
          etiqueta: identidad.nombre,
          descripcion: t(DESCRIPCION_IDENTIDAD_LOCAL[identidad.id] ?? identidad.descripcion),
          extra: (
            <span className="flex flex-col items-end gap-2">
              <Avatar iniciales={identidad.iniciales} tamano="sm" />
              <Badge tono={identidad.rol === "ciudadania" ? "azul" : "marino"}>{t(ETIQUETA_ROL_LOCAL[identidad.rol])}</Badge>
            </span>
          ),
        }))}
      />
    </Card>
  );
}
