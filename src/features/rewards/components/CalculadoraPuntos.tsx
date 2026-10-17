import { Calculator } from "lucide-react";
import { useState } from "react";
import { Card, Checkbox, RadioCardGroup } from "@/design-system";
import { calcularPuntosVerificacion, criteriosCumplidos, ETIQUETA_RESULTADO } from "@/domain/verificacion";
import type { CalidadVerificacion, ReglasPuntosDemo, ResultadoVerificacion } from "@/types";
import { puntosEnTexto } from "../lib/movimientos";

const RESULTADOS: ResultadoVerificacion[] = ["reparacion_completada", "problema_persiste", "no_puedo_comprobar"];

/**
 * Calculadora de la regla de verificación: muestra que «parece completada» y «el problema persiste»
 * valen lo mismo con la misma calidad. Usa la misma función que el adaptador (src/domain/verificacion.ts).
 */
export function CalculadoraPuntos({ reglas }: { reglas: ReglasPuntosDemo }) {
  const [resultado, setResultado] = useState<ResultadoVerificacion>("problema_persiste");
  const [calidad, setCalidad] = useState<CalidadVerificacion>({ descripcionUtil: true, ubicacionConfirmada: true, evidencia: false });
  const puntos = calcularPuntosVerificacion(resultado, calidad, reglas);
  const cambiar = (clave: keyof CalidadVerificacion) => (evento: { target: { checked: boolean } }) =>
    setCalidad((actual) => ({ ...actual, [clave]: evento.target.checked }));

  return (
    <Card as="section" aria-labelledby="titulo-calculadora" relleno="lg" data-guia="recompensas.calculadora">
      <h2 id="titulo-calculadora" className="flex items-center gap-2 text-xl font-semibold text-marino">
        <Calculator aria-hidden="true" className="size-6 shrink-0" />
        Prueba la regla de verificación
      </h2>
      <p className="mt-1 max-w-prose text-sm text-tinta-suave">
        Cambia la respuesta y los criterios de calidad: el resultado es el mismo para «completada» y «persiste».
      </p>
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <RadioCardGroup
          leyenda="Respuesta"
          name="calculadora-resultado"
          valor={resultado}
          onCambiar={setResultado}
          opciones={RESULTADOS.map((valor) => ({ valor, etiqueta: ETIQUETA_RESULTADO[valor] }))}
        />
        <fieldset className="min-w-0">
          <legend className="mb-1.5 text-[0.9375rem] font-semibold text-tinta">Criterios de calidad</legend>
          <Checkbox
            checked={calidad.descripcionUtil}
            onChange={cambiar("descripcionUtil")}
            etiqueta="Comentario útil"
            descripcion={`De ${reglas.longitudMinimaComentario} caracteres o más.`}
          />
          <Checkbox checked={calidad.ubicacionConfirmada} onChange={cambiar("ubicacionConfirmada")} etiqueta="Ubicación confirmada" />
          <Checkbox checked={calidad.evidencia} onChange={cambiar("evidencia")} etiqueta="Foto de evidencia" descripcion="La foto nunca se guarda." />
        </fieldset>
      </div>
      <p role="status" className="mt-5 rounded-control bg-lima-suave px-4 py-3 text-[0.9375rem] text-tinta">
        Si la verificación se aprueba: <strong className="font-semibold text-cafe">{puntosEnTexto(puntos)}</strong>
        {resultado === "no_puedo_comprobar"
          ? " (valor fijo cuando no se pudo comprobar)."
          : ` (${reglas.verificacionBase} base + ${reglas.verificacionBonoCalidad} × ${criteriosCumplidos(calidad)} ${criteriosCumplidos(calidad) === 1 ? "criterio" : "criterios"}).`}
      </p>
    </Card>
  );
}
