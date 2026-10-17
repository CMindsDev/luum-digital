import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeAlert, CalendarCheck, CalendarX, ExternalLink, IdCard, Search, ShieldQuestion } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { z } from "zod";
import { useConsultaCredencialDemo } from "@/components/catalogo/datos-demo";
import { rutaFicha } from "@/components/catalogo";
import { useService } from "@/services/hooks";
import { Button, Card, DemoTag, ErrorState, Field, KeyValueList, LoadingState, TextInput, formatearFecha } from "@/design-system";
import type { Servicio } from "@/types";
import { ListaCanales } from "../components/ListaCanales";
import { ReferenciaOficial } from "../components/ReferenciaOficial";
import type { FlowProps } from "./tipos";

/** Fichas del catálogo con los canales oficiales para verificar una visita real. */
const ID_PADRON = "padron-visitadores";
const ID_REGISTRO = "registro-visitas-domiciliarias";
const ID_AYUNTATEL = "mid-pac-315";

const esquema = z.object({
  codigo: z.string().trim().min(4, "Escribe el código de la credencial.").max(30, "Usa como máximo 30 caracteres."),
});
type ValoresConsulta = z.infer<typeof esquema>;

function EnlaceOficial({ servicio }: { servicio: Servicio | null | undefined }) {
  if (!servicio) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
      <a
        href={servicio.fuenteOficial.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-enlace underline underline-offset-2"
      >
        {servicio.fuenteOficial.nombre}
        <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
        <span className="sr-only">(se abre en otra pestaña)</span>
      </a>
      <Link to={rutaFicha(servicio.id)} className="inline-flex min-h-11 items-center font-semibold text-enlace underline underline-offset-2">
        Ver la ficha en la app
      </Link>
    </span>
  );
}

/**
 * Recorrido «verificación» (visitas domiciliarias): consulta una credencial en un padrón FICTICIO
 * y explica cómo verificar a una persona real en el canal oficial. Nunca presenta una
 * identificación real como validada.
 */
export function VerificationFlow({ servicio }: FlowProps) {
  const [codigo, setCodigo] = useState<string | null>(null);
  const consulta = useConsultaCredencialDemo(codigo);
  const padron = useService(ID_PADRON);
  const registro = useService(ID_REGISTRO);
  const ayuntatel = useService(ID_AYUNTATEL);
  const form = useForm<ValoresConsulta>({ resolver: zodResolver(esquema), defaultValues: { codigo: "" } });
  const telefonosAyuntatel = ayuntatel.data?.canalesDeAtencion.filter((canal) => canal.tipo === "telefono" && canal.verificado) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <Card as="section" aria-labelledby="titulo-credencial" relleno="lg">
        <h2 id="titulo-credencial" className="flex items-center gap-2 text-xl font-semibold text-marino">
          <IdCard aria-hidden="true" className="size-6 text-azul" />
          Consulta una credencial de ejemplo
        </h2>
        <p className="mt-1 text-[0.9375rem] text-tinta">
          Practica cómo se consulta el padrón. Sólo funciona con credenciales <strong className="font-semibold">ficticias</strong> de esta
          demostración: no puede validar a ninguna persona real.
        </p>
        <form
          noValidate
          onSubmit={form.handleSubmit(({ codigo: valor }) => setCodigo(valor))}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <Field
            etiqueta="Código de la credencial"
            ayuda="Prueba con EJEMPLO-V-0001 a EJEMPLO-V-0005."
            error={form.formState.errors.codigo?.message}
            requerido
            className="min-w-0 flex-1"
          >
            <TextInput icono={IdCard} autoComplete="off" autoCapitalize="characters" placeholder="EJEMPLO-V-0001" {...form.register("codigo")} />
          </Field>
          <Button type="submit" iconoInicio={Search} cargando={consulta.isFetching} textoCargando="Consultando…" data-guia="servicios.consultar_credencial">
            Consultar
          </Button>
        </form>

        <div aria-live="polite" className="mt-4">
          {codigo === null ? null : consulta.isPending ? (
            <LoadingState etiqueta="Consultando el padrón de ejemplo…" variante="compacto" />
          ) : consulta.isError ? (
            <ErrorState error={consulta.error} nivel={3} onReintentar={() => void consulta.refetch()} />
          ) : !consulta.data.esCodigoDeEjemplo ? (
            <div className="flex items-start gap-3 rounded-boton border border-ambar bg-aviso-suave p-4">
              <ShieldQuestion aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-aviso" />
              <div className="text-[0.9375rem] text-tinta">
                <p className="font-semibold text-aviso">Este prototipo no valida credenciales reales</p>
                <p className="mt-1">
                  «{consulta.data.codigo}» no es un código de ejemplo. Para saber si una persona real está autorizada, consulta el padrón
                  oficial del Ayuntamiento (pasos abajo).
                </p>
              </div>
            </div>
          ) : consulta.data.visitador === null ? (
            <div className="flex items-start gap-3 rounded-boton border border-borde bg-fondo p-4">
              <BadgeAlert aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-tinta-suave" />
              <p className="text-[0.9375rem] text-tinta">No hay ninguna credencial de ejemplo con el código «{consulta.data.codigo}».</p>
            </div>
          ) : (
            <div className="rounded-tarjeta border-2 border-dashed border-ambar bg-ambar-suave p-4">
              <div className="flex flex-wrap items-center gap-2">
                <DemoTag>Persona ficticia de demostración</DemoTag>
              </div>
              <KeyValueList
                className="mt-3"
                items={[
                  { id: "nombre", clave: "Nombre (ficticio)", valor: consulta.data.visitador.nombre },
                  { id: "cargo", clave: "Cargo", valor: consulta.data.visitador.cargo },
                  { id: "unidad", clave: "Unidad", valor: consulta.data.visitador.unidad },
                  { id: "credencial", clave: "Credencial", valor: consulta.data.visitador.credencial },
                  {
                    id: "vigencia",
                    clave: "Vigencia de ejemplo",
                    valor: (
                      <span className="inline-flex items-center gap-1.5">
                        {consulta.data.visitador.vigente ? (
                          <CalendarCheck aria-hidden="true" className="size-4 text-exito" />
                        ) : (
                          <CalendarX aria-hidden="true" className="size-4 text-peligro" />
                        )}
                        {consulta.data.visitador.vigente
                          ? `Vigente hasta el ${formatearFecha(consulta.data.visitador.vigenciaHasta, "media")}`
                          : `Vencida el ${formatearFecha(consulta.data.visitador.vigenciaHasta, "media")}`}
                      </span>
                    ),
                  },
                ]}
              />
              <p className="mt-3 text-sm font-semibold text-tinta">
                Es un resultado de ejemplo: no valida a ninguna persona real. Verifica siempre en el padrón oficial.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card as="section" aria-labelledby="titulo-verificar-real" relleno="lg">
        <h2 id="titulo-verificar-real" className="text-xl font-semibold text-marino">
          Cómo verificar a una persona real
        </h2>
        <ol className="mt-4 flex flex-col gap-4">
          <li className="flex items-start gap-3">
            <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-marino text-sm font-bold text-white">
              1
            </span>
            <p className="pt-1 text-tinta">Pide ver su credencial y anota su nombre, su cargo y el número de credencial.</p>
          </li>
          <li className="flex items-start gap-3">
            <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-marino text-sm font-bold text-white">
              2
            </span>
            <div className="pt-1 text-tinta">
              <p>Búscala en el Padrón de Visitadoras y Visitadores del Portal Ciudadano.</p>
              <EnlaceOficial servicio={padron.data} />
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-marino text-sm font-bold text-white">
              3
            </span>
            <div className="pt-1 text-tinta">
              <p>Revisa en el Registro de Visitas Domiciliarias qué visitas existen, su objetivo, tus derechos y tus obligaciones.</p>
              <EnlaceOficial servicio={registro.data} />
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-marino text-sm font-bold text-white">
              4
            </span>
            <div className="min-w-0 flex-1 pt-1 text-tinta">
              <p>Si algo no coincide, no permitas el acceso y comunícate con el Ayuntamiento por un canal oficial.</p>
              {telefonosAyuntatel.length > 0 ? <ListaCanales canales={telefonosAyuntatel} className="mt-3" /> : null}
            </div>
          </li>
        </ol>
      </Card>

      <ReferenciaOficial servicio={servicio} />
    </div>
  );
}
