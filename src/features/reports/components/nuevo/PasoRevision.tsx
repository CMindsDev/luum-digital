import { Pencil } from "lucide-react";
import { ETIQUETA_ORIGEN_UBICACION } from "@/components/reportes/categorias-reporte";
import { NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import { Button, KeyValueList, type ParClaveValor } from "@/design-system";
import type { AsistenciaReporte, CategoriaReporte, Ubicacion } from "@/types";
import type { Faltante } from "../../lib/asistencia";
import type { PasoReporte } from "../../lib/formulario";
import { formatearCoordenadas } from "../../lib/ubicacion";
import { AsistenciaSimulada } from "./AsistenciaSimulada";

export interface PasoRevisionProps {
  categoria: CategoriaReporte;
  descripcion: string;
  riesgoDeclarado: boolean;
  ubicacion: Ubicacion;
  fotoNombre: string | null;
  asistencia: AsistenciaReporte;
  faltantes: Faltante[];
  coincidencias: string;
  onEditar: (paso: PasoReporte) => void;
}

function BotonEditar({ paso, etiqueta, onEditar }: { paso: PasoReporte; etiqueta: string; onEditar: (paso: PasoReporte) => void }) {
  return (
    <Button variante="fantasma" tamano="sm" iconoInicio={Pencil} onClick={() => onEditar(paso)} className="-my-1">
      Editar<span className="sr-only"> {etiqueta}</span>
    </Button>
  );
}

/** Paso 5: revisar todo antes de enviar a la simulación. */
export function PasoRevision({
  categoria,
  descripcion,
  riesgoDeclarado,
  ubicacion,
  fotoNombre,
  asistencia,
  faltantes,
  coincidencias,
  onEditar,
}: PasoRevisionProps) {
  const filas: ParClaveValor[] = [
    {
      id: "tipo",
      clave: "Tipo de reporte",
      valor: (
        <span className="flex flex-wrap items-center justify-between gap-2">
          {NOMBRE_CATEGORIA_REPORTE[categoria]}
          <BotonEditar paso="descripcion" etiqueta="el tipo de reporte" onEditar={onEditar} />
        </span>
      ),
    },
    {
      id: "descripcion",
      clave: "Descripción",
      valor: (
        <span className="flex flex-wrap items-start justify-between gap-2">
          <span className="min-w-0 flex-1 break-words">{descripcion.trim()}</span>
          <BotonEditar paso="descripcion" etiqueta="la descripción" onEditar={onEditar} />
        </span>
      ),
    },
    { id: "riesgo", clave: "Riesgo para quienes transitan", valor: riesgoDeclarado ? "Sí, lo declaraste" : "No declarado" },
    {
      id: "ubicacion",
      clave: "Ubicación",
      valor: (
        <span className="flex flex-wrap items-start justify-between gap-2">
          <span className="min-w-0 flex-1">
            <span className="block break-words">
              {ubicacion.referencia}
              {ubicacion.colonia ? `, ${ubicacion.colonia}` : ""}
            </span>
            <span className="block text-sm text-tinta-suave">
              {ETIQUETA_ORIGEN_UBICACION[ubicacion.origen]} · {formatearCoordenadas(ubicacion.lat, ubicacion.lng)}
            </span>
          </span>
          <BotonEditar paso="ubicacion" etiqueta="la ubicación" onEditar={onEditar} />
        </span>
      ),
    },
    {
      id: "foto",
      clave: "Fotografía",
      valor: (
        <span className="flex flex-wrap items-start justify-between gap-2">
          <span className="min-w-0 flex-1 break-words">
            {fotoNombre ? `Adjuntaste una foto (${fotoNombre}). No se guarda: sólo se registra que existe.` : "Sin foto (es opcional)"}
          </span>
          <BotonEditar paso="foto" etiqueta="la fotografía" onEditar={onEditar} />
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <KeyValueList items={filas} className="rounded-tarjeta border border-borde bg-superficie p-4 sm:p-5" />
      <AsistenciaSimulada
        categoriaActual={categoria}
        categoriaSugerida={asistencia.categoriaSugerida}
        resumen={asistencia.resumen}
        faltantes={faltantes}
        coincidencias={coincidencias}
      />
      <p className="text-sm text-tinta-suave">
        Al enviar, el reporte se registra en la simulación de este navegador con un folio <strong className="font-semibold">DEMO</strong>. No
        llega al Ayuntamiento.
      </p>
    </div>
  );
}
