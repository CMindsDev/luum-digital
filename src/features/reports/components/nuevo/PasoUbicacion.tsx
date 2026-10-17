import { CircleAlert, Info, LocateFixed, MapPinned, PencilLine } from "lucide-react";
import { useState } from "react";
import { Controller, useController, useFormContext, useWatch } from "react-hook-form";
import { Button, Field, RadioCardGroup, Select, TextInput, cx } from "@/design-system";
import { LEYENDA_COLONIAS, OPCIONES_COLONIA } from "../../lib/colonias";
import { LIMITES_CAMPOS, type ValoresReporte } from "../../lib/formulario";
import { solicitarUbicacionDispositivo } from "../../lib/geolocalizacion";
import { MapaUbicacion } from "./MapaUbicacion";

type EstadoDispositivo = { tipo: "inactivo" } | { tipo: "buscando" } | { tipo: "ok"; precisionMetros: number } | { tipo: "fallo"; mensaje: string };

const OPCIONES_MODO = [
  {
    valor: "manual" as const,
    etiqueta: "Escribir la dirección",
    descripcion: "Colonia o comisaría, calle y cruzamientos. Ubicación aproximada.",
    icono: PencilLine,
  },
  {
    valor: "mapa" as const,
    etiqueta: "Elegir en el mapa",
    descripcion: "Ajusta el marcador sobre el punto exacto.",
    icono: MapPinned,
  },
];

function CamposManuales() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ValoresReporte>();
  return (
    <div className="flex flex-col gap-4">
      <Field etiqueta="Colonia o comisaría" requerido error={errors.coloniaId?.message}>
        <Select {...register("coloniaId")} opciones={[...OPCIONES_COLONIA]} marcador="Elige la colonia o comisaría" data-guia="reportes.colonia" />
      </Field>
      <Field etiqueta="Calle" requerido ayuda="Por ejemplo: 60, o Avenida Itzáes." error={errors.calle?.message}>
        <TextInput {...register("calle")} maxLength={LIMITES_CAMPOS.calle} autoComplete="off" data-guia="reportes.calle" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field etiqueta="Cruzamiento 1" requerido error={errors.cruzamiento1?.message}>
          <TextInput {...register("cruzamiento1")} maxLength={LIMITES_CAMPOS.cruzamiento} autoComplete="off" data-guia="reportes.cruzamiento" />
        </Field>
        <Field etiqueta="Cruzamiento 2" opcional error={errors.cruzamiento2?.message}>
          <TextInput {...register("cruzamiento2")} maxLength={LIMITES_CAMPOS.cruzamiento} autoComplete="off" />
        </Field>
      </div>
      <Field
        etiqueta="Referencia"
        opcional
        ayuda="Algo que ayude a encontrarlo: frente al parque, junto a la tienda…"
        error={errors.referenciaAdicional?.message}
      >
        <TextInput {...register("referenciaAdicional")} maxLength={LIMITES_CAMPOS.referenciaAdicional} autoComplete="off" />
      </Field>
      <p className="flex items-start gap-2 rounded-control bg-superficie-2 px-3 py-2.5 text-sm text-tinta">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tinta-suave" />
        <span>
          <strong className="font-semibold">Ubicación aproximada:</strong> en el mapa se marcará el centro de la colonia. {LEYENDA_COLONIAS}
        </span>
      </p>
    </div>
  );
}

function CamposMapa({ onUsarDireccion }: { onUsarDireccion: () => void }) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ValoresReporte>();
  // El ref de «lat» apunta al resumen del punto: si falta el punto, «Continuar» lo enfoca.
  const {
    field: { ref: enfocarPunto },
  } = useController({ control, name: "lat" });
  const [lat, lng] = useWatch({ control, name: ["lat", "lng"] });
  const errorPunto = errors.lat?.message ?? errors.lng?.message;
  const valor = lat !== null && lng !== null ? { lat, lng } : null;

  return (
    <div className="flex flex-col gap-4">
      <MapaUbicacion
        valor={valor}
        onCambiar={(coordenadas) => {
          setValue("lat", coordenadas.lat, { shouldValidate: Boolean(errorPunto) });
          setValue("lng", coordenadas.lng, { shouldValidate: Boolean(errorPunto) });
          setValue("origenCoordenadas", "mapa");
        }}
        onUsarDireccion={onUsarDireccion}
      />
      {/* Destino del foco si falta el punto (el selector ya muestra la ubicación marcada). */}
      <div
        ref={enfocarPunto}
        tabIndex={-1}
        className={cx("rounded-control outline-none focus-visible:outline-3 focus-visible:outline-foco", errorPunto && "bg-peligro-suave px-3 py-2.5")}
      >
        {errorPunto ? (
          <p role="alert" className="flex items-start gap-2 text-sm font-medium text-peligro">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {errorPunto}
          </p>
        ) : null}
      </div>
      <Field
        etiqueta="Referencia del lugar"
        requerido
        ayuda="Calle y cruzamientos o un lugar cercano. Por ejemplo: Calle 60 x 59 y 61."
        error={errors.referenciaMapa?.message}
      >
        <TextInput {...register("referenciaMapa")} maxLength={LIMITES_CAMPOS.referenciaMapa} autoComplete="off" data-guia="reportes.referencia" />
      </Field>
      <Field etiqueta="Colonia o comisaría" opcional ayuda="Ayuda a encontrar reportes iguales." error={errors.coloniaId?.message}>
        <Select {...register("coloniaId")} opciones={[...OPCIONES_COLONIA]} marcador="Sin especificar" />
      </Field>
    </div>
  );
}

/**
 * Paso 2: ubicación escrita (colonia, calle y cruzamientos; aproximada), en el mapa o con la
 * ubicación del dispositivo. El permiso de ubicación sólo se pide tras tocar «Usar mi ubicación»;
 * si se rechaza o falla, se explica y la persona sigue con la dirección o el mapa.
 */
export function PasoUbicacion() {
  const { control, setValue, clearErrors } = useFormContext<ValoresReporte>();
  const modo = useWatch({ control, name: "modoUbicacion" });
  const [dispositivo, setDispositivo] = useState<EstadoDispositivo>({ tipo: "inactivo" });

  const cambiarModo = (nuevo: ValoresReporte["modoUbicacion"]) => {
    clearErrors();
    setValue("modoUbicacion", nuevo);
  };

  const usarMiUbicacion = async () => {
    setDispositivo({ tipo: "buscando" });
    const resultado = await solicitarUbicacionDispositivo();
    if (!resultado.ok) {
      setDispositivo({ tipo: "fallo", mensaje: resultado.mensaje });
      return;
    }
    clearErrors();
    setValue("lat", resultado.coordenadas.lat);
    setValue("lng", resultado.coordenadas.lng);
    setValue("origenCoordenadas", "dispositivo");
    setValue("modoUbicacion", "mapa");
    setDispositivo({ tipo: "ok", precisionMetros: resultado.precisionMetros });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 rounded-tarjeta border border-borde bg-superficie p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.9375rem] text-tinta">
            ¿Estás en el lugar? Usa tu ubicación. <span className="text-tinta-suave">Sólo pedimos permiso cuando tocas el botón.</span>
          </p>
          <Button
            variante="secundario"
            iconoInicio={LocateFixed}
            cargando={dispositivo.tipo === "buscando"}
            textoCargando="Buscando tu ubicación…"
            onClick={() => void usarMiUbicacion()}
            data-guia="reportes.usar_mi_ubicacion"
          >
            Usar mi ubicación
          </Button>
        </div>
        <div role="status" aria-live="polite">
          {dispositivo.tipo === "fallo" ? (
            <p className="flex items-start gap-2 rounded-control border border-ambar bg-aviso-suave px-3 py-2.5 text-sm text-tinta">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-aviso" />
              {dispositivo.mensaje}
            </p>
          ) : null}
          {dispositivo.tipo === "ok" ? (
            <p className="flex items-start gap-2 rounded-control border border-exito/25 bg-exito-suave px-3 py-2.5 text-sm text-tinta">
              <LocateFixed aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-exito" />
              Usamos la ubicación de tu dispositivo
              {dispositivo.precisionMetros > 0 ? ` (precisión aproximada de ${dispositivo.precisionMetros} m)` : ""}. Revisa el punto y escribe
              una referencia.
            </p>
          ) : null}
        </div>
      </div>

      <Controller
        control={control}
        name="modoUbicacion"
        render={({ field }) => (
          <RadioCardGroup
            leyenda="¿Cómo quieres indicar la ubicación?"
            opciones={OPCIONES_MODO}
            valor={field.value}
            onCambiar={cambiarModo}
            columnas={2}
            guia="reportes.ubicacion"
          />
        )}
      />

      {modo === "manual" ? <CamposManuales /> : <CamposMapa onUsarDireccion={() => cambiarModo("manual")} />}
    </div>
  );
}
