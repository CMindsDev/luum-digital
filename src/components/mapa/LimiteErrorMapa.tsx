import { Component, type ReactNode } from "react";

interface Props {
  /** Se llama una vez si el motor del mapa (o su descarga diferida) lanza un error al renderizar. */
  onError: (error: unknown) => void;
  children: ReactNode;
}

interface Estado {
  fallo: boolean;
}

/** Límite de error del motor del mapa: el fallo se informa al contenedor, que muestra el respaldo. */
export class LimiteErrorMapa extends Component<Props, Estado> {
  state: Estado = { fallo: false };

  static getDerivedStateFromError(): Estado {
    return { fallo: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  render() {
    return this.state.fallo ? null : this.props.children;
  }
}
