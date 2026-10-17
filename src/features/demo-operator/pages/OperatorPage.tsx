import { ClipboardCheck, History, Inbox } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useActiveIdentity } from "@/app/session/store";
import { ButtonLink, DemoTag, PageHeader, Tabs } from "@/design-system";
import { useVerificationsForReview } from "@/services/hooks";
import { AvisoDemostracion } from "../components/AvisoDemostracion";
import { ColaReportes } from "../components/ColaReportes";
import { RegistroAcciones } from "../components/RegistroAcciones";
import { RevisionVerificaciones } from "../components/RevisionVerificaciones";
import { SinPermisoOperador } from "../components/SinPermisoOperador";
import type { AccionRegistrada, RegistrarAccion } from "../lib/registro";

/** Vista de operación (sólo operador y administración): cola, revisión de verificaciones y registro. */
function VistaOperacion() {
  const { t } = useTranslation();
  const [pestana, setPestana] = useState("cola");
  const [acciones, setAcciones] = useState<AccionRegistrada[]>([]);
  const pendientes = useVerificationsForReview().data?.filter((v) => v.estadoRevision === "pendiente_revision").length;

  const registrar = useCallback<RegistrarAccion>((accion) => {
    const fecha = new Date().toISOString();
    setAcciones((actuales) => [{ ...accion, id: `${fecha}-${actuales.length}`, fecha }, ...actuales]);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <AvisoDemostracion />
      <Tabs
        etiqueta={t("Secciones de operación")}
        seleccionada={pestana}
        onCambiar={setPestana}
        pestanas={[
          { id: "cola", etiqueta: t("Cola de reportes"), icono: Inbox, contenido: <ColaReportes registrar={registrar} /> },
          {
            id: "verificaciones",
            etiqueta: t("Verificaciones"),
            icono: ClipboardCheck,
            conteo: pendientes,
            contenido: <RevisionVerificaciones registrar={registrar} />,
          },
          { id: "registro", etiqueta: t("Registro"), icono: History, conteo: acciones.length, contenido: <RegistroAcciones acciones={acciones} /> },
        ]}
      />
    </div>
  );
}

/**
 * /operador — operación de demostración: cola de reportes con prioridad por criterios explícitos,
 * validar, registrar atención, cancelar con motivo y revisión de verificaciones ciudadanas.
 */
export default function OperatorPage() {
  const { t } = useTranslation();
  const actor = useActiveIdentity();
  const esOperacion = actor.rol === "operador" || actor.rol === "administracion";

  return (
    <>
      <PageHeader
        destacado
        antetitulo={t("Demostración")}
        titulo={t("Operador de demostración")}
        descripcion={t("Valida reportes, registra la atención y revisa verificaciones ciudadanas. Todo es simulado y se refleja en las pantallas de las personas ficticias.")}
      >
        <DemoTag>{t("Sólo demostración")}</DemoTag>
        {esOperacion ? (
          <ButtonLink to="/operador" variante="secundario">
            {t("Volver al mapa de operaciones")}
          </ButtonLink>
        ) : null}
      </PageHeader>
      {esOperacion ? (
        <VistaOperacion />
      ) : (
        <div className="flex flex-col gap-5">
          <AvisoDemostracion />
          <SinPermisoOperador />
        </div>
      )}
    </>
  );
}
