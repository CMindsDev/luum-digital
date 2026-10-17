import { notificar } from "@/design-system";

/**
 * Registra el service worker de la PWA sólo en producción. Cuando hay una versión nueva se
 * muestra un aviso con «Actualizar» (registerType: "prompt"); nunca se recarga sin avisar.
 * El service worker sólo guarda recursos estáticos (ver vite.config.ts y docs/PRIVACIDAD_Y_SEGURIDAD.md).
 */
export function registrarServiceWorker(): void {
  if (!import.meta.env.PROD || typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  void import("virtual:pwa-register")
    .then(({ registerSW }) => {
      const actualizar = registerSW({
        onNeedRefresh() {
          notificar({
            tono: "info",
            titulo: "Hay una versión nueva del prototipo",
            descripcion: "Actualiza para usar la versión más reciente. Tus datos de demostración se conservan.",
            accion: { etiqueta: "Actualizar", alActivar: () => void actualizar(true) },
          });
        },
        onOfflineReady() {
          notificar({
            tono: "exito",
            titulo: "Lista para usarse sin conexión",
            descripcion: "Las pantallas ya visitadas abren sin red. Las acciones de la demo siguen siendo simuladas.",
          });
        },
      });
    })
    .catch(() => {
      // Sin service worker la app funciona igual (sólo pierde el modo sin conexión).
    });
}
