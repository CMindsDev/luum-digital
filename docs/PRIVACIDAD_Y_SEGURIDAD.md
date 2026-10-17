# Privacidad y seguridad — merida-unificada

Este documento describe lo que el prototipo hace hoy para proteger datos y personas, los límites de cada decisión y la **revisión que se necesita antes de cualquier uso real**. Es un prototipo de demostración: **no realiza gestiones oficiales** y no procesa datos reales.

## 1. Principios

1. **Datos ficticios por diseño**: perfiles, documentos, reportes semilla, puntos, inspectores y demanda de bienestar son inventados y rotulados. Nunca se piden CURP, INE, comprobantes, tarjetas ni datos de contacto reales.
2. **Mínimo necesario**: lo que no hace falta para la demostración no se guarda.
3. **Separación de contextos**: administración y trámites, participación y recompensas, asistente general y bienestar son espacios distintos con almacenes distintos.
4. **Lo sensible no deja rastro**: sin persistencia, sin notificaciones, sin analítica, sin URLs con contenido, sin caché de datos.
5. **Nada que simule una emergencia**: el prototipo nunca finge que se activó un equipo de emergencia, que un profesional recibió un mensaje o que existe una cita.
6. **La seguridad real vive en el servidor**: los roles de la interfaz sirven para probar; no autorizan nada.

## 2. Separación de datos

| Espacio | Dónde vive | Persiste | Quién lo ve |
|---|---|---|---|
| Sesión de demostración (identidad activa) | `localStorage` (`merida-demo:v1:sesion`) | Sí, sólo el id de la identidad ficticia | La propia persona |
| Gestiones, reportes, verificaciones, puntos, canjes, notificaciones, expediente y privacidad | `localStorage` con prefijo `merida-demo:v1:datos:*` | Sí (datos ficticios) | Cada identidad ve sólo lo suyo; el operador ve la cola de revisión |
| Controles de demostración (sin conexión, latencia, error forzado) | `localStorage` | Sí | Quien prueba |
| Preferencias de Pekito (bienvenida vista, modo, lado) | `localStorage` (`merida-demo:v1:pekito`) | Sí; **nunca** contenido de conversaciones | La propia persona |
| Conversación con Pekito (ámbito general) | Memoria de la pestaña | **No** | La propia persona |
| Conversación de salud mental | Memoria de la pestaña (almacén propio, ámbito `bienestar`) | **No**; se pierde al recargar | La propia persona |
| Línea Mujer | Sin almacén: no guarda nada | **No** | — |
| Fotografías de reportes y verificaciones | Memoria (`URL.createObjectURL`, se revoca al cambiarla o cerrar el formulario) | **No**; sólo se registra que se adjuntó una | La propia persona |

- «**Restablecer demostración**» (en `/cuenta`) borra todas las claves con prefijo `merida-demo:v1:`.
- Si `localStorage` falla (modo privado, bloqueo), la app usa memoria y sigue funcionando sin persistencia.
- Bienestar, salud mental y Línea Mujer **no tienen colección** en el almacén demo y **nunca generan notificaciones**.
- El expediente ficticio y las conversaciones de bienestar **no se mezclan**: el asistente general no lee ese ámbito (ver apartado 5).

## 3. Controles técnicos

### Navegador
- **Geolocalización**: sólo tras tocar «Usar mi ubicación»; si se rechaza, se explica y se continúa con ubicación escrita o en el mapa.
- **Fotos**: tipo `image/jpeg|png|webp` y tamaño ≤ 5 MB; vista previa temporal; nunca se persisten ni se envían.
- **Service worker (PWA)**: sólo precachea recursos estáticos de la aplicación (`js, css, html, svg, png, woff*`). **No** cachea `/api`, teselas de mapas, conversaciones, documentos ni respuestas privadas (`runtimeCaching: []`, `/api/*` excluido de la navegación sin conexión). Una PWA instalable **no equivale** a una app publicada en tiendas.
- **Mapa**: se mantienen atribuciones; no se descargan teselas en masa ni se guardan para uso sin conexión.
- **Títulos de pestaña**: en `/bienestar/salud-mental` y `/bienestar/linea-mujer` el título es neutro («Servicios digitales de Mérida (prototipo)») para no revelar la sección en el historial o en pantallas compartidas.
- **URLs**: las consultas sobre salud mental o violencia en la búsqueda no quedan en la URL (viajan en el estado del historial de la pestaña y se limpian con `replace`).
- **Salida rápida** (Línea Mujer): botón y doble Esc que reemplazan la página por una neutral. **No borra el historial del navegador ni garantiza ocultar la actividad**, y la pantalla lo explica.

### Servidor ligero (`server/`)
- Es el **único lugar con claves** (`OPENAI_API_KEY`, `CLOUDFLARE_*`), siempre en variables sin prefijo `VITE_`. Nada secreto llega al navegador ni al repositorio (`.env.example` no tiene secretos; `.env*` está ignorado por Git).
- Escrituras sólo desde orígenes permitidos (`ORIGENES_PERMITIDOS`), límite de tamaño de cuerpo, límite de inicios por IP y hora, tiempo máximo por conversación y llamadas simultáneas acotadas.
- Respuestas de `/api/asistente/*` sin caché; cabeceras `X-Content-Type-Options: nosniff` y `Referrer-Policy: no-referrer`.
- **Los registros no contienen contenido**: sólo nombres de rutas, estados y probabilidades; nunca mensajes, pantallas, SDP ni valores de variables.
- La instantánea de pantalla que se envía al modelo se valida con un esquema acotado y **no incluye valores de formularios**, datos del expediente ni contenido de bienestar.

## 4. Recompensas (participación)

Reglas de **demostración** (valores configurables en `src/data/reglas-puntos.ts`, rotulados así):

- Los puntos de un reporte quedan **pendientes** y sólo se suman tras la validación simulada del operador.
- **Idempotencia** por clave de evento: repetir una validación o aprobación no acredita dos veces.
- **Nadie gana puntos por verificar su propio reporte**; sólo se verifica una vez por reporte.
- Se premia la **calidad** (comentario útil, ubicación confirmada, evidencia), **no** la respuesta positiva: decir que el problema persiste vale lo mismo que decir que se reparó. Una verificación aprobada puede decir que el bache sigue ahí.
- Un voto ciudadano **nunca cierra** un reporte; el estado municipal y la verificación ciudadana son ejes distintos.
- Cancelar un reporte cancela los puntos pendientes y revierte los aprobados, con motivo. Toda reversión exige motivo.
- Canjes sin saldo negativo; beneficios **ficticios** marcados como ejemplo (sin comercios reales ni descuentos municipales, fiscales o comerciales).
- **La popularidad o los puntos de una zona no deciden la prioridad del servicio**: la prioridad usa criterios explícitos (riesgo declarado, antigüedad, tipo).
- **Limitación importante**: todo esto ocurre en el navegador. Una persona con herramientas de desarrollo puede alterar `localStorage`. En una integración real, **la validación, el saldo y las reglas deben controlarse en el servidor** con autenticación.

## 5. Asistente (Pekito)

- Sólo ejecuta acciones de la **lista blanca** compartida; valida argumentos con el mismo esquema en navegador y servidor.
- **Prepara y abre; la persona confirma.** No envía formularios, no aprueba puntos, no cambia estados administrativos, no marca gestiones como completadas, no inventa folios ni envía documentos.
- Sólo dice que algo ocurrió si el **recibo** de la acción lo confirma.
- **Datos como datos, no como instrucciones**: textos de pantallas, fichas y documentos se tratan como información; nunca como órdenes.
- **No tiene acceso a la conversación de salud mental** (ámbito separado con su propio almacén, herramientas y escenarios).
- Modo local sin claves: respuestas **programadas**, etiquetadas como tales; no simula ser un modelo.
- Con IA real (opcional): la voz y el texto van a **OpenAI** (WebRTC directo del navegador; el servidor sólo intercambia la señalización). Para las **guardas Clef** (Cloudflare Workers AI) se envían los últimos mensajes recientes (máx. 6 × 400 caracteres) únicamente cuando hay credenciales y sólo para acciones de nivel B del asistente general, nunca para bienestar. Clef **nunca autoriza**: la confirmación en pantalla sigue siendo obligatoria y, si Clef falla, el flujo continúa con confirmación. Para el **conocimiento del asistente (RAG)** la consulta de la persona (máx. 200 caracteres) se envía a OpenAI sólo para calcular su embedding; no se registra ni se almacena.
- La retención y el uso de datos por parte de cada proveedor deben revisarse contractualmente antes de enviar cualquier dato real.

## 6. Salud mental

- **Ayuda humana primero**: el botón de ayuda inmediata está siempre visible y funciona **sin completar ninguna conversación**. No se hace esperar a nadie. Detección de riesgo con **lista local** (no depende sólo de un clasificador): ante palabras de riesgo se abre la ayuda humana antes de enviar el mensaje.
- **Acompañante opcional** (se puede ocultar y usar sólo texto), rotulado como simulación; no es una persona profesional ni un personaje oficial. **No diagnostica, no prescribe, no sustituye terapia, no afirma detectar vulnerabilidad clínica, no infiere emociones por cámara o biometría, no presiona a revelar experiencias íntimas, no promueve dependencia, no usa rachas, recompensas ni mensajes de culpa.**
- **Sin cuestionarios clínicos ni puntuaciones**: el anuncio público de tamizajes (Ruta de la Salud Mental, nota del 12-oct-2026) no equivale a disponer del instrumento ni de autorización para reproducirlo.
- Conversación **sólo en memoria**; sin persistencia automática, sin logs, sin analítica, sin URLs con contenido, sin uso para recompensas ni perfilado; nada se envía al asistente general ni al expediente sin consentimiento específico. **No se promete confidencialidad absoluta.** Botón «Borrar conversación».
- **Líneas de ayuda**: sólo las verificadas contra su fuente oficial, con fecha. 911 va primero. Alma Nova es **con cita, no una línea de crisis**. La **Línea de la Vida 800 911 2000** (CONASAMA) tiene fuente oficial identificada, pero su contenido no pudo leerse de forma automática el 2026-10-17: se muestra con esa nota y debe confirmarse a mano. **No se encontró ninguna línea municipal de crisis 24 h en fuentes oficiales y no se inventó una.** Los números de medios o marcadores (p. ej. `990 101 0714`, `9999999999`) no se usan; una prueba lo comprueba.
- **Demanda agregada** para el mapa: sólo para operador/administración, celdas H3 gruesas con **umbral mínimo de 10** (las menores se ocultan), datos **ficticios**, rotulada «no provienen de conversaciones». La ciudadanía ve sólo **dónde hay atención**, nunca puntos de salud mental.
- Persona adulta ficticia: **atender a menores requiere un diseño y una revisión específicos** (tutoría, consentimiento, protocolos).
- `BIENESTAR_IA_REAL=false` por defecto; aunque se active, exige consentimiento explícito.

## 7. Línea Mujer y ayuda especializada

- Tres acciones **distintas**: consultar información; abrir el canal oficial por decisión de la persona (llamar requiere una acción explícita y confirmación; número verificado); simular una solicitud (rotulada, sin enviar nada).
- **No** se envían alertas, ubicación ni mensajes a contactos reales; la app oficial «Línea Mujer» se describe pero **no se integra**.
- La atención especializada **no** se absorbe en un chatbot genérico.
- Sin notificaciones que revelen información sensible en pantallas compartidas.

## 8. Emergencias

- 911 siempre primero y como enlace `tel:` que la persona toca; el prototipo **no simula** que se activó un equipo de emergencia ni promete respuesta continua.
- Los números provienen de fuentes oficiales con fecha; si un dato no se pudo confirmar, se dice.

## 9. Revisión necesaria antes de uso real

No usar este prototipo con personas ni datos reales sin completar, como mínimo:

1. **Revisión legal y de privacidad** (no se investigó el marco legal aplicable): aviso de privacidad, base de tratamiento, derechos ARCO, conservación y transferencias; el área jurídica del Ayuntamiento debe determinar la normativa aplicable a datos personales y datos sensibles de salud.
2. **Salud mental**: revisión clínica y ética del acompañante, protocolos de crisis con profesionales, diseño específico para menores, evaluación de sesgos y pruebas con personas usuarias; confirmar horarios, canales y disponibilidad de cada servicio con sus responsables.
3. **Línea Mujer**: revisión con el Instituto de las Mujeres y especialistas en violencia de género; protocolos de seguridad (salida rápida, ocultar actividad) validados con ellas.
4. **Identidad y permisos**: autenticación real, roles, auditoría; **saldos, validaciones y recompensas en servidor**; convenios reales para cualquier beneficio.
5. **Proveedores de IA**: contratos, retención de datos, regiones, costos, límites y evaluación de las guardas con casos en español.
6. **Seguridad**: pruebas de intrusión, gestión de secretos, límites de uso por persona, *rate limiting* distribuido (el del prototipo es por proceso), política de cabeceras y CSP, revisión de dependencias.
7. **Derechos de uso** de fotografías, logotipos y marcas (el tablero del Figma incluye fotografías de personas identificables; no se confirmó su licencia).
8. **Accesibilidad**: auditoría con personas usuarias de lector de pantalla y navegación por teclado (el prototipo se probó con axe y pruebas automáticas, que no sustituyen una auditoría).
9. **Operación**: monitoreo sin contenido personal, plan de continuidad y respuesta a incidentes.
