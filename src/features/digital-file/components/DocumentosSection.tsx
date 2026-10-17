import { FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, EmptyState, ErrorState, LoadingState } from "@/design-system";
import { useDocuments } from "@/services/hooks";
import { EncabezadoSeccion } from "./EncabezadoSeccion";
import { TarjetaDocumento } from "./TarjetaDocumento";

/** Documentos ficticios del expediente con acceso a su vista previa marcada «DOCUMENTO DE EJEMPLO». */
export function DocumentosSection() {
  const { t } = useTranslation();
  const documentos = useDocuments();

  return (
    <Card as="section" id="documentos" aria-labelledby="titulo-documentos" relleno="lg" data-guia="expediente.documentos">
      <EncabezadoSeccion
        id="titulo-documentos"
        icono={FolderOpen}
        rotulo={t("Documentos")}
        titulo={t("Documentos de ejemplo")}
        descripcion={t("Copias ficticias para la demostración. Ninguna tiene validez oficial.")}
      />

      {documentos.isPending ? <LoadingState etiqueta={t("Cargando tus documentos de ejemplo…")} variante="compacto" /> : null}

      {documentos.isError ? (
        <ErrorState error={documentos.error} nivel={3} titulo={t("No pudimos cargar tus documentos")} onReintentar={() => void documentos.refetch()} />
      ) : null}

      {documentos.isSuccess && documentos.data.length === 0 ? (
        <EmptyState
          nivel={3}
          icono={FolderOpen}
          titulo={t("Esta identidad no tiene documentos de ejemplo")}
          descripcion={t("Las cuentas de operación de la demostración no guardan documentos. Cambia a una identidad ciudadana para verlos.")}
          className="py-6"
        />
      ) : null}

      {documentos.isSuccess && documentos.data.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {documentos.data.map((documento) => (
            <li key={documento.id}>
              <TarjetaDocumento documento={documento} />
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 text-sm text-tinta-suave">{t("Aquí no se suben archivos: el prototipo nunca pide CURP, INE ni comprobantes reales.")}</p>
    </Card>
  );
}
