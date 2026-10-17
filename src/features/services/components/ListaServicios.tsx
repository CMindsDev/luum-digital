import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ServiceCard } from "@/components/catalogo";
import { Button } from "@/design-system";
import type { Servicio } from "@/types";

export interface ListaServiciosProps {
  servicios: readonly Servicio[];
  /** Nombre accesible de la lista. */
  etiqueta: string;
  /** Cuántos mostrar por página. */
  porPagina?: number;
  compacta?: boolean;
  nivelTitulo?: 2 | 3 | 4;
}

/**
 * Lista de tarjetas con «Mostrar más». Al cargar más, el foco pasa al primer servicio nuevo
 * para que quien navega con teclado o lector de pantalla no pierda su lugar.
 */
export function ListaServicios({ servicios, etiqueta, porPagina = 24, compacta = false, nivelTitulo = 3 }: ListaServiciosProps) {
  const { t } = useTranslation();
  const [visibles, setVisibles] = useState(porPagina);
  const listaRef = useRef<HTMLUListElement>(null);
  const enfocarDesde = useRef<number | null>(null);

  useEffect(() => {
    const indice = enfocarDesde.current;
    if (indice === null) return;
    enfocarDesde.current = null;
    const elemento = listaRef.current?.children.item(indice);
    elemento?.querySelector<HTMLAnchorElement>("a[href]")?.focus();
  }, [visibles]);

  const mostrados = servicios.slice(0, visibles);
  const restantes = servicios.length - mostrados.length;

  return (
    <div>
      <ul ref={listaRef} aria-label={etiqueta} className={compacta ? "grid gap-2.5 md:grid-cols-2" : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"}>
        {mostrados.map((servicio) => (
          <li key={servicio.id} className="min-w-0">
            <ServiceCard servicio={servicio} compacta={compacta} nivelTitulo={nivelTitulo} />
          </li>
        ))}
      </ul>
      {restantes > 0 ? (
        <div className="mt-5 flex flex-col items-center gap-2">
          <p className="text-sm text-tinta-suave">{t("Mostrando {{mostrados}} de {{total}}", { mostrados: mostrados.length, total: servicios.length })}</p>
          <Button
            variante="secundario"
            iconoInicio={ChevronDown}
            onClick={() => {
              enfocarDesde.current = mostrados.length;
              setVisibles((actual) => actual + porPagina);
            }}
          >
            {t("Mostrar {{cantidad}} más", { cantidad: Math.min(porPagina, restantes) })}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
