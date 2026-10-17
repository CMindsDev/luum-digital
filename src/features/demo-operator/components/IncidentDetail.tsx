import { CheckCheck, ClipboardCheck, MessageCircle, UserRoundPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog } from "@/design-system";
import { useRegisterAttention, useReportFollowUp, useValidateReport } from "@/services/hooks/reports";
import { msg } from "@/i18n";
import type { Reporte } from "@/types";
import { COLORES_TEMA, ETIQUETA_CATEGORIA_REPORTE, ICONO_REPORTE, TONO_REPORTE } from "../lib/categorias";
import { ETIQUETAS_ESTADO } from "../lib/estados";

const EQUIPOS_DEMO = [
  msg("Cuadrilla de servicios públicos · Demo"),
  msg("Equipo de obras públicas · Demo"),
  msg("Equipo de alumbrado · Demo"),
  msg("Enlace de atención ciudadana · Demo"),
] as const;

const ETIQUETA_VERIFICACION: Record<Reporte["verificacion"], string> = {
  no_aplica: msg("Sin atención que verificar"),
  pendiente: msg("Verificación pendiente"),
  coincide: msg("Coincide"),
  discrepancia: msg("Discrepancia"),
  no_concluyente: msg("No concluyente"),
};

export function IncidentDetail({ reporte, onCerrar }: { reporte: Reporte; onCerrar: () => void }) {
  const { t } = useTranslation();
  const validar = useValidateReport();
  const atender = useRegisterAttention();
  const seguimiento = useReportFollowUp();
  const [accion, setAccion] = useState<"asignado" | "contacto_simulado" | "atender" | null>(null);
  const [equipo, setEquipo] = useState(EQUIPOS_DEMO[0]);
  const [nota, setNota] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const ocupado = validar.isPending || atender.isPending || seguimiento.isPending;

  const ejecutar = async (operacion: () => Promise<unknown>, mensaje: string) => {
    setError("");
    setExito("");
    try {
      await operacion();
      setExito(mensaje);
      setAccion(null);
      setNota("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("No pudimos guardar. Intenta de nuevo."));
    }
  };

  return (
    <Dialog
      abierto
      onCerrar={onCerrar}
      titulo={t("Atender incidencia")}
      descripcion={t("{{folio}} · Demostración · Integración simulada", { folio: reporte.folio })}
      tamano="lg"
    >
      <div className="space-y-5 pb-4">
        <div className="flex items-start gap-4">
          <span className={`op-category-icon ${COLORES_TEMA[TONO_REPORTE[reporte.categoria]]}`}>
            <img src={`/brand/tramites/${ICONO_REPORTE[reporte.categoria]}.svg`} alt="" />
          </span>
          <div>
            <h3 className="text-xl font-semibold">{t(ETIQUETA_CATEGORIA_REPORTE[reporte.categoria])}</h3>
            <p className="mt-1 text-sm text-tinta-suave">
              {reporte.ubicacion.colonia} · {reporte.ubicacion.referencia}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="op-badge">{t(ETIQUETAS_ESTADO[reporte.estadoMunicipal])}</span>
          {reporte.riesgoDeclarado ? <span className="op-badge bg-aviso-suave text-aviso">{t("Riesgo declarado")}</span> : null}
          <span className="op-badge">{t("Verificación ciudadana: {{estado}}", { estado: t(ETIQUETA_VERIFICACION[reporte.verificacion]) })}</span>
        </div>

        <p className="text-sm leading-relaxed">{t(reporte.descripcion)}</p>

        <dl className="grid grid-cols-2 gap-3 rounded-tarjeta bg-fondo p-4 text-sm">
          <div>
            <dt className="text-tinta-suave">{t("Equipo asignado")}</dt>
            <dd className="mt-1 font-medium">{reporte.equipoAsignado ?? t("Sin asignar")}</dd>
          </div>
          <div>
            <dt className="text-tinta-suave">{t("Persona reportante")}</dt>
            <dd className="mt-1 font-medium">{t("Identidad ficticia · {{identidadId}}", { identidadId: reporte.identidadId })}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2">
          {(reporte.estadoMunicipal === "registrado" || reporte.estadoMunicipal === "en_proceso") ? (
            <Button variante="secundario" iconoInicio={UserRoundPlus} disabled={ocupado} onClick={() => { setAccion("asignado"); setError(""); }}>
              {t("Asignar equipo")}
            </Button>
          ) : null}
          {reporte.estadoMunicipal === "registrado" ? (
            <Button
              iconoInicio={ClipboardCheck}
              disabled={ocupado}
              onClick={() => void ejecutar(() => validar.mutateAsync(reporte.id), t("Reporte validado. Ahora está en proceso de atención."))}
            >
              {t("Validar reporte")}
            </Button>
          ) : null}
          {reporte.estadoMunicipal === "en_proceso" ? (
            <Button variante="exito" iconoInicio={CheckCheck} disabled={ocupado} onClick={() => { setAccion("atender"); setError(""); }}>
              {t("Registrar atención")}
            </Button>
          ) : null}
          <Button variante="secundario" iconoInicio={MessageCircle} disabled={ocupado} onClick={() => { setAccion("contacto_simulado"); setError(""); }}>
            {t("Contactar · Demo")}
          </Button>
        </div>

        {accion ? (
          <form
            className="space-y-3 rounded-tarjeta border border-borde p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (accion === "atender") {
                void ejecutar(
                  () => atender.mutateAsync({ reporteId: reporte.id, nota }),
                  t("Atención simulada registrada. La verificación ciudadana queda pendiente."),
                );
              } else {
                void ejecutar(
                  () => seguimiento.mutateAsync({ reporteId: reporte.id, tipo: accion, texto: accion === "asignado" ? equipo : nota }),
                  accion === "asignado"
                    ? t("Equipo asignado en la demostración.")
                    : t("Contacto simulado registrado. No se envió ningún mensaje real."),
                );
              }
            }}
          >
            {accion === "asignado" ? (
              <label className="block text-sm font-semibold">
                {t("Equipo de demostración")}
                <select className="op-input mt-2" value={equipo} onChange={(e) => setEquipo(e.target.value)}>
                  {EQUIPOS_DEMO.map((opcion) => (
                    <option key={opcion}>{t(opcion)}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block text-sm font-semibold">
                {accion === "atender" ? t("Detalle de la atención simulada") : t("Mensaje de demostración")}
                <textarea
                  required
                  minLength={3}
                  maxLength={1000}
                  className="op-input mt-2"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder={t("Describe el seguimiento…")}
                />
              </label>
            )}
            {accion === "contacto_simulado" ? <p className="text-xs text-tinta-suave">{t("Se guardará en el historial de la demo. No se contactará a una persona real.")}</p> : null}
            <Button type="submit" disabled={ocupado}>{ocupado ? t("Guardando…") : t("Confirmar en la demo")}</Button>
          </form>
        ) : null}

        {error ? <p role="alert" className="rounded-control bg-peligro-suave p-3 text-sm text-peligro">{error}</p> : null}
        {exito ? <p role="status" className="rounded-control bg-exito-suave p-3 text-sm text-exito">{exito}</p> : null}

        <section>
          <h3 className="mb-3 font-semibold">{t("Historial del caso")}</h3>
          <ol className="space-y-3 border-l-2 border-borde pl-4">
            {[...reporte.historial].reverse().map((h, i) => (
              <li key={`${h.fecha}-${i}`} className="text-sm">
                <p>{t(h.descripcion)}</p>
                <time className="text-xs text-tinta-suave">{new Date(h.fecha).toLocaleString("es-MX")}</time>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Dialog>
  );
}
