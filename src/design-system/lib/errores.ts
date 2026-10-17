import { t } from "i18next";
import {
  IntegracionNoDisponibleError,
  NoEncontradoError,
  PermisoDemoError,
  ReglaDeNegocioError,
  SinConexionError,
} from "@/services/contracts/errors";

export type TipoError = "integracion" | "sin_conexion" | "regla" | "permiso" | "no_encontrado" | "desconocido";

export interface ErrorDescrito {
  tipo: TipoError;
  titulo: string;
  descripcion: string;
  /** Si tiene sentido ofrecer «Reintentar». */
  reintentable: boolean;
}

function nombreDe(error: unknown): string | null {
  if (error instanceof Error) return error.name;
  if (typeof error === "object" && error !== null && "name" in error && typeof error.name === "string") return error.name;
  return null;
}

function mensajeDe(error: unknown): string | null {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return null;
}

/**
 * Traduce un error de la capa de servicios a un mensaje para la interfaz.
 * Nunca convierte un error en éxito: si una integración no existe, lo dice explícitamente.
 */
export function describirError(error: unknown): ErrorDescrito {
  const nombre = nombreDe(error);
  const mensaje = mensajeDe(error);

  if (error instanceof IntegracionNoDisponibleError || nombre === "IntegracionNoDisponibleError") {
    return {
      tipo: "integracion",
      titulo: t("Integración no disponible"),
      descripcion: t("{{mensaje}} Este prototipo no está conectado a sistemas municipales.", {
        mensaje: mensaje ?? t("No hay una integración real disponible."),
      }),
      reintentable: false,
    };
  }
  if (error instanceof SinConexionError || nombre === "SinConexionError") {
    return {
      tipo: "sin_conexion",
      titulo: t("Sin conexión"),
      descripcion: mensaje ?? t("Sin conexión. Tus datos de demostración se conservan; intenta de nuevo al reconectar."),
      reintentable: true,
    };
  }
  if (error instanceof PermisoDemoError || nombre === "PermisoDemoError") {
    return {
      tipo: "permiso",
      titulo: t("No disponible para esta identidad"),
      descripcion: mensaje ?? t("Cambia de identidad ficticia en «Cuenta de demostración» para usar esta acción."),
      reintentable: false,
    };
  }
  if (error instanceof ReglaDeNegocioError || nombre === "ReglaDeNegocioError") {
    return {
      tipo: "regla",
      titulo: t("No se pudo completar"),
      descripcion: mensaje ?? t("Una regla de la demostración impidió esta acción."),
      reintentable: false,
    };
  }
  if (error instanceof NoEncontradoError || nombre === "NoEncontradoError") {
    return {
      tipo: "no_encontrado",
      titulo: t("No encontramos lo que buscas"),
      descripcion: mensaje ?? t("Puede que se haya eliminado al restablecer la demostración."),
      reintentable: false,
    };
  }
  return {
    tipo: "desconocido",
    titulo: t("Algo salió mal"),
    descripcion: t("No pudimos cargar esta información. Intenta de nuevo en un momento."),
    reintentable: true,
  };
}

/** Errores que no tiene sentido reintentar automáticamente (reglas de negocio, permisos, integraciones). */
export function esErrorDefinitivo(error: unknown): boolean {
  const { tipo } = describirError(error);
  return tipo === "integracion" || tipo === "regla" || tipo === "permiso" || tipo === "no_encontrado";
}
