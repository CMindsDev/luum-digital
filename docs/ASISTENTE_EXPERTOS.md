# Avatares y orientación temática

Peekito usa el fondo crema `#FFF8EC` del frame Figma `22:67`. Los textos, enlaces y controles conservan contraste AA; los colores de acento del diseño no se usan como texto pequeño cuando no alcanzan ese contraste. El nombre visible es **Peekito**, con doble e; los identificadores de código y las preferencias existentes se conservan para no romper compatibilidad.

| Tema | Avatar | Procedencia |
|---|---|---|
| General | Peekito magenta | Recurso existente |
| Salud mental | Alma, gato amarillo | Figma `64:1255` |
| Urbano y catastro | Ave verde | Figma `61:1238` |
| Jurídico municipal | Animal café | Figma `61:1239` |
| Trámites y pagos | Tortuga azul | Ilustración original creada para el prototipo |
| Medio ambiente y servicios públicos | Iguana magenta | Ilustración original creada para el prototipo |

Los tres recursos nuevos de Figma se conservan sin modificar. Los SVG están en `public/brand/laboratorio/agente/`; sus proporciones se mantienen dentro de un espacio común, sin estirarlos.

## Orquestación automática y estados

- Diez estados: reposo, saludo, conexión, escucha, silencio, pensamiento, trabajo, habla, éxito y error.
- Cada animal tiene cuatro keyframes propios (reposo, escucha, pensamiento y habla); comparte los movimientos de transición, saludo, trabajo, silencio y resultado. El nivel de voz modula el habla.
- Los diseños de Figma no contenían pistas de animación. Los keyframes son una implementación nueva, no animaciones exportadas del archivo.
- Con movimiento reducido se desactivan las animaciones y se conservan poses/indicadores estáticos.
- Peekito perro es el orquestador inicial. El tema cambia automáticamente según la pregunta, no según la ruta; no hay selector manual. El router local prioriza ayuda humana, reconoce vocabulario temático y conserva el contexto en continuaciones breves. Las consultas generales vuelven al perro.
- El cambio visual usa un morph suave de **1.4 s**, con una deformación pequeña, disolución y desenfoque sutil, sin modificar los SVG originales ni interpolar sus paths. Los cambios rápidos reinician el feedback y limpian los temporizadores anteriores. Con movimiento reducido el reemplazo es inmediato, sin progreso ni espera ficticia.
- El panel anuncia «Cambiando al experto…» y muestra el tema de destino con un indicador de progreso decorativo. Al cerrarse el panel, la burbuja flotante mantiene ese feedback sin tapar avisos ni el botón de colgar. No se bloquean mensajes ni respuestas para esperar una animación.
- El círculo, los halos, la ficha temática y los controles usan la paleta del experto: rosa para Peekito; lila para el amarillo de Alma; verde salvia para el ave; crema cálida/café para jurídico; azul suave para trámites; lima/verde para la iguana magenta. El fondo general sigue siendo crema. El color nunca es el único indicador del tema.
- En Realtime el perfil se actualiza mediante un ítem de sistema de una lista blanca antes de solicitar la respuesta. No se reconecta WebRTC ni se interrumpe el micrófono al cambiar de tema. Sólo se conserva el contexto temático vigente.
- En voz, el VAD general detecta/interrumpe el turno pero no genera una respuesta automáticamente: se espera la transcripción, se enruta y se solicita una respuesta única. Una transcripción fallida muestra un aviso y permite repetir o escribir.
- La detección local por vocabulario no es una clasificación semántica universal ni garantiza reconocer cualquier formulación en maya. La traducción y la voz maya siguen siendo experimentales; un tema desconocido no habilita fuentes ni permisos adicionales.
- Son perfiles de orientación con IA, no personas profesionales acreditadas ni autoridades. No sustituyen atención humana ni resoluciones oficiales. El perfil jurídico no ofrece asesoría de casos particulares.

## Salud mental

Ante una pregunta de salud mental, Peekito puede mostrar el avatar de Alma para orientar hacia la ayuda. Eso no abre ni inicia el acompañante privado: no traslada mensajes ni concede consentimiento. El acompañamiento sólo vive en el espacio separado y opcional de salud mental, donde la figura puede ocultarse y la ayuda inmediata sigue disponible. Su conversación no se persiste ni se comparte con el asistente general o el expediente.

## Alcance y fuentes del RAG

El corpus existente contiene 594 pasajes: 27 dependencias, 5 resúmenes de estructura, 387 servicios, 166 datos documentados y 9 guías de la plataforma. No es una conexión en tiempo real con el Ayuntamiento.

- Las instrucciones exigen recuperar evidencia antes de contestar datos municipales y citar la fuente. Una pregunta sin evidencia debe reconocerse como no disponible.
- Los perfiles no añaden fuentes, permisos ni herramientas. No pueden inventar costos, requisitos, folios, límites catastrales, propiedad ni usos de suelo.
- Las preguntas de preferencias personales explícitas, como «¿cuál es tu comida favorita?», se rechazan además antes de recuperar pasajes o redactar en la búsqueda, incluso sin Clef. Las instrucciones de Realtime también las excluyen. Este filtro es específico, no un clasificador universal.
- La redacción de búsqueda rechaza una respuesta completa si contiene una referencia a un pasaje inexistente. Una cita válida por sí sola no demuestra que cada afirmación sea correcta: la generación sigue requiriendo evaluación.
- Fecha de consulta no equivale a fecha de publicación, periodo de referencia ni vigencia. Las copias archivadas y los datos históricos deben identificarse y no presentarse como actuales. No se garantiza actualización automática.
- La fecha de revisión del directorio se declara en `data/sources/dependencias/fuente.json`, no se obtiene de la fecha de modificación del archivo HTML.
- **Base catastral pendiente:** no se incorporó una base de predios ni cartografía nueva. Se requiere una descarga oficial autorizada, condiciones de reutilización verificadas, periodo, procedencia y exclusión de datos personales. Un visor público no implica permiso para extraer su base ni constituye una integración.

Las etiquetas de orientación y los avisos también se incluyen en el catálogo maya, que continúa siendo una traducción automática preliminar.
