/** Solo recuerda la lectura del aviso; no concede permisos a mapas, IA, ubicación o micrófono. */
export const CLAVE_AVISO_COOKIES = "luum:aviso-cookies:v1";
export const CLAVE_AVISO_SESION = `${CLAVE_AVISO_COOKIES}:sesion`;

export function avisoCookiesAtendido(): boolean {
  try {
    if (window.localStorage.getItem(CLAVE_AVISO_COOKIES) === "leido") return true;
  } catch {
    // Algunos navegadores bloquean el almacenamiento local y permiten el de sesión.
  }
  try { return window.sessionStorage.getItem(CLAVE_AVISO_SESION) === "aplazado"; }
  catch { return false; }
}

export function recordarAvisoCookies(aceptado: boolean): boolean {
  try {
    if (aceptado) window.localStorage.setItem(CLAVE_AVISO_COOKIES, "leido");
    else window.sessionStorage.setItem(CLAVE_AVISO_SESION, "aplazado");
    return true;
  } catch {
    // El acceso a la app continúa cuando el navegador bloquea el almacenamiento.
    return false;
  }
}

export function omitirAvisoInicial(ruta: string): boolean {
  // La información legal y la ayuda sensible deben estar accesibles sin un modal previo.
  return ["/legal", "/bienestar", "/operador", "/operaciones"].some((prefijo) => ruta === prefijo || ruta.startsWith(`${prefijo}/`));
}
