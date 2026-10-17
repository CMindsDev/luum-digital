/**
 * Padrón de visitadoras y visitadores FICTICIO para la demostración del recorrido de verificación.
 * El padrón real del Portal Ciudadano (InspectoresEnLinea) publica fotografía, nombre, unidad y cargo;
 * esos datos personales NO se copiaron. Aquí todas las personas son inventadas y se rotulan así.
 * Los cargos sí son los que usa la fuente: Inspector, Interventor, Notificador, Perito, Recaudador,
 * Verificador y Visitador.
 */
export interface VisitadorDemo {
  id: string;
  nombre: string;
  cargo: "Inspector" | "Interventor" | "Notificador" | "Perito" | "Recaudador" | "Verificador" | "Visitador";
  unidad: string;
  credencial: string;
  vigente: boolean;
  vigenciaHasta: string;
  ejemplo: true;
}

export const LEYENDA_VISITADORES = "Personas ficticias de demostración. Consulta el padrón oficial en el Portal Ciudadano.";

export const VISITADORES_DEMO: readonly VisitadorDemo[] = [
  { id: "vis-001", nombre: "Laura Ejemplo Chí", cargo: "Inspector", unidad: "Unidad de ejemplo", credencial: "EJEMPLO-V-0001", vigente: true, vigenciaHasta: "2027-08-31", ejemplo: true },
  { id: "vis-002", nombre: "Mario Ficticio Uc", cargo: "Verificador", unidad: "Unidad de ejemplo", credencial: "EJEMPLO-V-0002", vigente: true, vigenciaHasta: "2027-08-31", ejemplo: true },
  { id: "vis-003", nombre: "Rosa Muestra Pech", cargo: "Notificador", unidad: "Unidad de ejemplo", credencial: "EJEMPLO-V-0003", vigente: true, vigenciaHasta: "2027-08-31", ejemplo: true },
  { id: "vis-004", nombre: "Jorge Prueba Dzul", cargo: "Perito", unidad: "Unidad de ejemplo", credencial: "EJEMPLO-V-0004", vigente: false, vigenciaHasta: "2025-12-31", ejemplo: true },
  { id: "vis-005", nombre: "Elena Simulada Tun", cargo: "Visitador", unidad: "Unidad de ejemplo", credencial: "EJEMPLO-V-0005", vigente: true, vigenciaHasta: "2027-08-31", ejemplo: true },
];
