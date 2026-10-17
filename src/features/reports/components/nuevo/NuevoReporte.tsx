import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { nuevoReporteSchema } from "@/domain/validaciones";
import { Button, Stepper, describirError } from "@/design-system";
import { usePossibleDuplicates, useCreateReport, useRewardRules } from "@/services/hooks";
import type { CategoriaReporte, NuevoReporteInput, Reporte, Ubicacion } from "@/types";
import { describirCoincidencias, evaluarFaltantes, generarAsistencia } from "../../lib/asistencia";
import { DEFINICION_PASO, ORDEN_PASOS, pasoAnterior, resolverReporte, valoresIniciales, type PasoReporte, type ValoresReporte } from "../../lib/formulario";
import type { PrefillReporte } from "../../lib/prefill";
import { componerUbicacion } from "../../lib/ubicacion";
import { useFotoTemporal } from "../../lib/useFotoTemporal";
import { AportacionExitosa } from "./AportacionExitosa";
import { FolioDialog } from "./FolioDialog";
import { PasoCoincidencias } from "./PasoCoincidencias";
import { PasoDescripcion } from "./PasoDescripcion";
import { PasoFoto } from "./PasoFoto";
import { PasoRevision } from "./PasoRevision";
import { PasoUbicacion } from "./PasoUbicacion";

export interface NuevoReporteProps {
  categoria: CategoriaReporte;
  prefill: PrefillReporte | null;
  /** Avisa a la página el tipo elegido (para el título). */
  onCambiarCategoria?: (categoria: CategoriaReporte) => void;
}

const PASOS_STEPPER = ORDEN_PASOS.map((id) => ({ id, titulo: DEFINICION_PASO[id].titulo }));

/**
 * Formulario por pasos de «Nuevo reporte»: describir → ubicación → foto → coincidencias → revisar
 * y enviar a la simulación → folio DEMO-R. Un solo useForm conserva los datos entre pasos; cada
 * paso valida sólo sus campos. La foto vive en memoria y nunca se persiste.
 */
export function NuevoReporte({ categoria, prefill, onCambiarCategoria }: NuevoReporteProps) {
  const navigate = useNavigate();
  const tituloPasoRef = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [creado, setCreado] = useState<Reporte | null>(null);
  const [aportado, setAportado] = useState<Reporte | null>(null);
  const { foto, error: errorFoto, seleccionar, quitar } = useFotoTemporal();

  const formulario = useForm<ValoresReporte>({
    defaultValues: valoresIniciales(categoria, prefill),
    resolver: resolverReporte,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const { handleSubmit, control, setValue, clearErrors } = formulario;
  const valores = useWatch({ control });
  const paso: PasoReporte = valores.paso ?? "descripcion";

  const crear = useCreateReport();
  const reglas = useRewardRules();
  const duplicados = usePossibleDuplicates(ubicacion && valores.categoria ? { categoria: valores.categoria, ubicacion } : null);

  const categoriaActual = valores.categoria || categoria;
  useEffect(() => {
    if (valores.categoria) onCambiarCategoria?.(valores.categoria);
  }, [valores.categoria, onCambiarCategoria]);

  // Al cambiar de paso, el foco va al encabezado del paso (no en la primera carga: ahí lo lleva el h1).
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    tituloPasoRef.current?.focus();
  }, [paso]);

  const irA = (destino: PasoReporte) => {
    clearErrors();
    setValue("paso", destino);
  };

  const datosAsistencia = {
    categoria: valores.categoria ?? "",
    descripcion: valores.descripcion ?? "",
    ubicacion,
    conCruzamientos: Boolean(valores.cruzamiento1?.trim() || valores.cruzamiento2?.trim()),
    tieneFoto: foto !== null,
  };

  const enviarReporte = async (todos: ValoresReporte) => {
    if (crear.isPending || creado || !ubicacion || !todos.categoria) return;
    const asistencia = generarAsistencia({ ...datosAsistencia, categoria: todos.categoria, descripcion: todos.descripcion });
    const entrada: NuevoReporteInput = {
      categoria: todos.categoria,
      descripcion: todos.descripcion,
      ubicacion,
      tieneFoto: foto !== null,
      riesgoDeclarado: todos.riesgoDeclarado,
      asistencia,
    };
    // Revalida todo antes de enviar (el adaptador vuelve a validar).
    const revision = nuevoReporteSchema.safeParse(entrada);
    if (!revision.success) {
      irA("descripcion");
      return;
    }
    try {
      const reporte = await crear.mutateAsync(entrada);
      setCreado(reporte);
    } catch {
      // El error se muestra con describirError; los datos del formulario se conservan.
    }
  };

  const alContinuar = handleSubmit(async (todos) => {
    if (paso === "descripcion") irA("ubicacion");
    else if (paso === "ubicacion") {
      const nueva = componerUbicacion(todos);
      if (!nueva) return;
      setUbicacion(nueva);
      irA("foto");
    } else if (paso === "foto") irA("coincidencias");
    else if (paso === "revision") await enviarReporte(todos);
  });

  if (aportado) return <AportacionExitosa reporte={aportado} />;

  const definicion = DEFINICION_PASO[paso];
  const anterior = pasoAnterior(paso);
  const errorCrear = crear.error ? describirError(crear.error) : null;

  return (
    <FormProvider {...formulario}>
      <Stepper pasos={PASOS_STEPPER} actual={ORDEN_PASOS.indexOf(paso)} etiqueta="Pasos del reporte" className="mb-6" />

      <h2 ref={tituloPasoRef} tabIndex={-1} className="mb-4 text-xl font-semibold text-marino outline-none">
        {definicion.encabezado}
      </h2>

      {paso === "coincidencias" ? (
        <PasoCoincidencias
          cargando={duplicados.isPending && duplicados.fetchStatus !== "idle"}
          error={duplicados.error}
          coincidencias={duplicados.data}
          onReintentar={() => void duplicados.refetch()}
          descripcion={valores.descripcion ?? ""}
          tieneFoto={foto !== null}
          onAportado={setAportado}
          onContinuar={() => irA("revision")}
          onRegresar={() => irA("foto")}
        />
      ) : (
        <form
          onSubmit={(evento) => void alContinuar(evento)}
          noValidate
          aria-labelledby="titulo-formulario-reporte"
          data-formulario="Nuevo reporte"
          data-paso={definicion.titulo}
        >
          <span id="titulo-formulario-reporte" className="sr-only">
            Nuevo reporte: {definicion.encabezado}
          </span>

          {paso === "descripcion" ? <PasoDescripcion /> : null}
          {paso === "ubicacion" ? <PasoUbicacion /> : null}
          {paso === "foto" ? <PasoFoto foto={foto} error={errorFoto} onSeleccionar={seleccionar} onQuitar={quitar} /> : null}
          {paso === "revision" && ubicacion && categoriaActual ? (
            <PasoRevision
              categoria={categoriaActual}
              descripcion={valores.descripcion ?? ""}
              riesgoDeclarado={valores.riesgoDeclarado ?? false}
              ubicacion={ubicacion}
              fotoNombre={foto?.nombre ?? null}
              asistencia={generarAsistencia(datosAsistencia)}
              faltantes={evaluarFaltantes(datosAsistencia)}
              coincidencias={describirCoincidencias(duplicados.data ? duplicados.data.length : null)}
              onEditar={irA}
            />
          ) : null}

          {paso === "revision" && errorCrear ? (
            <div role="alert" className="mt-5 rounded-tarjeta border border-peligro/25 bg-peligro-suave px-4 py-3 text-[0.9375rem] text-tinta">
              <p className="font-semibold text-peligro">{errorCrear.titulo}: el reporte no se envió.</p>
              <p className="mt-1">{errorCrear.descripcion} Tus datos siguen aquí; puedes intentarlo de nuevo.</p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {anterior ? (
              <Button variante="secundario" iconoInicio={ArrowLeft} onClick={() => irA(anterior)} data-guia="reportes.anterior">
                Regresar
              </Button>
            ) : (
              <span aria-hidden="true" />
            )}
            {paso === "revision" ? (
              <Button
                type="submit"
                variante="primario"
                tamano="lg"
                iconoInicio={Send}
                cargando={crear.isPending || formulario.formState.isSubmitting}
                textoCargando="Enviando a la simulación…"
                disabled={creado !== null}
                data-guia="reportes.enviar"
              >
                Enviar a la simulación
              </Button>
            ) : (
              <Button type="submit" iconoFin={ArrowRight} data-guia="reportes.continuar">
                Continuar
              </Button>
            )}
          </div>
        </form>
      )}

      <FolioDialog
        reporte={creado}
        puntosPorValidar={reglas.data?.reporteValidado}
        onAceptar={() => navigate("/reportes/mis-reportes", { replace: true })}
      />
    </FormProvider>
  );
}
