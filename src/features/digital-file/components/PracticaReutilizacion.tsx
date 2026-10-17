import { zodResolver } from "@hookform/resolvers/zod";
import { BookUser, CircleCheck, RotateCcw, SearchCheck } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { Badge, Button, Field, KeyValueList, TextInput } from "@/design-system";
import {
  CAMPOS_PRACTICA,
  copiadosVigentes,
  esquemaPractica,
  VALORES_VACIOS_PRACTICA,
  type EntradaPractica,
} from "../lib/practica";
import { ConfirmarReutilizacionDialog } from "./ConfirmarReutilizacionDialog";

type SalidaPractica = z.output<typeof esquemaPractica>;

interface Resultado {
  valores: SalidaPractica;
  copiados: string[];
}

/**
 * Práctica de «Usar datos de mi expediente» (anatomía del formulario 14:125: etiqueta con
 * asterisco, campo con ícono, ayuda y error). Valida con zod y no envía ni guarda nada.
 */
export function PracticaReutilizacion() {
  const prefijo = useId().replace(/:/g, "");
  const form = useForm<EntradaPractica, unknown, SalidaPractica>({
    resolver: zodResolver(esquemaPractica),
    defaultValues: VALORES_VACIOS_PRACTICA,
    shouldFocusError: true,
  });
  const [copiados, setCopiados] = useState<Record<string, string>>({});
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const tituloResultadoRef = useRef<HTMLHeadingElement>(null);
  const botonUsarRef = useRef<HTMLButtonElement>(null);
  const reiniciado = useRef(false);

  const valores = useWatch({ control: form.control });
  const vigentes = copiadosVigentes(copiados, valores);
  const errores = form.formState.errors;
  const totalErrores = Object.keys(errores).length;

  useEffect(() => {
    if (resultado) tituloResultadoRef.current?.focus();
    else if (reiniciado.current) {
      reiniciado.current = false;
      botonUsarRef.current?.focus();
    }
  }, [resultado]);

  const comprobar = form.handleSubmit((validados) => setResultado({ valores: validados, copiados: vigentes }));

  const reiniciar = () => {
    form.reset(VALORES_VACIOS_PRACTICA);
    setCopiados({});
    reiniciado.current = true;
    setResultado(null);
  };

  const aplicar = (seleccion: Record<string, string>) => {
    for (const campo of CAMPOS_PRACTICA) {
      const valor = seleccion[campo.nombre];
      if (valor !== undefined) form.setValue(campo.nombre, valor, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
    }
    setCopiados((actuales) => ({ ...actuales, ...seleccion }));
    setDialogoAbierto(false);
  };

  if (resultado) {
    const copiadosTexto =
      resultado.copiados.length === 0
        ? "Ninguno vino de tu expediente."
        : `${resultado.copiados.length} ${resultado.copiados.length === 1 ? "vino" : "vinieron"} de tu expediente con tu confirmación.`;
    return (
      <div className="rounded-tarjeta border border-exito/25 bg-exito-suave p-4 sm:p-5">
        <h3 ref={tituloResultadoRef} tabIndex={-1} className="flex items-center gap-2 text-base font-semibold text-exito">
          <CircleCheck aria-hidden="true" className="size-5 shrink-0" />
          Datos comprobados
        </h3>
        <p className="mt-1 text-[0.9375rem] text-tinta">
          Así llegarían a un trámite. {copiadosTexto} No se envió ni se guardó nada.
        </p>
        <KeyValueList
          className="mt-4 rounded-boton bg-superficie p-4"
          items={CAMPOS_PRACTICA.map((campo) => ({
            id: campo.nombre,
            clave: campo.etiqueta,
            valor: (
              <span className="flex flex-wrap items-center gap-2">
                <span className="break-words">{resultado.valores[campo.nombre]}</span>
                {resultado.copiados.includes(campo.nombre) ? (
                  <Badge tono="exito" icono={BookUser}>
                    De tu expediente
                  </Badge>
                ) : null}
              </span>
            ),
          }))}
        />
        <Button variante="secundario" tamano="sm" iconoInicio={RotateCcw} onClick={reiniciar} className="mt-4">
          Probar otra vez
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={(evento) => void comprobar(evento)} className="flex flex-col gap-5" aria-describedby={`${prefijo}-leyenda`}>
      <p id={`${prefijo}-leyenda`} className="text-sm text-tinta-suave">
        Práctica sin envío: no se guarda nada. Los campos con <span aria-hidden="true">*</span>
        <span className="sr-only">asterisco</span> son obligatorios.
      </p>

      <div className="flex flex-col gap-3 rounded-boton border border-borde bg-fondo p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.9375rem] text-tinta">Copia datos de tu expediente de ejemplo, uno por uno.</p>
        <Button
          ref={botonUsarRef}
          variante="secundario"
          tamano="sm"
          iconoInicio={BookUser}
          onClick={() => setDialogoAbierto(true)}
          className="shrink-0"
          data-guia="expediente.usar_datos"
        >
          Usar datos de mi expediente
        </Button>
      </div>

      {totalErrores > 0 && form.formState.isSubmitted ? (
        <p role="alert" className="rounded-boton border border-peligro/25 bg-peligro-suave px-4 py-3 text-[0.9375rem] font-medium text-peligro">
          Revisa {totalErrores === 1 ? "1 campo marcado" : `${totalErrores} campos marcados`}.
        </p>
      ) : null}

      <div className="flex flex-col gap-5">
        {CAMPOS_PRACTICA.map((campo) => {
          const copiado = vigentes.includes(campo.nombre);
          const idCopiado = `${prefijo}-${campo.nombre}-copiado`;
          return (
            <div key={campo.nombre} className="flex flex-col gap-1.5">
              <Field etiqueta={campo.etiqueta} requerido ayuda={campo.ayuda} error={errores[campo.nombre]?.message} id={`${prefijo}-${campo.nombre}`}>
                <TextInput
                  icono={campo.icono}
                  type={campo.tipo}
                  autoComplete={campo.autocompletar}
                  placeholder={campo.marcador}
                  aria-describedby={copiado ? idCopiado : undefined}
                  {...form.register(campo.nombre)}
                />
              </Field>
              {copiado ? (
                <p id={idCopiado} className="flex items-center gap-1.5 text-sm font-medium text-exito">
                  <BookUser aria-hidden="true" className="size-4 shrink-0" />
                  Copiado de tu expediente con tu confirmación
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end border-t border-borde pt-4">
        <Button type="submit" iconoInicio={SearchCheck} cargando={form.formState.isSubmitting} data-guia="expediente.comprobar_practica">
          Comprobar datos
        </Button>
      </div>

      <ConfirmarReutilizacionDialog
        abierto={dialogoAbierto}
        onCerrar={() => setDialogoAbierto(false)}
        campos={CAMPOS_PRACTICA.map((campo) => ({ nombre: campo.nombre, etiqueta: campo.etiqueta, reutilizable: campo.reutilizable }))}
        onConfirmar={aplicar}
      />
    </form>
  );
}
