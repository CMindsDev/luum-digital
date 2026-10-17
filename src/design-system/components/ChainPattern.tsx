import { PatronCadena, type PatronCadenaProps } from "./PatronCadena";

export type ChainPatternProps = PatronCadenaProps;

/**
 * Patrón de cadena del banner del Laboratorio. Es el mismo que PatronCadena (trazos exactos del
 * Figma); se conserva este nombre por compatibilidad con los módulos que ya lo usan. Decorativo.
 */
export function ChainPattern(props: ChainPatternProps) {
  return <PatronCadena {...props} />;
}
