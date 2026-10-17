import { ModulePlaceholder } from "@/components/ModulePlaceholder";

/** Marcador de F1: el módulo «demo-operator» reemplaza esta página. Título y regresar vienen de `handle` de la ruta. */
export default function PlaceholderPage() {
  return <ModulePlaceholder modulo="demo-operator" />;
}
