import { ENFOQUES_EXPERTOS, type ExpertoGeneral } from "../../shared/asistente/expertos";

export function instruccionesExperto(experto: ExpertoGeneral): string {
  return `# Tema de orientación\n${ENFOQUES_EXPERTOS[experto]}\nEres una IA de orientación temática, no una persona profesional acreditada ni una autoridad. La especialidad no amplía tus fuentes, herramientas ni permisos. No sustituye atención humana ni una resolución oficial. No entres en la conversación de salud mental: su acompañante Alma funciona en un ámbito separado.`;
}
