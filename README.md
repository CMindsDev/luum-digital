# merida-unificada

Prototipo funcional de **una sola aplicación y un solo portal responsivo** que unifica la experiencia de los servicios digitales del Ayuntamiento de Mérida, Yucatán: catálogo municipal integrado, reportes con «Bache a la vista», verificación ciudadana y recompensas simuladas, Visor Urbano con zonas de alta demanda, Expediente Digital ficticio, Bienestar con salud mental y Línea Mujer, y un asistente (**Pekito**) que opera la aplicación.

> **Prototipo de demostración. No realiza gestiones oficiales.** No hay API, base de datos ni autenticación municipal: todo trámite, reporte, folio, pago, cita, punto y expediente es una **simulación local con datos ficticios**. Los folios llevan prefijo `DEMO-`. La identidad visual toma el Figma del Laboratorio de Innovación y los colores base del logotipo oficial del Ayuntamiento; «Pekito» y su mascota son provisionales y **no** son un personaje oficial.

## Requisitos

- **Node.js 24.21.0** (LTS, ver `.nvmrc`). Funciona con advertencias en Node 22.22+/23, pero 24 es la versión documentada.
- npm 10 o superior. El proyecto incluye `.npmrc` (`legacy-peer-deps=true`) por un fallo de npm 10.9 al resolver ciertas dependencias *peer*.
- Para las pruebas e2e: Playwright **1.63.0** (versión exacta) usa los navegadores ya instalados (Chromium y WebKit) en `~/Library/Caches/ms-playwright`; si no los tienes, `npx playwright install chromium`.
- **No** se necesita Docker, PostgreSQL, credenciales municipales ni una clave de IA.

## Instalación y ejecución

```bash
npm install
npm run dev
```

Abre **http://localhost:5173**. `npm run dev` levanta dos procesos y se detienen juntos:

| Proceso | Puerto | Para qué |
|---|---|---|
| Vite (frontend) | 5173 | La aplicación; proxy `/api` hacia el servidor |
| Servidor ligero (Hono) | 8787 | Estado del asistente, sesión de voz con OpenAI Realtime y guardas Clef. **Opcional**: sin él la app funciona con respuestas programadas |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Frontend + servidor ligero |
| `npm run dev:web` / `npm run server` | Sólo uno de los dos |
| `npm run build` | `tsc -b` (app, servidor, configuración) + `vite build` + service worker |
| `npm run preview` | Sirve la compilación de producción |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (jsdom y entorno node para el servidor) |
| `npm run test:e2e` | Playwright en 4 proyectos (móvil 390, tableta 768, escritorio 1440 y movimiento reducido) contra la compilación de producción |
| `E2E_BASE_URL=http://localhost:5173 npx playwright test <spec>` | Corre un spec contra un servidor ya levantado |
| `npm run catalogo:importar` | Regenera el catálogo desde `data/sources/` |
| `npm run docs:inventario` | Regenera `docs/INVENTARIO_SERVICIOS.md` |
| `npm run check` | lint + typecheck + test + build |

## Identidades de demostración

Se cambian en **Cuenta de demostración** (`/cuenta`). No es autenticación.

| Identidad | Rol | Para qué |
|---|---|---|
| Ana Ek | Ciudadanía | Tiene puntos suficientes para canjear |
| Bruno Canul | Ciudadanía | Tiene un bache «Registrado» en el Centro (para probar duplicados) |
| Carmen Dzib | Operadora de demostración | Valida reportes, registra atención, revisa verificaciones |
| Administración demo | Administración | Además ve la demanda agregada de bienestar en el mapa |

«**Restablecer demostración**» (en `/cuenta`) vuelve todo al estado inicial. También puedes simular falta de conexión, latencia o errores por módulo para revisar cada estado.

## Recorridos para probar

| | Recorrido | Cómo |
|---|---|---|
| A | Buscar → ficha → gestión simulada | En Inicio escribe «licencia de funcionamiento», abre la ficha, **Iniciar**, completa y envía: recibes un folio `DEMO-G-…` y la ves en **Mis gestiones** |
| B | Reporte de bache | **Reportes → Bache a la vista**: describe, ubicación escrita (o en el mapa), foto opcional, revisa y envía: folio `DEMO-R-…` en **Mis reportes** |
| C | Posible duplicado | Reporta un bache en el Centro, calle 60 (cerca de 59 y 61): elige «Es el mismo incidente: aportar información»; no se crea reporte ni puntos |
| D | Operador registra atención | Como **Carmen** (operadora): `/operador`, elige un reporte «En proceso» y registra la atención |
| E | Verificación y puntos una sola vez | Como **Bruno**: verifica el reporte solucionado de Ana; como **Carmen**: aprueba la verificación; repetir la aprobación no duplica puntos |
| F | Canje | Como **Ana**: `/participacion/recompensas`, canjea un beneficio de ejemplo; el saldo baja y nunca queda negativo |
| G | Expediente | `/expediente`: documentos ficticios; en un trámite con formulario usa «Usar datos de mi expediente» y confirma campo por campo |
| H | Visor Urbano | `/mapa`: filtra por tipo y estado, abre una incidencia y regresa con los filtros intactos |
| I | Salud mental | `/bienestar/salud-mental`: conversación de demostración y **Ayuda inmediata** (funciona sin completar el chat) |
| J | Pekito | Botón **Pekito**, escribe «Quiero reportar un bache en la calle 60 del Centro»: abre el formulario preparado y **tú confirmas** |
| K | Catálogo | `/servicios`: empleo, cultura, negocios, bienestar… sin salir a otra web |

## Datos de demostración

- **Catálogo**: 387 fichas del listado público del Portal Ciudadano (consulta 2026-10-17), de las cuales **27 verificadas** (requisitos, costo, tiempos y canales copiados tal como se publican) y **360 pendientes de verificar** (sólo datos del listado). Más 13 módulos manuales (Bache a la vista, Visor Urbano, Expediente Digital, registros de visitas y regulaciones…). **No es la lista completa de servicios municipales.** Ver `docs/INVENTARIO_SERVICIOS.md`.
- **Reportes, verificaciones, puntos, expediente, inspectores y demanda de bienestar**: ficticios. Los puntos usan **reglas de demostración** (`src/data/reglas-puntos.ts`) y los beneficios son ejemplos sin comercios reales.
- **Teléfonos y datos de contacto**: sólo los verificados contra su fuente oficial, con fecha. Los pendientes se rotulan «Pendiente de verificar».
- **Mapa**: incidencias de demostración (Mérida); colonias con centroides aproximados rotulados como tales.

## IA y voz (opcional)

Sin claves el asistente usa **respuestas programadas** y la interfaz lo dice. Para probar voz con IA real crea `.env.local` a partir de `.env.example` y completa `OPENAI_API_KEY` (y, opcionalmente, `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_AI_TOKEN` para las guardas Clef). Las claves viven **sólo en el servidor** (nunca en variables `VITE_*`). Verifica la disponibilidad y el precio del modelo en `ASISTENTE_REALTIME_MODEL` antes de usarlo. Detalles en `docs/INTEGRACIONES.md`.

El mapa usa **MapLibre + OpenFreeMap** sin configuración; con un token público de Mapbox (`pk.`) en `VITE_MAPBOX_ACCESS_TOKEN` cambia a Mapbox.

## Documentación

| Archivo | Contenido |
|---|---|
| `AGENTS.md` | Contexto, reglas de producto, convenciones y cómo ampliar servicios (para personas y agentes) |
| `docs/INVENTARIO_SERVICIOS.md` | Cobertura, fuentes, estado de verificación e implementación, pendientes |
| `docs/REFERENCIAS_UI.md` | Referencias visuales, colores, tipografía, decisiones y diferencias por validar |
| `docs/INTEGRACIONES.md` | Contratos, adaptadores simulados, dependencias para integrar sistemas reales |
| `docs/PRIVACIDAD_Y_SEGURIDAD.md` | Separación de datos, límites del asistente, recompensas, salud mental, emergencias y revisión previa a uso real |
| `docs/referencias/figma/ESPECIFICACION_FIGMA.md` | Especificación extraída del Figma (tokens, componentes, copy, contrastes) |
| `docs/investigacion/2026-10-17/` | Resultados de la investigación de fuentes (JSON) |

## Limitaciones

- Todo es **simulado**; ninguna integración con sistemas municipales es real y no se enviaron formularios ni se hizo ninguna operación en sistemas del Ayuntamiento.
- Varios sitios oficiales (portal municipal, Mérida Móvil web, Reporta, Visor Urbano, Geoportal) están detrás de validación anti-bot; **no se evadió**. Se usaron páginas accesibles, fichas oficiales de tiendas de aplicaciones y capturas fechadas de Wayback Machine. Visor Urbano y Geoportal **no se renderizaron**: el mapa del prototipo es propio y **no** incluye capas catastrales, claves ni usos de suelo.
- La interfaz de Mérida Móvil se conoce por arte de tienda, que no cubre todas las pantallas; algunos colores son estimados.
- Línea de la Vida (800 911 2000, CONASAMA): fuente oficial identificada pero no legible de forma automática; se muestra con esa nota. No se encontró una línea municipal de crisis 24 h en fuentes oficiales y no se inventó una.
- Las fotografías del tablero del Figma muestran personas identificables y **no se confirmó su licencia**: no publicar sin resolverlo.
- Los puntos, validaciones y roles viven en el navegador: **no son seguridad**. En una integración real deben controlarse en el servidor.
- Las pruebas automáticas (incluido axe) no sustituyen una auditoría de accesibilidad con personas usuarias.
- La PWA (manifest y service worker de recursos estáticos) permite instalar el prototipo; **no equivale** a una app publicada en tiendas ni funciona sin conexión más allá de sus recursos estáticos.
- Salud mental: el acompañante es una simulación **no clínica** para una persona adulta ficticia; cualquier uso real requiere revisión clínica, ética y legal (ver `docs/PRIVACIDAD_Y_SEGURIDAD.md`).
