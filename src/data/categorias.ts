import type { Categoria } from "@/types";

/**
 * Categorías de navegación del Catálogo Municipal del prototipo, orientadas a tareas ciudadanas.
 * El importador (scripts/import-catalog.ts) documenta cómo se mapean las 21 categorías del Portal
 * Ciudadano a éstas. Íconos: nombres de lucide-react admitidos por design-system/lib/iconos.ts.
 */
export const CATEGORIAS: readonly Categoria[] = [
  {
    id: "reportes",
    nombre: "Reportes de la ciudad",
    descripcion: "Baches, luminarias, rejillas, basura y otros problemas en la vía pública.",
    icono: "megaphone",
    tono: "ambar",
  },
  {
    id: "pagos",
    nombre: "Pagos y contribuciones",
    descripcion: "Predial, contribuciones municipales y constancias de no adeudo.",
    icono: "wallet",
    tono: "azul",
  },
  {
    id: "negocios",
    nombre: "Negocios",
    descripcion: "Apertura de empresas, licencias de funcionamiento y apoyos para emprender.",
    icono: "store",
    tono: "cafe",
  },
  {
    id: "empleo",
    nombre: "Empleo",
    descripcion: "Bolsa de trabajo, capacitación para el empleo y el autoempleo.",
    icono: "briefcase",
    tono: "marino",
  },
  {
    id: "territorio",
    nombre: "Catastro y desarrollo urbano",
    descripcion: "Trámites de predios, cédulas catastrales, uso de suelo y construcción.",
    icono: "map-pinned",
    tono: "lima",
  },
  {
    id: "atencion_ciudadana",
    nombre: "Atención ciudadana",
    descripcion: "Ayuntatel, orientación, constancias y asesoría para hacer tus gestiones.",
    icono: "messages-square",
    tono: "azul",
  },
  {
    id: "regulaciones",
    nombre: "Regulaciones y transparencia",
    descripcion: "Registro de Regulaciones, acceso a la información y protección de datos.",
    icono: "scroll-text",
    tono: "cafe",
  },
  {
    id: "visitas_domiciliarias",
    nombre: "Visitas domiciliarias",
    descripcion: "Consulta qué visitas e inspecciones existen y verifica a quien te visita.",
    icono: "clipboard-check",
    tono: "marino",
  },
  {
    id: "bienestar",
    nombre: "Salud y bienestar",
    descripcion: "Salud, apoyo psicológico, asistencia social y atención a mujeres.",
    icono: "heart-handshake",
    tono: "magenta",
  },
  {
    id: "educacion",
    nombre: "Educación",
    descripcion: "Becas, cursos, academias y talleres de acompañamiento académico.",
    icono: "graduation-cap",
    tono: "azul",
  },
  {
    id: "cultura",
    nombre: "Cultura",
    descripcion: "Museos, talleres artísticos, música, danza y apoyos culturales.",
    icono: "drama",
    tono: "magenta",
  },
  {
    id: "deporte",
    nombre: "Deporte",
    descripcion: "Entrenamientos, clases deportivas e instalaciones municipales.",
    icono: "trophy",
    tono: "lima",
  },
  {
    id: "medio_ambiente",
    nombre: "Medio ambiente y animales",
    descripcion: "Bienestar animal, áreas verdes y cuidado del medio ambiente.",
    icono: "leaf",
    tono: "lima",
  },
  {
    id: "seguridad",
    nombre: "Seguridad y legalidad",
    descripcion: "Protección civil, permisos de eventos, constancias y trámites legales.",
    icono: "shield-check",
    tono: "marino",
  },
  {
    id: "turismo",
    nombre: "Turismo",
    descripcion: "Información turística, visitas guiadas y capacitación turística.",
    icono: "tree-palm",
    tono: "ambar",
  },
];
