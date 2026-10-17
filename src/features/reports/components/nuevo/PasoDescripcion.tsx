import { useFormContext, useWatch } from "react-hook-form";
import { NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import { DESCRIPCION_REPORTE } from "@/domain/validaciones";
import { Checkbox, Field, Select, TextArea } from "@/design-system";
import { evaluarFaltantes, sugerirCategoria } from "../../lib/asistencia";
import type { ValoresReporte } from "../../lib/formulario";
import { TIPOS_REPORTE } from "../../lib/tipos-reporte";
import { AsistenciaSimulada } from "./AsistenciaSimulada";

const OPCIONES_TIPO = TIPOS_REPORTE.map((categoria) => ({ valor: categoria, etiqueta: NOMBRE_CATEGORIA_REPORTE[categoria] }));

/** Paso 1: tipo de reporte, descripción (15 a 300 caracteres, como «Reporta en línea») y riesgo declarado. */
export function PasoDescripcion() {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ValoresReporte>();
  const [categoria, descripcion] = useWatch({ control, name: ["categoria", "descripcion"] });
  const sugerida = sugerirCategoria(descripcion) ?? undefined;
  const faltantes = evaluarFaltantes({ categoria, descripcion, ubicacion: null, tieneFoto: true }).filter(
    (faltante) => faltante.aspecto === "descripcion",
  );

  return (
    <div className="flex flex-col gap-5">
      <Field etiqueta="Tipo de reporte" requerido error={errors.categoria?.message}>
        <Select {...register("categoria")} opciones={OPCIONES_TIPO} marcador="Elige el tipo de reporte" data-guia="reportes.tipo" />
      </Field>

      <Field
        etiqueta="Describe el problema"
        requerido
        ayuda={`Entre ${DESCRIPCION_REPORTE.minimo} y ${DESCRIPCION_REPORTE.maximo} caracteres. Cuenta qué pasa y en qué parte de la calle está.`}
        error={errors.descripcion?.message}
      >
        <TextArea
          {...register("descripcion")}
          maxLength={DESCRIPCION_REPORTE.maximo}
          rows={4}
          placeholder="Ejemplo: bache grande en el carril derecho, frente a la tienda de la esquina."
          data-guia="reportes.descripcion"
        />
      </Field>

      <Checkbox
        {...register("riesgoDeclarado")}
        etiqueta="Puede causar un accidente a quienes pasan por ahí"
        descripcion="Es un criterio explícito de la prioridad sugerida en la demostración. La prioridad nunca depende de cuántas personas reporten ni de puntos."
        data-guia="reportes.riesgo"
      />

      <AsistenciaSimulada
        categoriaActual={categoria}
        categoriaSugerida={sugerida}
        onUsarCategoria={(nueva) => setValue("categoria", nueva, { shouldDirty: true, shouldValidate: true })}
        faltantes={faltantes}
        textoCompleto="La descripción tiene lo necesario. En el siguiente paso confirmarás la ubicación."
      />
    </div>
  );
}
