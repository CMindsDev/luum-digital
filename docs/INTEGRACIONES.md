# Integraciones — merida-unificada

Cómo está separada la interfaz de los datos, qué es simulado hoy, qué haría falta para integrar sistemas reales y qué **no** debe asumirse sobre la infraestructura municipal.

> **Estado actual: ninguna integración con sistemas municipales es real.** Todo trámite, reporte, folio, pago, cita, punto, canje y expediente de este prototipo es una simulación local con datos ficticios. La «cuenta compartida» es una capacidad del prototipo, **no** una afirmación de autenticación municipal unificada.

## 1. Qué no se debe asumir

- **No existe una API, base de datos ni autenticación común** entre los sistemas municipales (Portal Ciudadano, Expediente Digital, Visor Urbano, Geoportal, Mérida Móvil, Reporta, sitios de Bienestar). La nota de prensa de MIDigital (11-ago-2026) habla de integrar «en un solo ecosistema»; eso **no pudo verificarse** y que un portal enlace a otro **no prueba** una integración técnica.
- Los botones «Iniciar» del Portal Ciudadano abren sistemas distintos (subdominios `*.gestiondetramites.merida.gob.mx` con inicio de sesión de Expediente Digital, y micrositios anteriores). Son flujos separados con su propia sesión.
- Visor Urbano y Geoportal usan *proxies* con token de sesión y están detrás de validación anti-bot; **no se publicaron condiciones de uso, licencia ni metadatos de capas**. No se debe asumir que sus capas sean descargables o reutilizables.
- Los endpoints internos que se vean en el JavaScript público de esos sitios **no son API pública**; el prototipo no los consulta.
- Las cifras, horarios y teléfonos cambian: cada dato del prototipo lleva fuente y fecha de consulta.

## 2. Arquitectura de contratos

Los componentes **no** importan datos simulados: consumen hooks de TanStack Query (`src/services/hooks`) que llaman a repositorios definidos como interfaces en `src/services/contracts/repositories.ts`. Un registro (`src/services/registry.ts`) elige la implementación según `VITE_INTEGRATION_MODE`.

```
Componentes ──▶ hooks (src/services/hooks) ──▶ contratos (src/services/contracts)
                                                   ▲                ▲
                         adaptadores demo ─────────┘                └───── adaptadores http (esqueletos)
                  (src/services/adapters/demo)                     (src/services/adapters/http)
                  localStorage con datos ficticios                 lanzan IntegracionNoDisponibleError
```

| Contrato | Responsabilidad | Adaptador simulado | Dependencias para uno real |
|---|---|---|---|
| `ServiceCatalogRepository` | Categorías, fichas, búsqueda, cobertura | Catálogo importado (387 fichas del Portal Ciudadano, 27 verificadas) + módulos manuales | Fuente autorizada del catálogo (hoy se lee el listado público; no hay API documentada) |
| `ProcedureRepository` | Borradores, envío con folio, seguimiento, pagos y citas | Gestiones en `localStorage`; folios `DEMO-G/P/C` | APIs de cada dependencia (los trámites en línea viven en subdominios distintos), pasarela de pago autorizada, agenda de citas |
| `ReportRepository` | Crear, aportar, validar, atender, cancelar reportes | Reportes semilla + nuevos; folio `DEMO-R-#######` | API de Reporta/Mérida Móvil (alta con folio, duplicados, seguimiento) y sus categorías reales |
| `VerificationRepository` | Verificación ciudadana y revisión | Verificaciones locales; rol de operador de demostración | Servicio propio con control de identidad, antifraude y revisión humana |
| `RewardRepository` | Reglas, saldo, movimientos, canjes | Libro mayor local con idempotencia | **Saldo y reglas en servidor**; convenios reales con comercios (hoy no hay ninguno) |
| `DigitalFileRepository` | Perfil, documentos, datos reutilizables, privacidad | Perfiles y documentos ficticios | Expediente Digital oficial (SSO, consentimiento, resguardo); tratamiento de datos personales |
| `WellbeingRepository` | Programas, líneas de ayuda, ubicaciones, solicitud simulada, demanda agregada | Datos verificados con fuente + demanda ficticia | Servicio de citas de Alma Nova (no hay API publicada); agregación real anonimizada |
| `NotificationRepository` | Notificaciones | Locales | Servicio de notificaciones con política de privacidad |
| `AssistantProvider` (`src/services/contracts/assistant.ts`) | Asistente con acciones | Demo programado y OpenAI Realtime vía servidor | Ver apartado 4 |

### Modo real sin adaptador

Con `VITE_INTEGRATION_MODE=real`, `createRepositories()` devuelve los adaptadores `http`, cuyos métodos rechazan con `IntegracionNoDisponibleError("<Contrato>.<método>")`. La interfaz lo muestra como **error explícito** (nunca un éxito ficticio). Para integrar un sistema, se reemplaza **un método a la vez** por una llamada a un backend autorizado y se prueba con el contrato.

### Reglas para escribir un adaptador real

1. Las credenciales viven **sólo en el servidor** (`server/`), nunca en variables `VITE_*`.
2. Validar argumentos y **permisos en el servidor** (el rol del operador de demostración no es seguridad).
3. Idempotencia en operaciones que acreditan o cobran (el prototipo usa `claveEvento`).
4. Errores tipados (`ReglaDeNegocioError`, `PermisoDemoError`, `SinConexionError`, `IntegracionNoDisponibleError`) para que la interfaz muestre su estado de error.
5. No registrar contenido personal ni de bienestar en logs, analítica ni URLs.

## 3. Autenticación y permisos pendientes

- Hoy hay **cuatro identidades ficticias** (dos ciudadanas, una operadora y una administración de demostración) que se cambian en `/cuenta`. No hay inicio de sesión.
- Una integración real requiere definir con el Ayuntamiento: proveedor de identidad (Expediente Digital usa CURP, celular o correo), consentimiento para reutilizar datos, roles de personal municipal y registro de auditoría.
- Los roles `operador` y `administracion` existen para **probar** validación de reportes, atención, revisión de verificaciones y aprobación de puntos; **no constituyen seguridad ni autorización de producción**.

## 4. Asistente (Pekito) y servidor ligero

El navegador sólo habla con `/api` (proxy de Vite al servidor Hono en `127.0.0.1:8787`). Rutas:

| Ruta | Función |
|---|---|
| `GET /api/salud` | Comprobación de vida |
| `GET /api/asistente/estado` | Disponibilidad de IA real, modo de las guardas, bandera de bienestar (sin secretos) |
| `POST /api/asistente/conexiones` | Crea la sesión OpenAI Realtime (intercambio SDP en el servidor); valida el contexto de pantalla; en el ámbito `bienestar` exige `BIENESTAR_IA_REAL=true` y consentimiento explícito |
| `DELETE /api/asistente/conexiones/:id` | Cuelga la llamada |
| `POST /api/asistente/guardas/accion` | Señal de Clef: ¿la persona pidió esta acción? (sólo acciones de nivel B) |
| `POST /api/asistente/guardas/intencion` | Clasificación de intención con Clef |

- **Modo local**: sin `OPENAI_API_KEY` funciona con **respuestas programadas** y la interfaz lo dice («Respuestas programadas (demostración)»). Nunca se simula una conexión a un modelo.
- **Acciones**: sólo las de la lista blanca de `shared/asistente/acciones.ts`, validadas con el mismo esquema en navegador y servidor, con niveles A (reversible), B (prepara y la persona confirma) y C (sólo abre una confirmación existente). El asistente recibe un *recibo* y sólo dice que algo ocurrió si el recibo lo confirma.
- **Clef** (Cloudflare Workers AI) es una señal adicional: **nunca autoriza**. Sin credenciales la confirmación en pantalla sigue siendo obligatoria. Modos: `off`, `shadow` (sólo informa), `enforce`.
- **Voz**: OpenAI Realtime por WebRTC; el audio no pasa por el servidor del prototipo. La capa de voz está detrás de `AssistantProvider`: un proveedor de voz distinto (por ejemplo ElevenLabs Agents con *client tools*) puede implementarse sin cambiar las pantallas. Esa alternativa **no está implementada**.
- Los nombres de modelo y voz por defecto (`gpt-realtime-2.1`, `marin`) provienen de proyectos de referencia: **verificar su disponibilidad y precio** en la documentación oficial antes de usarlos.
- Salud mental y Línea Mujer **no usan** este asistente: tienen su propio ámbito, almacén en memoria y escenarios revisables.

### Conocimiento del asistente (RAG)

El asistente general **sólo responde datos con lo que consulta** a `POST /api/asistente/conocimiento` (acción `consultarConocimiento`, nivel A: no navega ni abre nada).

- **Fuentes**: lista oficial de áreas municipales (`data/sources/dependencias/dependencias.html`, guardada desde el navegador porque el portal está tras un captcha anti-bot que no se evade), el catálogo de trámites (`src/data/catalogo/servicios.generated.json`) y una guía breve de la plataforma (`server/conocimiento/ingesta.ts`). Los conteos (p. ej. «14 direcciones») se calculan al ingerir y viajan ya hechos en pasajes de tipo `estructura`.
- **Índice**: `data/conocimiento/corpus.json` (pasajes con fuente y fecha) y `vectores.json` (embeddings `text-embedding-3-small`, 512 dimensiones, normalizados). Se regeneran con `npm run conocimiento:construir`; si cambias la página de dependencias o el catálogo, vuelve a correrlo.
- **Búsqueda híbrida**: palabras (BM25) + vectores con fusión por rangos. Sin clave de OpenAI o si falla la red, cae a sólo palabras. Si ningún pasaje supera los umbrales (`server/conocimiento/indice.ts`) devuelve una lista vacía y el asistente dice que no tiene el dato.
- **Alcance**: las instrucciones (`server/instrucciones/general.ts`) limitan al asistente a la plataforma; lo demás se declina con amabilidad.
- **Privacidad**: la consulta (máx. 200 caracteres) se envía a OpenAI sólo para calcular su embedding; no se registra ni se guarda. No se envían datos personales ni el expediente.
- **Pendiente**: las páginas individuales de cada dependencia (ubicación, teléfonos, directorio) no están en el corpus; el asistente remite al sitio oficial de cada área.

## 5. Mapa

- Con `VITE_MAPBOX_ACCESS_TOKEN` público (`pk.`) se usa Mapbox GL; sin token, MapLibre con el estilo gratuito de OpenFreeMap. Un token secreto (`sk.`) se rechaza. Restringe el token por URL en tu cuenta de Mapbox.
- Se mantienen las atribuciones de cada proveedor. **No** se descargan teselas masivamente ni se guardan para uso sin conexión (la política de OpenStreetMap lo prohíbe y las condiciones de caché de Mapbox no se revisaron).
- Capas oficiales del Visor Urbano o Geoportal: **requieren acceso autorizado** y revisar sus condiciones; mientras no existan, el mapa muestra sólo incidencias de demostración y ubicaciones de servicio verificadas.

## 6. Qué haría falta, en orden sugerido

1. Acuerdo con las áreas dueñas (Innovación y Gobierno Inteligente, Mejora Regulatoria, Servicios Públicos, Bienestar Humano, Instituto de las Mujeres) sobre APIs, autenticación y alcance.
2. Revisión legal y de privacidad (ver `docs/PRIVACIDAD_Y_SEGURIDAD.md`), especialmente salud mental, Línea Mujer y expediente.
3. Backend propio (o los de cada sistema) con autenticación, autorización, auditoría y límites de uso; migrar saldos, validaciones y recompensas al servidor.
4. Sustituir adaptadores `http` método por método, empezando por lectura (catálogo y estatus de reportes) antes de escritura.
5. Evaluar la versión de modelos y proveedores de IA con datos reales de uso y costos.
