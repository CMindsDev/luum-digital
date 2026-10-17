import { Crosshair, MapPinned, MapPinOff, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Button, cx } from "@/design-system";
import { msg } from "@/i18n";
import { LIMITES_MERIDA } from "@/domain/validaciones";
import type { Coordenadas } from "@/types";
import { formatearCoordenadas, redondearCoordenadas, VISTA_CIUDAD, ZOOM_COLONIA } from "./config";
import { MapaInteractivo } from "./MapaInteractivo";
import type { ControlMapa, VistaMapa } from "./tipos";

export interface SelectorUbicacionProps {
  /** Coordenadas elegidas (null si aún no hay). */
  valor: Coordenadas | null;
  /** Se llama al tocar el mapa, soltar el marcador o marcar el centro del mapa. */
  onCambiar: (coordenadas: Coordenadas) => void;
  /** Texto del grupo (legend). */
  etiqueta: string;
  /** Prefijo de los ids data-guia (por omisión «ubicacion»). */
  guia?: string;
  className?: string;
}

const AVISO_FUERA_DE_MERIDA = msg("Ese punto está fuera del municipio de Mérida. Elige un lugar dentro de la ciudad o sus comisarías.");

function dentroDeMerida({ lat, lng }: Coordenadas): boolean {
  return lat >= LIMITES_MERIDA.latMin && lat <= LIMITES_MERIDA.latMax && lng >= LIMITES_MERIDA.lngMin && lng <= LIMITES_MERIDA.lngMax;
}

function mismaPosicion(a: Coordenadas | null, b: Coordenadas | null): boolean {
  if (!a || !b) return a === b;
  return Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6;
}

/**
 * Selector de ubicación con mapa y marcador (lo usa el formulario de reportes).
 * - Tocar el mapa coloca el marcador; el marcador se puede arrastrar.
 * - Con teclado: enfoca el mapa, muévelo con las flechas y usa «Marcar el centro del mapa».
 * - Si el mapa no carga, muestra un aviso y NO bloquea el formulario (la dirección escrita sigue).
 * No pide la ubicación del dispositivo: eso es una acción explícita del formulario.
 */
export function SelectorUbicacion({ valor, onCambiar, etiqueta, guia = "ubicacion", className }: SelectorUbicacionProps) {
  const { t } = useTranslation();
  const idAyuda = useId();
  const idEstado = useId();
  const control = useRef<ControlMapa | null>(null);
  const ultimoPropio = useRef<Coordenadas | null>(valor);
  const [listo, setListo] = useState(false);
  const [aviso, setAviso] = useState("");
  // La vista inicial sólo se calcula al montar: después la cámara la mueve la persona.
  const [vistaInicial] = useState<VistaMapa>(() =>
    valor ? { latitude: valor.lat, longitude: valor.lng, zoom: ZOOM_COLONIA } : VISTA_CIUDAD,
  );

  const elegir = useCallback(
    (coordenadas: Coordenadas) => {
      if (!dentroDeMerida(coordenadas)) {
        setAviso(AVISO_FUERA_DE_MERIDA);
        return;
      }
      const redondeadas = redondearCoordenadas(coordenadas);
      setAviso("");
      ultimoPropio.current = redondeadas;
      onCambiar(redondeadas);
    },
    [onCambiar],
  );

  // Si el valor cambia desde fuera (p. ej. la colonia o la ubicación del dispositivo), se centra ahí.
  useEffect(() => {
    if (!valor || !listo || mismaPosicion(valor, ultimoPropio.current)) return;
    ultimoPropio.current = valor;
    control.current?.volarA({ centro: valor, zoom: Math.max(control.current.zoom(), ZOOM_COLONIA) });
  }, [valor, listo]);

  const marcarCentro = () => {
    const centro = control.current?.centro();
    if (centro) elegir(centro);
  };

  return (
    <fieldset className={cx("min-w-0", className)} data-guia={`${guia}.selector`}>
      <legend className="mb-1 font-semibold text-tinta">{etiqueta}</legend>
      <p id={idAyuda} className="mb-3 text-sm text-tinta-suave">
        {t("Toca el mapa o arrastra el marcador hasta el punto exacto. Con teclado: enfoca el mapa, muévelo con las flechas y elige «Marcar el centro del mapa».")}
      </p>

      <MapaInteractivo
        etiqueta={t("Mapa para elegir la ubicación")}
        descripcion={t("Mapa de Mérida para marcar el lugar del reporte. Si no puedes usarlo, escribe la dirección en el formulario.")}
        vistaInicial={vistaInicial}
        cooperativo
        marcador={
          valor
            ? {
                posicion: valor,
                etiqueta: t("Ubicación elegida: {{coordenadas}}", { coordenadas: formatearCoordenadas(valor) }),
                arrastrable: true,
                onArrastrado: elegir,
              }
            : null
        }
        onClic={(clic) => elegir(clic.posicion)}
        onControl={(nuevo) => {
          control.current = nuevo;
          setListo(nuevo !== null);
        }}
        className="h-72 sm:h-80"
        guia={`${guia}.mapa`}
        superposicion={
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-marino/70"
          >
            <Crosshair className="size-6" />
          </span>
        }
        respaldo={({ motivo, reintentar }) => (
          <div role="status" className="flex h-full flex-col justify-center gap-3 bg-aviso-suave p-5">
            <p className="flex items-start gap-2 text-[0.9375rem] text-tinta">
              <MapPinOff aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-aviso" />
              <Trans
                i18nKey="<0>El mapa no está disponible.</0> {{motivo}} Puedes seguir con la dirección escrita (calle, cruzamientos y colonia): el formulario no depende del mapa."
                values={{ motivo }}
                components={[<strong className="font-semibold" />]}
              />
            </p>
            <div>
              <Button variante="secundario" tamano="sm" iconoInicio={RotateCcw} onClick={reintentar}>
                {t("Reintentar el mapa")}
              </Button>
            </div>
          </div>
        )}
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variante="secundario"
          tamano="sm"
          iconoInicio={MapPinned}
          onClick={marcarCentro}
          disabled={!listo}
          aria-describedby={idAyuda}
          data-guia={`${guia}.marcar_centro`}
        >
          {t("Marcar el centro del mapa")}
        </Button>
        <p id={idEstado} aria-live="polite" className="min-w-0 text-sm text-tinta">
          {valor ? (
            <>
              <span className="font-semibold">{t("Ubicación marcada:")}</span> <span className="font-mono">{formatearCoordenadas(valor)}</span>
            </>
          ) : (
            t("Aún no marcas un punto en el mapa.")
          )}
        </p>
      </div>
      {aviso ? (
        <p role="alert" className="mt-2 text-sm font-medium text-peligro">
          {t(aviso)}
        </p>
      ) : null}
    </fieldset>
  );
}
