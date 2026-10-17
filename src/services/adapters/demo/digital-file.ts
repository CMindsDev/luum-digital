import { PERFILES_DEMO, PRIVACIDAD_PREDETERMINADA } from "@/data/expediente";
import type { DigitalFileRepository } from "@/services/contracts";
import type { CampoReutilizable, IdentidadDemo, PerfilDemo } from "@/types";
import { porFechaDesc } from "./comun";
import { operacionDemo, type ContextoDemo } from "./storage";

function perfilDe(actor: IdentidadDemo): PerfilDemo {
  return (
    PERFILES_DEMO[actor.id] ?? {
      identidadId: actor.id,
      nombreCompleto: actor.nombre,
      correo: `${actor.id}@ejemplo.mx`,
      telefono: "999 000 0000",
      domicilio: { calle: "Calle 00", numero: "000", colonia: "Centro", codigoPostal: "97000" },
      leyenda: "Datos ficticios de demostración",
    }
  );
}

export function crearExpedienteDemo(contexto: ContextoDemo): DigitalFileRepository {
  const { almacen } = contexto;
  return {
    getProfile: (actor) => operacionDemo(contexto, "digitalFile", "lectura", () => perfilDe(actor)),

    listDocuments: (actor) =>
      operacionDemo(contexto, "digitalFile", "lectura", () =>
        almacen
          .leer("documentos")
          .filter((d) => d.identidadId === actor.id)
          .sort(porFechaDesc((d) => d.fecha)),
      ),

    getDocument: (id, actor) =>
      operacionDemo(contexto, "digitalFile", "lectura", () => almacen.leer("documentos").find((d) => d.id === id && d.identidadId === actor.id) ?? null),

    listReusableFields: (actor) =>
      operacionDemo(contexto, "digitalFile", "lectura", (): CampoReutilizable[] => {
        const perfil = perfilDe(actor);
        return [
          { campo: "nombreCompleto", etiqueta: "Nombre completo", valor: perfil.nombreCompleto },
          { campo: "correo", etiqueta: "Correo electrónico", valor: perfil.correo },
          { campo: "telefono", etiqueta: "Teléfono", valor: perfil.telefono },
          { campo: "calle", etiqueta: "Calle", valor: perfil.domicilio.calle },
          { campo: "numero", etiqueta: "Número", valor: perfil.domicilio.numero },
          { campo: "colonia", etiqueta: "Colonia", valor: perfil.domicilio.colonia },
          { campo: "codigoPostal", etiqueta: "Código postal", valor: perfil.domicilio.codigoPostal },
        ];
      }),

    getPrivacy: (actor) =>
      operacionDemo(contexto, "digitalFile", "lectura", () => almacen.leer("privacidad")[actor.id] ?? PRIVACIDAD_PREDETERMINADA),

    updatePrivacy: (cambios, actor) =>
      operacionDemo(contexto, "digitalFile", "mutacion", () =>
        almacen.modificar("privacidad", (todas) => {
          const nuevas = { ...(todas[actor.id] ?? PRIVACIDAD_PREDETERMINADA), ...cambios, confirmarAntesDeReutilizar: true as const };
          return { valor: { ...todas, [actor.id]: nuevas }, resultado: nuevas };
        }),
      ),
  };
}
