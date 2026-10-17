import { BookOpen, FlaskConical, LockKeyhole, ShieldCheck, Smartphone, Unplug } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { ButtonLink, Card, DemoTag, InfoStatusBadge, IntegrationBadge } from "@/design-system";
import { msg } from "@/i18n";

function Punto({ icono: Icono, titulo, children }: { icono: LucideIcon; titulo: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-boton bg-azul-suave text-azul">
        <Icono aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0">
        <h3 className="font-semibold text-marino">{titulo}</h3>
        <div className="mt-0.5 text-[0.9375rem] text-tinta">{children}</div>
      </div>
    </li>
  );
}

const DOCUMENTOS = [
  { ruta: "AGENTS.md", descripcion: msg("Reglas de producto y arquitectura") },
  { ruta: "docs/INVENTARIO_SERVICIOS.md", descripcion: msg("Servicios, fuentes oficiales y estado de verificación") },
  { ruta: "docs/INTEGRACIONES.md", descripcion: msg("Qué está simulado y qué haría falta para conectarlo") },
  { ruta: "docs/PRIVACIDAD_Y_SEGURIDAD.md", descripcion: msg("Qué se guarda, dónde y cómo se borra") },
];

/** Limitaciones del prototipo (destino del rótulo permanente «Prototipo de demostración»). */
export function AboutSection() {
  const { t } = useTranslation();

  return (
    <Card as="section" id="acerca" aria-labelledby="titulo-acerca" relleno="lg" className="scroll-mt-[calc(var(--altura-encabezado)+1rem)]">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="titulo-acerca" className="text-xl font-semibold text-marino">
          {t("Acerca de este prototipo")}
        </h2>
        <DemoTag />
      </div>
      <p className="mt-1 max-w-prose text-[0.9375rem] text-tinta-suave">
        <Trans i18nKey="Es un prototipo de demostración que une en una sola experiencia los servicios digitales del Ayuntamiento de Mérida. <strong>No realiza gestiones oficiales.</strong>" components={{ strong: <strong className="font-semibold text-tinta" /> }} />
      </p>
      <ul className="mt-6 flex flex-col gap-5">
        <Punto icono={FlaskConical} titulo={t("Qué es simulado")}>
          <Trans
            i18nKey="Reportes, gestiones, pagos, citas, verificaciones, puntos, canjes y notificaciones se simulan en este navegador. Sus folios empiezan con <code>DEMO-</code> y no tienen validez. Las identidades, el expediente y sus documentos son ficticios y llevan la marca «Documento de ejemplo». Los pagos dicen «Pago simulado» y nunca piden tarjetas reales."
            components={{ code: <code className="rounded bg-superficie-2 px-1 text-sm" /> }}
          />
        </Punto>
        <Punto icono={ShieldCheck} titulo={t("Qué está verificado")}>
          <p>{t("Cada servicio indica qué tan confiable es su información y enlaza su fuente oficial con la fecha de consulta. Lo que no se pudo contrastar se muestra como pendiente de verificar; nada se inventa (requisitos, costos, horarios ni teléfonos).")}</p>
          <p className="mt-2 flex flex-wrap gap-2">
            <InfoStatusBadge estado="verificada" />
            <InfoStatusBadge estado="pendiente" />
            <InfoStatusBadge estado="demostracion" />
          </p>
        </Punto>
        <Punto icono={Unplug} titulo={t("Sin integración ni autenticación municipal")}>
          <p>{t("No hay conexión con sistemas del Ayuntamiento ni una cuenta municipal común: elegir una identidad ficticia no es iniciar sesión. Un enlace a un portal oficial no es una integración; si se configura el modo real sin adaptador, la app muestra un error explícito en vez de un éxito ficticio.")}</p>
          <p className="mt-2">
            <IntegrationBadge estado="simulada" />
          </p>
        </Punto>
        <Punto icono={Smartphone} titulo={t("Instalar no es lo mismo que una app de tienda")}>
          {t("Puedes instalar este prototipo como aplicación web (PWA) en tu dispositivo, pero eso no equivale a una app publicada en tiendas. La app oficial del Ayuntamiento en tiendas es Mérida Móvil.")}
        </Punto>
        <Punto icono={LockKeyhole} titulo={t("Privacidad")}>
          {t("Lo que creas se guarda sólo en este navegador con datos ficticios y se borra con «Restablecer demostración». Las conversaciones de salud mental no se guardan, y la sección de Línea Mujer nunca envía alertas, ubicación ni mensajes reales.")}
        </Punto>
        <Punto icono={BookOpen} titulo={t("Documentación")}>
          <p>{t("Está en el repositorio del prototipo:")}</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {DOCUMENTOS.map((documento) => (
              <li key={documento.ruta}>
                <code className="rounded bg-superficie-2 px-1.5 py-0.5 text-sm text-tinta">{documento.ruta}</code>
                <span className="text-tinta-suave"> · {t(documento.descripcion)}</span>
              </li>
            ))}
          </ul>
        </Punto>
      </ul>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-borde pt-5">
        <ButtonLink href="https://merida.gob.mx/municipio/portal/index.php" variante="secundario" tamano="sm">
          {t("Portal del Ayuntamiento")}
        </ButtonLink>
        <ButtonLink href="https://portalciudadano.merida.gob.mx/" variante="secundario" tamano="sm">
          {t("Portal Ciudadano")}
        </ButtonLink>
        <ButtonLink href="https://apps.apple.com/mx/app/m%C3%A9rida-m%C3%B3vil/id1065129797" variante="secundario" tamano="sm">
          {t("Mérida Móvil en App Store")}
        </ButtonLink>
        <ButtonLink href="https://play.google.com/store/apps/details?id=app.meridamovil.com" variante="secundario" tamano="sm">
          {t("Mérida Móvil en Google Play")}
        </ButtonLink>
      </div>
    </Card>
  );
}
