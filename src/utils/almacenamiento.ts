/**
 * Acceso seguro a localStorage: en modo privado, con datos bloqueados o en pruebas puede fallar.
 * Si falla, se usa memoria (la demo sigue funcionando, sin persistencia entre recargas).
 */
export const PREFIJO_DEMO = "merida-demo:v1:";

const memoria = new Map<string, string>();

const respaldoEnMemoria: Storage = {
  get length() {
    return memoria.size;
  },
  clear: () => memoria.clear(),
  getItem: (clave) => memoria.get(clave) ?? null,
  key: (indice) => Array.from(memoria.keys())[indice] ?? null,
  removeItem: (clave) => void memoria.delete(clave),
  setItem: (clave, valor) => void memoria.set(clave, valor),
};

export function almacenamientoSeguro(): Storage {
  try {
    const prueba = `${PREFIJO_DEMO}__prueba__`;
    window.localStorage.setItem(prueba, "1");
    window.localStorage.removeItem(prueba);
    return window.localStorage;
  } catch {
    return respaldoEnMemoria;
  }
}

/** Borra todas las claves de la demostración (prefijo merida-demo:v1:). */
export function borrarDatosDemo(): void {
  const almacenamiento = almacenamientoSeguro();
  const claves: string[] = [];
  for (let i = 0; i < almacenamiento.length; i += 1) {
    const clave = almacenamiento.key(i);
    if (clave?.startsWith(PREFIJO_DEMO)) claves.push(clave);
  }
  for (const clave of claves) almacenamiento.removeItem(clave);
}
