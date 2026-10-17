import { useCallback, useEffect, useState } from "react";
import { validarFoto } from "@/domain/validaciones";

export interface FotoEvidencia {
  nombre: string;
  tamanoBytes: number;
  /** URL temporal (URL.createObjectURL); se revoca al cambiar o quitar la foto y al salir. */
  url: string;
}

/**
 * Foto opcional de evidencia de la verificación: sólo en memoria. Valida tipo (JPG, PNG o WebP) y
 * tamaño (≤ 5 MB), muestra una vista previa temporal y nunca se persiste ni se envía: sólo se
 * registra que hubo foto (criterio de calidad).
 */
export function useFotoEvidencia() {
  const [foto, setFoto] = useState<FotoEvidencia | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Revoca la URL anterior al cambiar de foto y al desmontar.
  useEffect(() => {
    if (!foto) return;
    return () => URL.revokeObjectURL(foto.url);
  }, [foto]);

  const seleccionar = useCallback((archivo: File | null | undefined) => {
    if (!archivo) return;
    const problema = validarFoto(archivo);
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setFoto({ nombre: archivo.name, tamanoBytes: archivo.size, url: URL.createObjectURL(archivo) });
  }, []);

  const quitar = useCallback(() => {
    setFoto(null);
    setError(null);
  }, []);

  return { foto, error, seleccionar, quitar };
}

export function formatearTamano(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
