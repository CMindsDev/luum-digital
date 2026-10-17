import { Info, LogOut, PhoneCall, FlaskConical, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { SolicitudSimulada } from "@/components/ayuda/SolicitudSimulada";
import { Badge, PageHeader, type TonoInsignia } from "@/design-system";
import { AbrirCanalOficial } from "../components/AbrirCanalOficial";
import { BarraLineaMujer } from "../components/BarraLineaMujer";
import { InformacionLineaMujer } from "../components/InformacionLineaMujer";
import { useSalidaRapidaConEscape } from "../hooks/useSalidaRapida";
import { salirRapido } from "../lib/salida-rapida";

const ID_EXPLICACION = "salida-rapida-explicacion";

interface BloqueProps {
  numero: number;
  id: string;
  titulo: string;
  insignia: string;
  tono: TonoInsignia;
  icono: LucideIcon;
  descripcion: string;
  children: ReactNode;
}

/** Cada bloque deja claro qué tipo de acción es: consultar, abrir el canal oficial o simular. */
function Bloque({ numero, id, titulo, insignia, tono, icono, descripcion, children }: BloqueProps) {
  return (
    <section aria-labelledby={id} className="space-y-4 border-t border-borde pt-8 first:border-t-0 first:pt-0">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span aria-hidden="true" className="inline-flex size-8 items-center justify-center rounded-full bg-magenta-suave font-mono text-sm font-semibold text-magenta-tinta">
            {numero}
          </span>
          <h2 id={id} className="text-xl font-semibold text-marino sm:text-2xl">
            {titulo}
          </h2>
          <Badge tono={tono} icono={icono}>
            {insignia}
          </Badge>
        </div>
        <p className="mt-1.5 max-w-prose text-[0.9375rem] text-tinta-suave">{descripcion}</p>
      </div>
      {children}
    </section>
  );
}

/**
 * /bienestar/linea-mujer: vista interna con servicios verificados. Distingue consultar información,
 * abrir el canal oficial (llamada con confirmación) y simular una solicitud (sin enviar nada). No la
 * atiende un chatbot, no envía alertas, ubicación ni mensajes, y no genera notificaciones. Salida
 * rápida con botón y con Escape dos veces.
 */
export default function WomenSupportPage() {
  const { t } = useTranslation();
  useSalidaRapidaConEscape();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        antetitulo={t("Bienestar")}
        titulo={t("Línea Mujer")}
        regresar="/bienestar"
        descripcion={t(
          "Atención del Instituto de las Mujeres para mujeres en situación de violencia. Aquí puedes consultar información, abrir el canal oficial o probar una solicitud simulada: son tres cosas distintas.",
        )}
        etiquetaRegresar={t("Regresar")}
      />

      <BarraLineaMujer onSalir={() => salirRapido()} idExplicacion={ID_EXPLICACION} />

      <div className="mb-8 flex items-start gap-3 rounded-tarjeta border border-borde bg-superficie-2 px-4 py-3">
        <LogOut aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marino" />
        <p id={ID_EXPLICACION} className="text-sm text-tinta">
          <strong className="font-semibold">{t("Salida rápida:")}</strong>{" "}
          {t(
            "el botón (o pulsar Esc dos veces) cambia esta pestaña por una página neutral (google.com). No borra tu historial de navegación ni garantiza ocultar tu actividad: el botón «Atrás» y el historial pueden mostrar esta sección. Si te preocupa, usa una ventana privada y borra el historial. Esta sección no envía notificaciones.",
          )}
        </p>
      </div>

      <div className="space-y-10">
        <Bloque
          numero={1}
          id="consultar-informacion"
          titulo={t("Consultar información")}
          insignia={t("Sólo información")}
          tono="info"
          icono={Info}
          descripcion={t("Leer no abre ningún canal ni avisa a nadie. Cada servicio indica su fuente oficial y si la información está verificada.")}
        >
          <InformacionLineaMujer />
        </Bloque>

        <Bloque
          numero={2}
          id="abrir-canal-oficial"
          titulo={t("Abrir el canal oficial")}
          insignia={t("Acción explícita")}
          tono="marino"
          icono={PhoneCall}
          descripcion={t("Llamar requiere dos pasos: eliges a quién llamar y confirmas. La llamada la hace tu teléfono; el prototipo no la registra.")}
        >
          <AbrirCanalOficial />
        </Bloque>

        <Bloque
          numero={3}
          id="simular-solicitud"
          titulo={t("Simular una solicitud")}
          insignia={t("Simulación")}
          tono="ambar"
          icono={FlaskConical}
          descripcion={t("Sirve para ver cómo podría funcionar desde la app. No se envía a nadie.")}
        >
          <SolicitudSimulada
            tipo="linea_mujer"
            titulo={t("Solicitud de orientación de demostración")}
            descripcion={t(
              "En un servicio real, la orientación se pide llamando a Línea Mujer o acudiendo al Instituto de las Mujeres. Aquí sólo se simula.",
            )}
            atencionReal={t("Para recibir atención real, usa «Abrir el canal oficial» o acude a una sede del Instituto de las Mujeres.")}
            guia="linea_mujer.solicitud_simulada"
          />
        </Bloque>
      </div>
    </div>
  );
}
