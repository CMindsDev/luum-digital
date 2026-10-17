import { IdCard, Mail, MapPin, Phone, UserRound, type LucideIcon } from "lucide-react";
import { Avatar, Card, DemoTag, ErrorState, KeyValueList, LoadingState } from "@/design-system";
import { useProfile } from "@/services/hooks";
import type { PerfilDemo } from "@/types";
import { EncabezadoSeccion } from "./EncabezadoSeccion";

const LEYENDA_PERFIL: PerfilDemo["leyenda"] = "Datos ficticios de demostración";

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("");
}

function domicilio({ calle, numero, colonia, codigoPostal }: PerfilDemo["domicilio"]): string {
  const vacio = (valor: string) => valor.trim() === "" || valor.trim() === "—";
  return [calle, vacio(numero) ? null : `núm. ${numero}`, vacio(colonia) ? null : colonia, vacio(codigoPostal) ? null : `C.P. ${codigoPostal}`]
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
  const perfil = useProfile();

  return (
    <Card as="section" id="perfil" aria-labelledby="titulo-perfil" relleno="lg" data-guia="expediente.perfil">
      <EncabezadoSeccion
        id="titulo-perfil"
        icono={IdCard}
        rotulo="Perfil"
        titulo="Perfil ficticio"
        extra={<DemoTag>{perfil.data?.leyenda ?? LEYENDA_PERFIL}</DemoTag>}
      />

      {perfil.isPending ? <LoadingState etiqueta="Cargando tu perfil de ejemplo…" variante="compacto" /> : null}

      {perfil.isError ? (
        <ErrorState error={perfil.error} nivel={3} titulo="No pudimos cargar tu perfil" onReintentar={() => void perfil.refetch()} />
      ) : null}

      {perfil.isSuccess ? (
        <>
          <div className="mb-5 flex items-center gap-3">
            <Avatar iniciales={iniciales(perfil.data.nombreCompleto)} tamano="lg" />
            <div className="min-w-0">
              <p className="text-lg leading-snug font-semibold break-words text-tinta">{perfil.data.nombreCompleto}</p>
              <p className="text-sm text-tinta-suave">Identidad de demostración</p>
            </div>
          </div>
          <KeyValueList
            items={[
              { id: "nombre", clave: <Clave icono={UserRound} texto="Nombre completo" />, valor: perfil.data.nombreCompleto },
              { id: "correo", clave: <Clave icono={Mail} texto="Correo electrónico" />, valor: perfil.data.correo },
              { id: "telefono", clave: <Clave icono={Phone} texto="Teléfono" />, valor: perfil.data.telefono },
              { id: "domicilio", clave: <Clave icono={MapPin} texto="Domicilio" />, valor: domicilio(perfil.data.domicilio) },
            ]}
          />
          <p className="mt-5 border-t border-borde pt-4 text-sm text-tinta-suave">
            En el prototipo el perfil no se edita. Para ver otro, cambia de identidad ficticia en «Cuenta de demostración».
          </p>
        </>
      ) : null}
    </Card>
  );
}
