import { IdCard, Mail, MapPin, Phone, UserRound, type LucideIcon } from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Avatar, Card, DemoTag, ErrorState, KeyValueList, LoadingState } from "@/design-system";
import { msg } from "@/i18n";
import { useProfile } from "@/services/hooks";
import type { PerfilDemo } from "@/types";
import { EncabezadoSeccion } from "./EncabezadoSeccion";

const LEYENDA_PERFIL = msg("Datos ficticios de demostración");

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("");
}

function domicilio({ calle, numero, colonia, codigoPostal }: PerfilDemo["domicilio"], t: TFunction): string {
  const vacio = (valor: string) => valor.trim() === "" || valor.trim() === "—";
  return [
    calle,
    vacio(numero) ? null : t("núm. {{numero}}", { numero }),
    vacio(colonia) ? null : colonia,
    vacio(codigoPostal) ? null : t("C.P. {{codigoPostal}}", { codigoPostal }),
  ]
    .filter((parte): parte is string => Boolean(parte))
    .join(", ");
}

function Clave({ icono: Icono, texto }: { icono: LucideIcon; texto: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icono aria-hidden="true" className="size-4 shrink-0 text-tinta-suave" />
      {texto}
    </span>
  );
}

/** Perfil ficticio de la identidad activa (sólo lectura) con la leyenda de datos ficticios. */
export function PerfilSection() {
  const { t } = useTranslation();
  const perfil = useProfile();

  return (
    <Card as="section" id="perfil" aria-labelledby="titulo-perfil" relleno="lg" data-guia="expediente.perfil">
      <EncabezadoSeccion
        id="titulo-perfil"
        icono={IdCard}
        rotulo={t("Perfil")}
        titulo={t("Perfil ficticio")}
        extra={<DemoTag>{t(perfil.data?.leyenda ?? LEYENDA_PERFIL)}</DemoTag>}
      />

      {perfil.isPending ? <LoadingState etiqueta={t("Cargando tu perfil de ejemplo…")} variante="compacto" /> : null}

      {perfil.isError ? <ErrorState error={perfil.error} nivel={3} titulo={t("No pudimos cargar tu perfil")} onReintentar={() => void perfil.refetch()} /> : null}

      {perfil.isSuccess ? (
        <>
          <div className="mb-5 flex items-center gap-3">
            <Avatar iniciales={iniciales(perfil.data.nombreCompleto)} tamano="lg" />
            <div className="min-w-0">
              <p className="text-lg leading-snug font-semibold break-words text-tinta">{perfil.data.nombreCompleto}</p>
              <p className="text-sm text-tinta-suave">{t("Identidad de demostración")}</p>
            </div>
          </div>
          <KeyValueList
            items={[
              { id: "nombre", clave: <Clave icono={UserRound} texto={t("Nombre completo")} />, valor: perfil.data.nombreCompleto },
              { id: "correo", clave: <Clave icono={Mail} texto={t("Correo electrónico")} />, valor: perfil.data.correo },
              { id: "telefono", clave: <Clave icono={Phone} texto={t("Teléfono")} />, valor: perfil.data.telefono },
              { id: "domicilio", clave: <Clave icono={MapPin} texto={t("Domicilio")} />, valor: domicilio(perfil.data.domicilio, t) },
            ]}
          />
          <p className="mt-5 border-t border-borde pt-4 text-sm text-tinta-suave">
            {t("En el prototipo el perfil no se edita. Para ver otro, cambia de identidad ficticia en «Cuenta de demostración».")}
          </p>
        </>
      ) : null}
    </Card>
  );
}
