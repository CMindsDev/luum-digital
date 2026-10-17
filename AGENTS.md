# AGENTS.md — merida-unificada

Guía para personas y agentes de programación que trabajan en este repositorio. Léela completa antes de cambiar código.

## 1. Contexto y objetivo

Prototipo funcional de **una sola aplicación y un solo portal responsivo** que unifica la experiencia de los servicios digitales del Ayuntamiento de Mérida, Yucatán. Evoluciona la identidad y los patrones de **Mérida Móvil** (referencia móvil principal, v4.0.2) y de los portales municipales (Portal Ciudadano/MIDigital, Expediente Digital, Visor Urbano, Reporta). Todo vive en el mismo AppShell, con pantallas internas, una cuenta de demostración compartida, seguimiento de gestiones y un asistente que opera la app.

**No es:** otro portal que compita con los existentes, un directorio de enlaces, una colección de iframes, un chatbot aislado, un dashboard empresarial ni una demo estática. Baches con recompensas y salud mental con acompañante son ampliaciones **dentro** del conjunto, no el producto.

**Es un prototipo de demostración:** no realiza gestiones oficiales, no hay API, base de datos ni autenticación municipal común. Todo lo transaccional es simulado y se etiqueta así.

## 2. Reglas de producto que no se negocian

1. **Rótulo permanente:** «Prototipo de demostración. No realiza gestiones oficiales» visible en el AppShell.
2. **No inventar** requisitos, costos, horarios, teléfonos, convenios, APIs ni folios. Lo no verificado se muestra como *pendiente de verificar*; lo ficticio se marca *Demostración*.
3. **Dos ejes distintos** en cada servicio: `estadoDeInformacion` (verificada | pendiente | demostracion) y `estadoDeIntegracion` (simulada | conectada). La UI expresa ambos (`InfoStatusBadge`, `IntegrationBadge`).
4. **Identificadores DEMO:** folios `DEMO-R-…` (reportes), `DEMO-G-…` (gestiones), `DEMO-P-…` (pagos), `DEMO-C-…` (citas), `DEMO-B-…` (canjes). Generados sólo en `src/domain/folios.ts`.
5. **Pagos:** recorrido simulado, nunca pedir tarjetas reales, nunca generar recibos con apariencia fiscal; toda confirmación dice «Pago simulado».
6. **Expediente:** perfil y documentos ficticios con marca «DOCUMENTO DE EJEMPLO». Nunca pedir CURP, INE ni comprobantes reales. Reutilizar datos sólo con confirmación explícita campo por campo.
7. **Reportes:** el estado municipal (`registrado | en_proceso | solucionado | cancelado`, etiquetas de Mérida Móvil) es distinto de la verificación ciudadana (`pendiente | coincide | discrepancia | no_concluyente`). Un voto ciudadano nunca cierra un reporte.
8. **Puntos:** sólo se suman tras la validación simulada; idempotencia por `claveEvento`; nadie gana puntos por verificarse a sí mismo; canjes sin saldo negativo; toda reversión con motivo; se premia la calidad, no la respuesta positiva; beneficios ficticios marcados como ejemplo; la popularidad o los puntos nunca deciden la prioridad del servicio.
9. **Salud mental:** conversación sólo en memoria (sin persistencia, logs, analítica ni datos en URLs), separada del asistente general y del expediente; botón de ayuda inmediata siempre visible y funcional sin completar el chat; el acompañante es opcional, no diagnostica, no prescribe, no usa rachas ni recompensas, se identifica como simulación/IA y no se presenta como mascota oficial. Sin cuestionarios clínicos ni puntuaciones inventadas.
10. **Línea Mujer:** consultar información ≠ abrir canal oficial (acción explícita, números verificados) ≠ simular solicitud (etiquetada). Nunca enviar alertas, ubicación ni mensajes reales. «Salida rápida» explica que no borra el historial.
11. **Asistente:** sólo acciones de la lista blanca (`shared/asistente/acciones.ts`); prepara y abre, la persona confirma; no inventa folios, no aprueba puntos, no cambia estados administrativos, no lee conversaciones de bienestar, no envía documentos. Sin claves en el navegador.
12. **Mapa:** capas de incidencias de demostración, información territorial oficial (sólo con acceso autorizado; hoy ninguna) y ubicaciones verificadas, siempre separadas y rotuladas. Nunca inventar límites catastrales, claves ni usos de suelo. Si el mapa falla, la lista y los formularios siguen funcionando. Salud mental nunca aparece como punto: la ciudadanía sólo ve dónde hay atención; operador/administración ven demanda **agregada** (celdas H3 gruesas, umbral mínimo, datos ficticios).
13. **Integraciones:** si `VITE_INTEGRATION_MODE=real` y no hay adaptador, mostrar error explícito (`IntegracionNoDisponibleError`), nunca un éxito ficticio. Un enlace externo no es una integración.

## 3. Stack y comandos

Node **24.21.0 LTS** (`.nvmrc`; funciona con advertencias en 23.x). npm con `.npmrc` (`legacy-peer-deps=true` por un fallo de npm 10.9).

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias (versiones exactas, `package-lock.json`). |
| `npm run dev` | Servidor ligero (`server/`, puerto 8787) + Vite (5173) con proxy `/api`. |
| `npm run build` | `tsc -b` (app, server, configs) + `vite build` + service worker. |
| `npm run lint` | ESLint. |
| `npm run test` | Vitest (jsdom). |
| `npm run test:e2e` | Playwright 1.63.0 (navegadores en caché) contra `vite preview` en modo e2e. |
| `npm run catalogo:importar` | Regenera el catálogo desde `data/sources/`. |

React 19.3 · TypeScript 6.0 estricto · Vite 8 · React Router 8 (`react-router`, `RouterProvider` desde `react-router/dom`) · TanStack Query 5 · Zustand 5 · React Hook Form 7 + Zod 4 · Tailwind CSS 4 (CSS-first, `@theme`) · lucide-react 1.x · motion 14 (`motion/react`) · react-map-gl 8 con mapbox-gl 3 (si hay token `pk.`) o maplibre-gl 6 + OpenFreeMap · h3-js 4 · Hono 4 en el servidor · Vitest 5 + Testing Library · Playwright 1.63 + axe-core.

## 4. Arquitectura y propiedad de carpetas

```
shared/asistente/        Contrato del asistente compartido navegador ↔ servidor (acciones, pantalla). Sin DOM ni Node.
server/                  Hono: estado, sesión OpenAI Realtime (proxy SDP), guardas Clef. Único lugar con claves.
src/app/                 Arranque, router, providers, AppShell (encabezado, navegación lateral/inferior, rótulo demo).
src/design-system/       Tokens (tokens.css) y componentes base accesibles. Sin lógica de negocio.
src/components/          Composites compartidos entre módulos (fichas, fuentes, estados, mapas de respaldo…).
src/features/<módulo>/   Pantallas y componentes de cada módulo. Un módulo no importa archivos internos de otro.
src/services/contracts/  Interfaces de repositorios, proveedor del asistente y errores.
src/services/adapters/   demo/ (simulación local) y http/ (esqueletos que lanzan IntegracionNoDisponibleError).
src/services/hooks/      Hooks de TanStack Query por repositorio. Los componentes usan SÓLO estos hooks.
src/services/registry.ts Selección de adaptadores por modo de integración.
src/domain/              Lógica pura y probada: puntos, duplicados, estados, búsqueda, intención, folios, validaciones.
src/data/                Semillas ficticias y catálogo generado. Sólo los adaptadores demo los importan.
src/types/               Tipos de dominio.
e2e/                     Recorridos A–K del brief, responsive, accesibilidad, PWA.
docs/                    Inventario, referencias UI, integraciones, privacidad y seguridad.
```

Separación obligatoria: **estado de interfaz** (Zustand, `src/app/stores` o `features/*/store.ts`), **datos consultados** (TanStack Query vía `src/services/hooks`), **persistencia de demostración** (`src/services/adapters/demo/storage.ts`), **lógica de negocio** (`src/domain`) e **integraciones externas** (`src/services/adapters/http`, `server/`).

## 5. Convenciones de código

- TypeScript estricto: sin `any`, sin `@ts-ignore`, sin casts dobles. `import type` para tipos.
- Vocabulario de dominio en español (como en el brief); nombres técnicos en inglés (`ReportRepository`, `useReports`, `ServiceCard`).
- Alias: `@/` → `src/`, `@shared/` → `shared/`. En `src/` no se usan rutas relativas que crucen módulos.
- Componentes funcionales, un componente principal por archivo, nombres en PascalCase. Rutas con `React.lazy` por módulo.
- Estilos con utilidades de Tailwind que usan **tokens** (`bg-superficie`, `text-tinta`, `rounded-tarjeta`…). No escribir colores hex en componentes.
- Íconos: `lucide-react`, con `aria-hidden` si son decorativos.
- Animación: `motion/react` bajo `MotionConfig reducedMotion="user"`; nada de animaciones infinitas con movimiento reducido.
- Formularios: React Hook Form + Zod; cada campo con `<label>`, ayuda y error asociados (`aria-describedby`, `aria-invalid`), foco al primer error, botón de envío deshabilitado mientras se procesa (evita dobles envíos).
- Cada pantalla de datos maneja **carga, vacío, error, éxito y sin conexión** con los componentes de `src/design-system` (`LoadingState`, `EmptyState`, `ErrorState`, `OfflineNotice`).
- Accesibilidad: un `<h1>` por pantalla, encabezados en orden, foco visible, objetivos táctiles ≥ 44 px, contraste AA, estados nunca sólo por color (ícono + texto), diálogos con foco atrapado y devuelto, navegación completa por teclado.
- Controles que el asistente puede señalar llevan `data-guia="modulo.control"` (ids estables en minúsculas, p. ej. `reportes.bache_a_la_vista`).
- Textos en español de México, breves y útiles; tuteo amable como Mérida Móvil.
- Sin `console.log` en código de producción; nunca registrar contenido de conversaciones ni datos personales.

## 6. Cómo ampliar servicios sin duplicar componentes

El catálogo es **dato**, no código. Para agregar un servicio:
1. Agrega o actualiza la fuente en `data/sources/` (o una entrada manual en `src/data/catalogo/servicios-manuales.ts` con `fuenteOficial`, fecha y `estadoDeInformacion`).
2. Ejecuta `npm run catalogo:importar`.
3. Elige su `tipoDeRecorrido`; la ficha (`/servicios/:id`) renderiza el componente correspondiente (`InformationalFlow`, `FormFlow`, `AppointmentFlow`, `PaymentFlow`, `DocumentLookupFlow`, `TerritorialLookupFlow`, `ReportFlow`, `VerificationFlow`). Si necesita un formulario ficticio, crea un escenario en `src/data/recorridos-demo.ts` (campos descritos con Zod), no un componente nuevo.
4. Agrega sinónimos en `palabrasClave` para la búsqueda en lenguaje natural.

## 7. Privacidad (resumen; detalle en docs/PRIVACIDAD_Y_SEGURIDAD.md)

- `localStorage` sólo para datos ficticios no sensibles y preferencias, con prefijo `merida-demo:v1:`. «Restablecer demostración» lo borra todo.
- Fotos: se validan tipo (`image/jpeg|png|webp`) y tamaño (≤ 5 MB), se muestran con `URL.createObjectURL` y se revocan; nunca se persisten.
- Geolocalización: sólo tras una acción explícita; si se rechaza, ubicación manual o en el mapa.
- Salud mental y Línea Mujer: sin persistencia, sin notificaciones, sin caché del service worker para datos, sin parámetros de URL con contenido.
- Secretos sólo en el servidor (`.env.local` sin prefijo `VITE_`). Nunca imprimirlos.

## 8. Pruebas

- Lógica de `src/domain` y adaptadores demo: pruebas unitarias obligatorias (reglas de puntos, canjes, duplicados, estados, búsqueda, intención, folios, acciones del asistente).
- Componentes con Testing Library cuando tengan comportamiento (formularios, diálogos, foco).
- E2E (Playwright) por recorrido del brief; sin red externa (los estilos de mapa se interceptan); sin errores de consola; sin desplazamiento horizontal en 390/768/1440 px.
- Reporta sólo pruebas que realmente ejecutaste.
