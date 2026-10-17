import { useDemoSession } from "@/app/session/store";
import { ETIQUETA_ROL } from "@/app/session/roles";
import { IDENTIDADES_DEMO } from "@/data/identidades";
import { Avatar, Badge, Card, notificar, RadioCardGroup } from "@/design-system";

/** Selector de identidad ficticia (no es autenticación municipal). */
export function IdentitySection() {
  const identidadId = useDemoSession((estado) => estado.identidadId);
  const cambiarIdentidad = useDemoSession((estado) => estado.cambiarIdentidad);

  const elegir = (id: string) => {
    if (id === identidadId) return;
    cambiarIdentidad(id);
    const elegida = IDENTIDADES_DEMO.find((identidad) => identidad.id === id);
    if (elegida) notificar({ tono: "info", titulo: `Ahora usas la demostración como ${elegida.nombre}` });
  };

  return (
    <Card as="section" aria-labelledby="titulo-identidad" relleno="lg">
      <h2 id="titulo-identidad" className="text-xl font-semibold text-marino">
        Identidad ficticia
      </h2>
      <p className="mt-1 max-w-prose text-[0.9375rem] text-tinta-suave">
        Elige con quién quieres recorrer la demostración. <strong className="font-semibold text-tinta">No es una cuenta ni una
        autenticación municipal</strong>: sólo cambia qué datos ficticios ves (reportes, gestiones, puntos) y qué acciones de operación
        tienes disponibles.
      </p>
      <RadioCardGroup
        className="mt-5"
        leyenda="Identidad activa"
        ocultarLeyenda
        name="identidad-demo"
        columnas={2}
        guia="cuenta.identidad"
        valor={identidadId}
        onCambiar={elegir}
        opciones={IDENTIDADES_DEMO.map((identidad) => ({
          valor: identidad.id,
          etiqueta: identidad.nombre,
          descripcion: identidad.descripcion,
          extra: (
            <span className="flex flex-col items-end gap-2">
              <Avatar iniciales={identidad.iniciales} tamano="sm" />
              <Badge tono={identidad.rol === "ciudadania" ? "azul" : "marino"}>{ETIQUETA_ROL[identidad.rol]}</Badge>
            </span>
          ),
        }))}
      />
    </Card>
  );
}
