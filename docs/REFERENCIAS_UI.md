# Referencias de interfaz — merida-unificada

Qué se miró, qué se observó, qué se decidió y qué falta validar. Fecha de consulta de las fuentes web: **2026-10-17**. Donde algo se **estimó** (por ejemplo colores leídos de capturas comprimidas) se dice; donde no se pudo ver una pantalla, se dice y no se afirma que se reprodujo.

## 1. Decisión de identidad

La persona responsable del proyecto decidió (2026-10-17): **usar la identidad visual del Figma «Laboratorio de Innovación», conservando y respetando los colores base del logotipo del Ayuntamiento de Mérida.** Mérida Móvil (v4.0.2) sigue siendo la referencia de **estructura y nombres** de la experiencia móvil (accesos rápidos, «Mis reportes», folio, estatus), y los portales municipales lo son de contenidos y recorridos de escritorio.

Consecuencias:

- **Marca institucional**: sólo el logotipo oficial (`public/brand/ayuntamiento-merida-*.svg`), con su lema «Contigo es mejor». No se creó otra marca.
- **Color**: paleta viva del Laboratorio para superficies, mosaicos y bandas; marino y lima del logotipo para encabezado, acciones primarias y acentos de marca.
- **Estatus de reportes**: colores de los puntos de estatus de Mérida Móvil (estimados), porque son nombres y semántica familiares para la ciudadanía.
- **«Pekito»** (asistente) y su mascota magenta provienen del Laboratorio y son **provisionales**: no son un personaje oficial del Ayuntamiento y la interfaz lo dice.

## 2. Referencias utilizadas

| Referencia | Qué se tomó | Archivos locales | Estado |
|---|---|---|---|
| Figma «Laboratorio de Innovación» (`inobKMD6ctV5TktIwVTj1z`), tablero `32:162` | Paleta, degradados, tipografías, mosaicos pixelados, patrón de cadena, bandas temáticas de Inicio | `docs/referencias/figma/lab-32-162-*.png`, `tablero-32-162.referencia.tsx.txt`, `public/brand/laboratorio/tablero/` | Leído con el MCP de Figma |
| Figma Laboratorio, frames del agente `22:67`, `22:179`, `22:218`, `22:253` | Bienvenida y chat de Pekito, chips, compositor, mascota | `docs/referencias/figma/lab-22-*.png`, `public/brand/laboratorio/agente/` | Leído |
| Figma Laboratorio, `14:125` | Campos de formulario (etiqueta con asterisco, ícono, borde) | `lab-14-125-escritorio.png` | Leído; es una plantilla «Acme» con acceso con Google que **no** se implementa |
| Figma «Vital Oceans», `3539:642` | Lanzador «Por texto o por voz» (tarjeta flotante, halos, Hablar/Escribir) | `vital-oceans-3539-642-agente.png` | Leído; el código de ese proyecto se usó sólo como referencia de patrones |
| Mérida Móvil v4.0.2 (App Store / Google Play) | Estructura del inicio, accesos rápidos, «Selecciona un servicio», folio, «Mis reportes» y sus estatus, nombres exactos | (capturas oficiales consultadas; no se redistribuyen en el repositorio) | Observado en arte de tienda: **no cubre todas las pantallas** |
| `merida.gob.mx/app` y `/reporta` | Preguntas frecuentes y formulario web de reporte | — | **Bloqueadas por validación anti-bot**; se usaron capturas fechadas de Wayback Machine |
| Portal municipal (`merida.gob.mx/municipio/portal`) | Tokens CSS, logotipos, tipografías, mega menú, botones píldora | `public/brand/` (logotipos) | CSS leído; el portal bloquea tras pocas solicitudes |
| Portal Ciudadano / MIDigital | Estructura de ficha, tarjetas de trámite, colores | `data/sources/portal-ciudadano/` | Accesible |
| Expediente Digital | Pantalla de acceso (sólo descripción) | — | Accesible sin iniciar sesión |
| Visor Urbano y Geoportal | Funciones y límites de acceso | — | **No se renderizaron**; lo descrito viene de HTML/JS públicos y prensa |

Notas de limitaciones completas en `docs/investigacion/2026-10-17/*.json` (campo `limitations`).

## 3. Colores

### 3.1 Logotipo oficial (valores leídos de los SVG del portal)

| Uso | Valor |
|---|---|
| Marino del logotipo | `#1C3174` |
| Lima del logotipo | `#B7ED3B` |
| Meta `theme-color` del portal | `#1C256A` |

La versión en negativo que aparece en el Figma (nodo `13:74`) usa un lima distinto (`#9DEF0F`) y no incluye marino. **Pendiente de validar** con el Ayuntamiento cuál es el lima oficial para fondos oscuros; el prototipo usa los SVG oficiales del portal.

### 3.2 Portal municipal y Portal Ciudadano (tokens CSS observados, exactos)

| Token | Valor | Uso en el portal |
|---|---|---|
| `--cr-1n` | `#002C72` | Barra de navegación, títulos, botones flotantes |
| `--cr-2n` | `#74BA47` | Botones píldora, fondos de sección |
| `--cr-15n` | `#6BAC42` | Barra inferior |
| `--cr-6n` | `#F4F9F0` | Fondo de tarjetas «Investiga» |
| `--cr-29` | `#006CF6` | Botón «Iniciar» del Portal Ciudadano |
| `--cr-28` | `#FA7165` | Separador de la clave del trámite |
| Reporta | `#002C72`, `#79B84E`, `#006AFF`, `#FA7165`, `#F44C7F` | Sitio web de reportes |

### 3.3 Mérida Móvil (estimados desde capturas comprimidas: confianza media)

Texto principal ≈ `#1F3051`; botón primario ≈ `#34477F`; verde de acción ≈ `#94BB4E`; fondo ≈ `#EFF3F4`. **Estatus de reporte** (puntos en «Mis reportes»): Registrado `#B5BFCF` · En proceso de atención `#7489AC` · Solucionado `#91BA49` · Motivo de cancelación `#BE5A54`. Estos cuatro sí se adoptaron como tokens `--color-estado-*`.

### 3.4 Laboratorio de Innovación (valores exactos del Figma)

| Token del prototipo | Valor | Uso |
|---|---|---|
| `--color-crema` / fondo | `#FFF8ED` | Fondo general |
| `--color-azul` | `#005BE8` | Mosaico azul, héroe, banda Salud |
| `--color-ambar` | `#FFB600` | Mosaico y banda ámbar |
| `--color-cafe` | `#533630` | Texto sobre bandas claras, mosaico café |
| `--color-magenta` | `#F62FA2` | Mosaico, Pekito, banda Seguridad |
| `--color-lima` | `#A2D200` | Mosaico y banda lima |
| amarillo-lima | `#EEFF54` | Banda Medio ambiente |
| fin del degradado de Salud | `#0D63E8` | Banda Salud |
| Héroe | `132.81°`, `#FFF8ED` 1.338 % → `#005BE8` 56.086 % | Inicio |
| Tema del asistente | `#101511`, `#343835`, `#5B615D`, `#EBFF57`, `#FFFBE2`, `#BFBFBF` | Chat de Pekito (modo noche) |

La paleta «terrosa» del frame `4:245` (`#4E3934`, `#725622`, `#B197B0`, `#F2EBDB`, `#DDE2C7`, `#726F4E`, `#D1954E`) es sólo una imagen y ningún frame la usa: **no se adoptó**.

### 3.5 Correcciones de contraste respecto al Figma

El Figma no cumple WCAG 2.2 AA en varios lugares; el prototipo los corrige sin cambiar el aspecto general (detalle y cálculos en `docs/referencias/figma/ESPECIFICACION_FIGMA.md` §7):

- Banda **Seguridad**: blanco sobre `#F62FA2` da ≈ 3.6:1 → textos pequeños usan un magenta más oscuro (`--color-magenta-fuerte`).
- Banda **Salud**: el texto claro cae sobre la zona clara del degradado → el texto va sobre azul sólido.
- **Bienvenida de Pekito**: «Saltar» en blanco sobre crema (1.06:1) y «1/5» (1.7:1) → `--color-tinta-suave`; el gris del texto tecleado se oscurece a `#6E6E6E`.
- **Campos de formulario**: borde `#DCE0E8` y placeholder `#9AA3B2` no alcanzan contraste → se usan `--color-borde-control` y `--color-tinta-suave`.
- **Estado nunca sólo por color**: toda insignia lleva ícono y texto.

## 4. Tipografía

| Fuente | Dónde se observó | Decisión |
|---|---|---|
| Poppins (+ Montserrat, Barlow) | Portal municipal; Poppins en Reporta y, aparentemente, Mérida Móvil (inferido) | Sólo como respaldo |
| **Host Grotesk** | Figma Laboratorio: interfaz, cuerpo, línea 1 de titulares | **Fuente de interfaz** |
| **Instrument Serif** (itálica) | Figma: línea 2 / palabra destacada de titulares | Acento de titulares |
| **IBM Plex Mono** Medium (mayúsculas) | Figma: descriptores y pies | Etiquetas tipo «ACCESOS RÁPIDOS» |
| **Unbounded** | Figma: nombre del agente | Sólo la marca de Pekito |
| Onest | Plantilla de formulario `14:125` y lanzador de Vital Oceans | No se usa en el prototipo |

Las fuentes están **autoalojadas** (`@fontsource*`): la app no depende de Google Fonts en tiempo de ejecución.

## 5. Patrones de navegación

| Contexto | Observado en las referencias | En el prototipo |
|---|---|---|
| Móvil | Mérida Móvil: inicio con saludo, tarjeta destacada y cuadrícula «ACCESOS RÁPIDOS» de 3 columnas; pantallas internas con botón regresar cuadrado, título y acción; menú hamburguesa; **sin barra inferior observada** | Barra inferior compacta (Inicio, Servicios, Reportes, Mapa, Más) con hoja «Más»: **diferencia deliberada** para no ocultar secciones y compartir estructura con escritorio |
| Tableta | Mérida Móvil conserva una columna centrada | Navegación lateral compacta |
| Escritorio | Portal: barra azul fija, mega menús, botones píldora verdes, botones flotantes (accesibilidad, atención ciudadana) | Encabezado marino con logotipo y buscador + navegación lateral |
| Búsqueda | Portal: «Lo busco, lo busco… ¡y sí lo encuentro!»; Portal Ciudadano: «¿Qué deseas buscar?» | Buscador en el encabezado y en Inicio; resultados con acciones concretas |
| Nombres | «Bache a la vista», «Reportes rápidos», «Catálogo de reportes», «Mis reportes», «Catálogo Municipal», «Expediente Digital», «Visor Urbano» (exactos en las fuentes) | Se conservan |
| Terminología | La app dice **«Luminaria»**, no «alumbrado» | Se usa «Luminaria» en reportes |
| Folio | Numérico de 7 dígitos; modal «Tu folio de reporte es:» con botón «ACEPTAR» | Folio `DEMO-R-#######` con el mismo modal y aviso |

## 6. Componentes visuales

- **Mosaicos de acceso**: cuadrados de color con glifo pixelado (Laboratorio) y, en variante «acceso rápido», tarjeta clara con ícono de contorno y borde inferior de color (Mérida Móvil).
- **Bandas temáticas** de Inicio: las seis del tablero `32:162` con fotos, titular Host Grotesk + Instrument Serif, pie en IBM Plex Mono.
- **Pekito**: bienvenida de 5 pasos (frame `22:67`), chat con estado vacío y chips (`22:253`), cursor guía tipo Clicky al señalar controles.
- **Iconografía**: `lucide-react` (contorno de trazo uniforme, parecido al estilo observado en Mérida Móvil, que se **infirió** similar a Lucide/Feather).

## 7. Diferencias y pendientes de validar

1. Logotipo en negativo del Figma (lima `#9DEF0F`) frente al oficial del portal (`#B7ED3B` + `#1C3174`).
2. Colores y radios de Mérida Móvil son **estimados**; sólo los tokens CSS del portal y de Reporta son exactos.
3. No se vieron las pantallas de captura de descripción, fotos y video de Mérida Móvil, ni el menú hamburguesa ni la sección «Novedades» completa.
4. Visor Urbano y Geoportal no se renderizaron: la interfaz cartográfica del prototipo es propia y **no** reproduce la oficial.
5. **Fotografías del tablero** (`public/brand/laboratorio/tablero/*.jpg`): muestran personas identificables y provienen del Figma. **Falta confirmar los derechos de uso** antes de publicar el prototipo; hasta entonces no deben salir de un entorno de demostración interno.
6. El nombre **Pekito** (el Figma lo escribe «PEEKITO») y la mascota son provisionales; los nombres previos «ARBO» y «BOXITO» del Figma quedaron obsoletos.
7. La navegación inferior móvil difiere de la app oficial (ver apartado 5).
8. El Figma incluye textos de diseño (líneas de ayuda, «Geoportal Mérida», «Portal Ciudadano») que **no son datos verificados**; el prototipo sólo muestra datos con fuente y fecha.
