/** API pública del núcleo del asistente (sin interfaz). */
export { emitirActuacion, suscribirActuacion, type EventoActuacion, type OyenteActuacion } from "./acting-bus";
export {
  crearControladorAsistente,
  type ControladorAsistente,
  type OpcionesControlador,
  type ResultadoInicio,
} from "./controlador";
export {
  ejecutarAccion,
  fuentesDeRecibo,
  NOMBRES_REPORTE,
  RUTAS_SECCION,
  type ContextoEjecucion,
  type MotivoApoyo,
  type NavegarAsistente,
  type RepositoriosEjecutor,
} from "./ejecutor";
export { aplicaGuarda, crearClienteGuardas, type ClienteGuardas } from "./guardas";
export {
  construirPantalla,
  esVisibleYUsable,
  etiquetaAccesible,
  observarPantalla,
  pantallaMinima,
  seccionDeRuta,
  type OpcionesObservarPantalla,
  type OpcionesPantalla,
} from "./pantalla";
export {
  createAssistantStore,
  LIMITES_STORE,
  obtenerStoreAsistente,
  storeAsistenteBienestar,
  storeAsistenteGeneral,
  useAsistenteStore,
  type AccionEnCurso,
  type AvisoVisible,
  type EstadoAsistente,
  type MensajeConversacion,
  type StoreAsistente,
} from "./store";
