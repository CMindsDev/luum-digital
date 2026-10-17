import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Scale, Send, ShieldAlert, WifiOff } from "lucide-react";
import { useRef, type FormEvent } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { useSinConexion } from "@/app/hooks/useSinConexion";
import { Button, Checkbox, Field, RadioCardGroup, TextArea, describirError } from "@/design-system";
import { DESCRIPCION_REPORTE, nuevaVerificacionSchema } from "@/domain/validaciones";
import { calcularPuntosVerificacion, criteriosCumplidos, evaluarCalidad } from "@/domain/verificacion";
import { puntosEnTexto } from "@/features/rewards";
import { useRewardRules, useSubmitVerification } from "@/services/hooks";
import type { Reporte, Verificacion } from "@/types";
import { useFotoEvidencia } from "../lib/useFotoEvidencia";
import { OPCIONES_RESULTADO } from "../lib/verificacion";
import { SelectorFotoEvidencia } from "./SelectorFotoEvidencia";

const esquema = nuevaVerificacionSchema.pick({ resultado: true, comentario: true, ubicacionConfirmada: true });
type ValoresEntrada = z.input<typeof esquema>;
type ValoresSalida = z.output<typeof esquema>;

export interface FormularioVerificacionProps {
  reporte: Pick<Reporte, "id" | "folio">;
  onEnviada: (verificacion: Verificacion) => void;
}

/**
 * Verificación ciudadana: tres respuestas posibles, comentario, confirmación de que se observó el
 * punto y foto opcional (no se persiste). El valor no depende de que la respuesta sea positiva y el
 * resultado queda pendiente de revisión. React Hook Form + Zod; sin dobles envíos.
 */
export function FormularioVerificacion({ reporte, onEnviada }: FormularioVerificacionProps) {
  const reglas = useRewardRules();
  const verificar = useSubmitVerification();
  const sinConexion = useSinConexion();
  const fotos = useFotoEvidencia();
  const grupoRef = useRef<HTMLDivElement>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ValoresEntrada, unknown, ValoresSalida>({
    resolver: zodResolver(esquema),
    defaultValues: { comentario: "", ubicacionConfirmada: false },
  });
  const [resultado, comentario = "", ubicacionConfirmada = false] = useWatch({ control, name: ["resultado", "comentario", "ubicacionConfirmada"] });

  const minimo = reglas.data?.longitudMinimaComentario;
  const calidad = reglas.data
    ? evaluarCalidad({ comentario, ubicacionConfirmada, tieneFoto: fotos.foto !== null }, reglas.data)
    : null;
  const puntos = reglas.data && calidad && resultado ? calcularPuntosVerificacion(resultado, calidad, reglas.data) : null;

  const enviarValido = async (valores: ValoresSalida) => {
    if (verificar.isPending) return;
    try {
      const verificacion = await verificar.mutateAsync({
        reporteId: reporte.id,
        resultado: valores.resultado,
        comentario: valores.comentario,
        ubicacionConfirmada: valores.ubicacionConfirmada,
        tieneFoto: fotos.foto !== null,
      });
      // La foto nunca se guarda: se libera la vista previa en cuanto se envía.
      fotos.quitar();
      onEnviada(verificacion);
    } catch {
      // El error se muestra abajo (verificar.error); las respuestas se conservan.
    }
  };

  const alEnviar = (evento: FormEvent<HTMLFormElement>) => {
    void handleSubmit(enviarValido, (fallas) => {
      // El grupo de opciones no es un control registrado: el foco va a la primera opción.
      if (fallas.resultado) grupoRef.current?.querySelector<HTMLInputElement>("input[type='radio']")?.focus();
    })(evento);
  };

  const errorEnvio = verificar.error ? describirError(verificar.error) : null;

  return (
    <form onSubmit={alEnviar} noValidate data-formulario="Verificar reparación" className="flex flex-col gap-6">
      <p role="note" className="flex items-start gap-3 rounded-tarjeta border border-lima bg-lima-suave px-4 py-3 text-[0.9375rem] text-tinta">
        <Scale aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-cafe" />
        <span>
          <strong className="font-semibold">Se premia la calidad, no la respuesta positiva.</strong> Decir que el problema persiste vale lo mismo que
          decir que la reparación parece completada. Suman puntos el comentario útil, confirmar que observaste el punto y la foto.
        </span>
      </p>

      <div ref={grupoRef}>
        <Controller
          control={control}
          name="resultado"
          render={({ field }) => (
            <RadioCardGroup
              // Sin `requerido`: RadioCardGroup pondría aria-required en un <fieldset> (axe: aria-allowed-attr).
              leyenda="¿Qué observaste en el lugar? (obligatorio)"
              name="resultado-verificacion"
              opciones={OPCIONES_RESULTADO.map((opcion) => ({
                valor: opcion.valor,
                etiqueta: opcion.etiqueta,
                descripcion: opcion.descripcion,
                icono: opcion.icono,
              }))}
              valor={field.value ?? null}
              onCambiar={field.onChange}
              error={errors.resultado?.message}
              guia="participacion.resultado"
            />
          )}
        />
      </div>

      <Field
        etiqueta="Comentario"
        opcional
        ayuda={
          minimo
            ? `Describe lo que viste. Con ${minimo} caracteres o más cuenta como comentario útil. No escribas datos personales.`
            : "Describe lo que viste. No escribas datos personales."
        }
        error={errors.comentario?.message}
      >
        <TextArea {...register("comentario")} maxLength={DESCRIPCION_REPORTE.maximo} rows={3} data-guia="participacion.comentario" />
      </Field>

      <Checkbox
        {...register("ubicacionConfirmada")}
        etiqueta="Confirmo que observé el punto exacto del reporte"
        descripcion="Márcalo sólo si estuviste en ese lugar. Cuenta como criterio de calidad."
        data-guia="participacion.confirmar_punto"
      />

      <div className="flex flex-col gap-3">
        <p role="note" className="flex items-start gap-3 rounded-tarjeta border border-ambar bg-aviso-suave px-4 py-3 text-sm text-tinta">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-aviso" />
          <span>
            <strong className="font-semibold">Primero tu seguridad.</strong> No te expongas al tránsito para tomar la foto.
          </span>
        </p>
        <SelectorFotoEvidencia foto={fotos.foto} error={fotos.error} onSeleccionar={fotos.seleccionar} onQuitar={fotos.quitar} />
      </div>

      {calidad ? (
        <div className="rounded-tarjeta border border-borde bg-superficie-2 px-4 py-3 text-[0.9375rem] text-tinta" data-guia="participacion.calidad">
          <p>
            <strong className="font-semibold">Calidad: {criteriosCumplidos(calidad)} de 3 criterios.</strong>{" "}
            {puntos !== null
              ? `Si se aprueba, sumarías ${puntosEnTexto(puntos)}. Quedan pendientes de revisión.`
              : "Elige qué observaste para ver cuántos puntos sumarías si se aprueba."}
          </p>
        </div>
      ) : null}

      {errorEnvio ? (
        <p role="alert" className="flex items-start gap-2 rounded-control border border-peligro/25 bg-peligro-suave px-3 py-2.5 text-sm text-tinta">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-peligro" />
          <span>
            <strong className="font-semibold text-peligro">{errorEnvio.titulo}. </strong>
            {errorEnvio.descripcion}
          </span>
        </p>
      ) : null}

      {sinConexion ? (
        <p role="status" className="flex items-start gap-2 text-sm text-tinta">
          <WifiOff aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-aviso" />
          Sin conexión: tus respuestas se conservan en esta pantalla. Podrás enviar al reconectar.
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          iconoInicio={Send}
          cargando={isSubmitting || verificar.isPending}
          textoCargando="Enviando verificación…"
          disabled={sinConexion}
          data-guia="participacion.enviar_verificacion"
        >
          Enviar verificación
        </Button>
      </div>
    </form>
  );
}
