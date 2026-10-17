/** Proveedores del asistente: demostración (respuestas programadas) y OpenAI Realtime. */
export { aviso, avisoPorCodigo, ErrorAsistente, type TipoAviso } from "./avisos";
export { DemoAssistantProvider, ETIQUETA_DEMO, type OpcionesProveedorDemo } from "./demo/DemoAssistantProvider";
export { ENTRADAS_BIENESTAR } from "./demo/escenarios-bienestar";
export { SesionDemo } from "./demo/sesion-demo";
export { detectarRiesgo, normalizar } from "./demo/texto";
export {
  consultarEstadoServidor,
  elegirProveedores,
  MOTIVO_SIN_SERVIDOR,
  type OpcionesElegirProveedor,
  type ProveedoresAsistente,
} from "./elegirProveedor";
export {
  DETECCION_TURNOS_VOZ,
  RealtimeAssistantProvider,
  SesionRealtime,
  type DependenciasRealtime,
  type OpcionesProveedorRealtime,
  type OpcionesSesionRealtime,
  type SalidaAudio,
} from "./realtime/RealtimeAssistantProvider";
