import { ArrowRight, BookUser, Save } from "lucide-react";
import { useId, useState } from "react";
import type { FieldErrors, FieldValues } from "react-hook-form";
import type { EscenarioDemo, OpcionCampo } from "@/components/catalogo/datos-demo";
import { Button } from "@/design-system";
import { CampoEscenarioControl } from "./CampoEscenarioControl";
import { ReutilizarDatosDialog } from "./ReutilizarDatosDialog";
import type { FormularioEscenario } from "./useFormularioEscenario";

export interface PasoCapturaProps {
  escenario: EscenarioDemo;
  formulario: FormularioEscenario;
  /** Opciones calculadas por campo (sedes de la ficha, horarios de ejemplo). */
  opciones?: Readonly<Record<string, readonly OpcionCampo[]>>;
  /** Se llama con los valores ya validados por zod. */
  onContinuar: (validados: Record<string, unknown>) => void;
  textoContinuar: string;
  onGuardarBorrador?: () => void;
  guardando?: boolean;
}

function mensajeDe(errores: FieldErrors<FieldValues>, nombre: string): string | undefined {
  const mensaje: unknown = errores[nombre]?.message;
  return typeof mensaje === "string" ? mensaje : undefined;
}

/**
 * Captura de un formulario simulado: campos del escenario con etiqueta, ayuda y error asociados;
 * foco al primer error; «Usar datos de mi expediente» con confirmación y guardado de borrador.
 */
export function PasoCaptura({ escenario, formulario, opciones, onContinuar, textoContinuar, onGuardarBorrador, guardando = false }: PasoCapturaProps) {
  const { form, reutilizados, aplicarReutilizados } = formulario;
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const prefijo = useId().replace(/:/g, "");
  const errores = form.formState.errors;
  const conReutilizables = escenario.campos.some((campo) => campo.reutilizable !== undefined);
  const totalErrores = Object.keys(errores).length;

  return (
    <form noValidate onSubmit={form.handleSubmit(onContinuar)} className="flex flex-col gap-5" aria-describedby={`${prefijo}-leyenda`}>
      <p id={`${prefijo}-leyenda`} className="text-sm text-tinta-suave">
        {escenario.descripcion} Todos los campos son obligatorios.
      </p>

      {conReutilizables ? (
        <div className="flex flex-col gap-2 rounded-boton border border-borde bg-fondo p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.9375rem] text-tinta">¿Quieres ahorrar tiempo? Copia datos de tu Expediente Digital de ejemplo, uno por uno.</p>
          <Button variante="secundario" tamano="sm" iconoInicio={BookUser} onClick={() => setDialogoAbierto(true)} data-guia="servicios.usar_expediente">
            Usar datos de mi expediente
          </Button>
        </div>
      ) : null}

      {totalErrores > 0 && form.formState.isSubmitted ? (
        <p role="alert" className="rounded-boton border border-peligro/25 bg-peligro-suave px-4 py-3 text-[0.9375rem] font-medium text-peligro">
          Revisa {totalErrores === 1 ? "1 campo" : `${totalErrores} campos`} marcados antes de continuar.
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        {escenario.campos.map((campo) => (
          <CampoEscenarioControl
            key={campo.nombre}
            campo={campo}
            register={form.register}
            error={mensajeDe(errores, campo.nombre)}
            opciones={opciones?.[campo.nombre]}
            reutilizado={reutilizados.includes(campo.nombre)}
            prefijoId={prefijo}
          />
        ))}
      </div>

      <div className="flex flex-col-reverse gap-2.5 border-t border-borde pt-5 sm:flex-row sm:justify-end">
        {onGuardarBorrador ? (
          <Button
            variante="secundario"
            iconoInicio={Save}
            onClick={onGuardarBorrador}
            cargando={guardando}
            textoCargando="Guardando…"
            data-guia="servicios.guardar_borrador"
          >
            Guardar borrador
          </Button>
        ) : null}
        <Button type="submit" iconoFin={ArrowRight} disabled={guardando} data-guia="servicios.revisar">
          {textoContinuar}
        </Button>
      </div>

      <ReutilizarDatosDialog
        abierto={dialogoAbierto}
        onCerrar={() => setDialogoAbierto(false)}
        campos={escenario.campos}
        onConfirmar={(seleccion) => {
          aplicarReutilizados(seleccion);
          setDialogoAbierto(false);
        }}
      />
    </form>
  );
}
