import { Phone, PhoneCall } from "lucide-react";
import { useState } from "react";
import { esEmergencias911, hrefTelefono, NUMERO_EMERGENCIAS } from "@/components/ayuda/lineas";
import { Badge, Button, clasesBoton, Dialog, ErrorState, LoadingState } from "@/design-system";
import { useHelpLines } from "@/services/hooks";

interface Canal {
  id: string;
  nombre: string;
  telefono: string;
  telefonoMarcable: string;
  detalle: string;
}

/** Respaldo si las líneas no cargan: el 911 nunca depende de los datos. */
const EMERGENCIAS_RESPALDO: Canal = {
  id: "emergencias",
  nombre: "Emergencias 911",
  telefono: NUMERO_EMERGENCIAS,
  telefonoMarcable: NUMERO_EMERGENCIAS,
  detalle: "Si tu vida o la de alguien más está en riesgo inmediato.",
};

/**
 * Abrir el canal oficial: llamar con acción explícita y confirmación. Paso 1, botón; paso 2, diálogo
 * con el número verificado y el enlace tel: que la persona toca. El prototipo no llama por ella, no
 * envía alertas, ubicación ni mensajes, y no registra la llamada.
 */
export function AbrirCanalOficial() {
  const lineas = useHelpLines();
  const [canal, setCanal] = useState<Canal | null>(null);
  const lineaMujer = lineas.data?.find((linea) => linea.tipo === "violencia" && linea.verificado);
  const linea911 = lineas.data?.find(esEmergencias911);
  const emergencias: Canal = linea911
    ? { id: linea911.id, nombre: linea911.nombre, telefono: linea911.telefono, telefonoMarcable: linea911.telefonoMarcable, detalle: linea911.descripcion }
    : EMERGENCIAS_RESPALDO;

  return (
    <div className="space-y-3">
      {lineas.isPending ? <LoadingState variante="compacto" etiqueta="Cargando el número verificado…" /> : null}
      {lineas.isError ? (
        <ErrorState
          nivel={3}
          error={lineas.error}
          titulo="No se pudo cargar el número de Línea Mujer"
          descripcion="Puedes reintentar. El 911 sigue disponible."
          onReintentar={() => void lineas.refetch()}
        />
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {lineaMujer ? (
          <Button
            variante="primario"
            iconoInicio={PhoneCall}
            data-guia="linea_mujer.llamar"
            aria-haspopup="dialog"
            className="sm:flex-1"
            onClick={() =>
              setCanal({
                id: lineaMujer.id,
                nombre: lineaMujer.nombre,
                telefono: lineaMujer.telefono,
                telefonoMarcable: lineaMujer.telefonoMarcable,
                detalle: [lineaMujer.descripcion, lineaMujer.disponibilidad].filter(Boolean).join(" "),
              })
            }
          >
            Llamar a Línea Mujer
          </Button>
        ) : null}
        <Button variante="secundario" iconoInicio={Phone} aria-haspopup="dialog" className="sm:flex-1" onClick={() => setCanal(emergencias)}>
          Llamar al 911
        </Button>
      </div>

      <Dialog
        abierto={canal !== null}
        onCerrar={() => setCanal(null)}
        tamano="sm"
        titulo={canal ? `¿Llamar a ${canal.nombre}?` : "Llamar"}
        descripcion="Tu teléfono abrirá la llamada. Este prototipo no llama por ti, no envía alertas, ubicación ni mensajes, y no registra la llamada."
        acciones={
          canal ? (
            <>
              <Button variante="secundario" onClick={() => setCanal(null)}>
                Cancelar
              </Button>
              <a href={hrefTelefono(canal.telefonoMarcable)} onClick={() => setCanal(null)} className={clasesBoton({ variante: "primario" })}>
                <Phone aria-hidden="true" className="size-[1.15em] shrink-0" />
                <span>Llamar al {canal.telefono}</span>
              </a>
            </>
          ) : null
        }
      >
        {canal ? (
          <div className="space-y-2">
            <p className="text-2xl font-semibold tracking-wide text-tinta">{canal.telefono}</p>
            <p className="text-[0.9375rem] text-tinta">{canal.detalle}</p>
            <Badge tono="exito">Número verificado en su fuente oficial</Badge>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
