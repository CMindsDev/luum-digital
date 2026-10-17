/**
 * Errores de la capa de servicios. La UI los traduce a estados de error explícitos:
 * nunca se responde con un éxito ficticio cuando una integración no está disponible.
 */

/** Se configuró el modo de integración real, pero no existe adaptador para este contrato. */
export class IntegracionNoDisponibleError extends Error {
  readonly contrato: string;
  constructor(contrato: string) {
    super(`No hay una integración real disponible para ${contrato}. Esta acción no se realizó.`);
    this.name = "IntegracionNoDisponibleError";
    this.contrato = contrato;
  }
}

/** Sin conexión (real o simulada desde "Cuenta de demostración"). */
export class SinConexionError extends Error {
  constructor(message = "Sin conexión. Tus datos de demostración se conservan; intenta de nuevo al reconectar.") {
    super(message);
    this.name = "SinConexionError";
  }
}

/** Una regla de negocio impidió la operación (p. ej. saldo insuficiente, verificar el propio reporte). */
export class ReglaDeNegocioError extends Error {
  readonly codigo: string;
  constructor(codigo: string, message: string) {
    super(message);
    this.name = "ReglaDeNegocioError";
    this.codigo = codigo;
  }
}

/** La acción requiere un rol de demostración distinto (p. ej. operador). */
export class PermisoDemoError extends Error {
  constructor(message = "Esta acción sólo está disponible para la identidad de operador de demostración.") {
    super(message);
    this.name = "PermisoDemoError";
  }
}

export class NoEncontradoError extends Error {
  constructor(recurso: string) {
    super(`No se encontró ${recurso}.`);
    this.name = "NoEncontradoError";
  }
}
