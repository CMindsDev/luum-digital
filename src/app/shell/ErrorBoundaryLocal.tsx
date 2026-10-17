import { Component, type ReactNode } from "react";

interface Props {
  /** Qué mostrar si falla el contenido (p. ej. una versión sin datos). */
  respaldo: ReactNode;
  children: ReactNode;
}

interface Estado {
  fallo: boolean;
}

/**
 * Límite de error pequeño para piezas del AppShell que dependen de datos (p. ej. la campana):
 * si fallan, el resto del AppShell sigue funcionando.
 */
export class ErrorBoundaryLocal extends Component<Props, Estado> {
  state: Estado = { fallo: false };

  static getDerivedStateFromError(): Estado {
    return { fallo: true };
  }

  render() {
    return this.state.fallo ? this.props.respaldo : this.props.children;
  }
}
