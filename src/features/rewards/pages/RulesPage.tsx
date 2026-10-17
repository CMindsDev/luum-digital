import { Ban, Check, Gift, Scale, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ButtonLink, Card, DemoTag, ErrorState, KeyValueList, LoadingState, PageHeader } from "@/design-system";
import { AVISO_PRIORIDAD, PESO_POR_TIPO } from "@/domain/prioridad";
import { CATEGORIAS_REPORTE, NOMBRE_CATEGORIA_REPORTE } from "@/domain/reportes";
import { useRewardRules } from "@/services/hooks";
import { CalculadoraPuntos } from "../components/CalculadoraPuntos";
import { puntosEnTexto } from "../lib/movimientos";
import { msg } from "@/i18n";

/** Tipos de incidente que suben la prioridad sugerida (mismo dato que usa src/domain/prioridad.ts). */
const TIPOS_CON_RIESGO = CATEGORIAS_REPORTE.filter((categoria) => PESO_POR_TIPO[categoria] > 0).map((categoria) => NOMBRE_CATEGORIA_REPORTE[categoria]);
const CRITERIOS_NUNCA = [
  msg("Puntos o saldo de quien reporta o verifica"),
  msg("Cuántas personas reportan, aportan o verifican"),
  msg("Popularidad o insistencia"),
] as const;

/**
 * /participacion/reglas — reglas de puntos de DEMOSTRACIÓN (src/data/reglas-puntos.ts, vía
 * useRewardRules) y la regla de que puntos y popularidad nunca deciden la prioridad de atención.
 */
export default function RulesPage() {
  const { t } = useTranslation();
  const reglas = useRewardRules();

  return (
    <>
      <PageHeader
        titulo={t("Reglas de puntos")}
        antetitulo={t("Participación")}
        regresar="/participacion"
        descripcion={t("Así se ganan, se validan y se canjean los puntos en esta demostración. Se premia la calidad, no la respuesta positiva.")}
      >
        <DemoTag>{t("Reglas de demostración")}</DemoTag>
      </PageHeader>

      {reglas.isPending ? (
        <LoadingState etiqueta={t("Cargando las reglas…")} />
      ) : reglas.isError ? (
        <ErrorState error={reglas.error} titulo={t("No pudimos cargar las reglas")} onReintentar={() => void reglas.refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          <div className="flex min-w-0 flex-col gap-5">
            <Card as="section" aria-labelledby="titulo-valores" relleno="lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="titulo-valores" className="text-xl font-semibold text-marino">
                  {t("Valores de la demostración")}
                </h2>
                <DemoTag>{t(reglas.data.etiqueta)}</DemoTag>
              </div>
              <KeyValueList
                className="mt-4"
                items={[
                  { id: "reporte", clave: t("Reporte validado"), valor: puntosEnTexto(reglas.data.reporteValidado) },
                  { id: "base", clave: t("Verificación aprobada (base)"), valor: puntosEnTexto(reglas.data.verificacionBase) },
                  {
                    id: "bono",
                    clave: t("Bono por criterio de calidad"),
                    valor: t("{{puntos}} por cada uno (comentario útil, ubicación confirmada, foto)", {
                      puntos: puntosEnTexto(reglas.data.verificacionBonoCalidad),
                    }),
                  },
                  { id: "no-concluyente", clave: t("«No pude comprobarlo» aprobado"), valor: puntosEnTexto(reglas.data.verificacionNoConcluyente) },
                  { id: "comentario", clave: t("Comentario útil"), valor: t("{{n}} caracteres o más", { n: reglas.data.longitudMinimaComentario }) },
                  { id: "aportacion", clave: t("Aportar a un reporte existente"), valor: t("{{puntos}} (no se premian duplicados)", { puntos: puntosEnTexto(reglas.data.aportacion) }) },
                ]}
              />
              <p className="mt-4 flex items-start gap-2 text-sm text-tinta-suave">
                <Settings2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>
                  Son valores configurables del prototipo (archivo <code className="font-mono text-tinta">src/data/reglas-puntos.ts</code>). No son
                  reglas oficiales: en una integración real las definiría el Ayuntamiento y se aplicarían en el servidor.
                </span>
              </p>
            </Card>

            <Card as="section" aria-labelledby="titulo-reglas" relleno="lg">
              <h2 id="titulo-reglas" className="text-xl font-semibold text-marino">
                Reglas
              </h2>
              <ul className="mt-4 flex flex-col gap-3" data-guia="recompensas.lista_reglas">
                {reglas.data.descripcion.map((regla) => (
                  <li key={regla} className="flex items-start gap-2.5 text-[0.9375rem] text-tinta">
                    <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-exito" />
                    <span>{t(regla)}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <CalculadoraPuntos reglas={reglas.data} />
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <Card as="section" aria-labelledby="titulo-prioridad" relleno="lg" tono="marino" data-guia="recompensas.regla_prioridad">
              <h2 id="titulo-prioridad" className="flex items-start gap-2 text-xl font-semibold text-white">
                <Scale aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-lima-logo" />
                {t("Los puntos y la popularidad no deciden la prioridad")}
              </h2>
              <p className="mt-3 text-[0.9375rem]">{AVISO_PRIORIDAD}</p>
              <h3 className="mt-4 text-base font-semibold text-white">Criterios que sí se usan</h3>
              <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[0.9375rem]">
                <li>Riesgo declarado por quien reporta (el de mayor peso).</li>
                <li>Antigüedad: cuántos días lleva sin cerrarse.</li>
                <li>Tipo de incidente con riesgo vial o sanitario: {TIPOS_CON_RIESGO.join(", ")}.</li>
              </ul>
              <h3 className="mt-4 text-base font-semibold text-white">Criterios que nunca se usan</h3>
              <ul className="mt-2 flex flex-col gap-1.5 text-[0.9375rem]">
                {CRITERIOS_NUNCA.map((texto) => (
                  <li key={texto} className="flex items-start gap-2">
                    <Ban aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-lima-logo" />
                    <span>{t(texto)}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card as="section" aria-labelledby="titulo-canjes-reglas" relleno="lg">
              <h2 id="titulo-canjes-reglas" className="text-lg font-semibold text-marino">
                ¿Y los beneficios?
              </h2>
              <p className="mt-2 text-[0.9375rem] text-tinta">
                Son ejemplos ficticios, sin comercios, patrocinios ni descuentos reales. Un canje nunca deja tu saldo en negativo.
              </p>
              <ButtonLink to="/participacion/recompensas" variante="secundario" iconoInicio={Gift} className="mt-4">
                Ver recompensas
              </ButtonLink>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
