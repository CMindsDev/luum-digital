# Especificación de diseño extraída de Figma

> Fuente: archivos Figma **«Laboratorio de Innovación»** (`inobKMD6ctV5TktIwVTj1z`, página `0:1`) y **«Vital Oceans»** (`7H1faIOzkNIWsN8tkcPICL`, nodo `3539:642`). Extraído con el servidor MCP de Figma (`get_design_context`, `get_screenshot`, `get_metadata`, `get_variable_defs`, `get_motion_context`) el **2026-10-17**.
>
> **Estado del archivo:** el archivo del Laboratorio se estaba editando durante la extracción. Entre las 12:50 y las 12:56 se eliminaron los nodos `22:743` («Mérida contigo es mejor»), `22:745` («hola»), `22:751` («Recurso 3 1»), `22:1339` (ícono de Seguridad), `29:1374` (ícono antiguo de Medio ambiente), `29:1401` (ícono de Trámites) y `34:1574` («Recurso 5 1», creado y borrado en esos minutos). Se agregaron `32:162` («Frame 852», el tablero) y `34:1553` (ícono nuevo de Medio ambiente). Esta especificación describe **el estado vigente a las 12:56**. Si el tablero cambia, vuelve a correr `get_design_context` sobre `32:162`.
>
> **Advertencias de contenido (léelas antes de implementar):**
> 1. Los textos del tablero y de las pantallas son **texto de diseño, no datos verificados**. «Línea de la Vida», «Línea Mujer», «911», «Ayuntatel», «Geoportal Mérida», «Visor Urbano», «Portal Ciudadano», los teléfonos y las descripciones de servicios **no se toman de aquí**: en la app salen del catálogo (`fuenteOficial`, fecha, `estadoDeInformacion`). Mientras no estén verificados se muestran como *pendiente de verificar* (AGENTS.md §2.2).
> 2. **«ARBO» y «BOXITO» son nombres provisionales del Laboratorio** para la mascota pixelada. No son personajes oficiales del Ayuntamiento. Las capas también arrastran «Savia» y «pillowtalk», restos de plantillas. En la app el asistente se presenta como simulación o IA y la mascota nunca como «mascota oficial» (§2.9 y §2.11).
> 3. Varias pantallas del agente reutilizan **copy de otro proyecto** (financiamiento, *Grants*, capital semilla, restauración marina en México). Es ajeno al municipio y debe sustituirse.
> 4. El formulario `14:125` es una **plantilla genérica** («Acme workspace», inicio de sesión con Google). La app no tiene autenticación real, así que **no se implementa inicio de sesión con Google** (§1 y §2).
> 5. El frame `4:136` contiene **fotografías de personas reales** (avatares). No se descargaron como asset y no deben usarse. Las fotos del tablero (`public/brand/laboratorio/tablero/foto-*.jpg`) muestran personas identificables. Confirma derechos de uso antes de publicarlas fuera del prototipo.
> 6. Figma **no define variables propias** en el Laboratorio: `get_variable_defs` sólo devuelve estilos del kit de iOS (SF Pro y la barra de estado) o nada (`32:162` → `{}`). Todos los valores de este documento son literales medidos en los nodos.

---

## 1. Inventario de frames

Las capturas están en `docs/referencias/figma/`. Son a 1×, porque Figma no escala por encima del tamaño natural.

| Nodo | Nombre en Figma | Propósito | Captura |
|---|---|---|---|
| `22:67` | «1» (402×874) | Onboarding del agente, paso 1/5: presentación «BOXITO · Un agente que sí te atiende», mascota y campo «yo te escucho». Fondo crema. | `lab-22-67-onboarding-1-boxito.png` (también `lab-22-67-movil.png`) |
| `22:179` | «2» | Onboarding, paso 2/5: pregunta con opciones de selección única y «Siguiente». Fondo oscuro. | `lab-22-179-onboarding-2-oportunidades.png` |
| `22:360` | «3» | Onboarding, paso 3: **vacío**. Sólo una hoja crema girada 90.64°, que parece una transición en curso. | `lab-22-360-onboarding-3-vacio.png` |
| `22:218` | «Intro» | Inicio del chat del agente en reposo: mascota, «HOLA, SOY ARBO», 3 chips de sugerencia y compositor vacío. | `lab-22-218-chat-inicio-reposo.png` |
| `22:253` | «Intro» | Mismo inicio, escribiendo: compositor enfocado (borde lima), texto de 3 líneas y botón Enviar activo. | `lab-22-253-chat-inicio-escribiendo.png` (también `lab-22-253-movil.png`) |
| `12:64` | «Loader Animado» | Respuesta del agente con **tarjeta de servicio** «Bacheo de Calles · Obras Públicas» y botón «Iniciar». Fondo crema. | `lab-12-64-tarjeta-servicio-iniciar.png` |
| `4:136` | «Loader Animado» | Fila de 4 círculos de 66 px sobre azul `#0085FF`: 2 fotos de personas y 2 vacíos. Es un fotograma de un loader. | `lab-4-136-loader-avatares.png` (contiene fotos de personas; no publicar) |
| `12:33` | «Loader Animado» | Pantalla vacía `#000817`. Es el fotograma inicial del loader. | `lab-12-33-loader-oscuro.png` |
| `32:162` | «Frame 852» (1153×7529) | **Tablero de identidad**: hero, mosaicos, banner, tarjetas de foto y 6 bandas temáticas. Ver §3. | `lab-32-162-banda-01…10-*.png` (cortes 1:1); `lab-32-162-tablero.png` (miniatura completa) |
| `4:336` | «Rectangle 4» | Degradado del hero, dentro de `32:162`. | `lab-4-336.png`, `lab-32-162-banda-01-hero.png` |
| `22:1352`–`22:1355`, `22:951`+`22:1279` | Grupos 2918–2921, «Rectangle 10» y «Capa 10» | Mosaicos de íconos (azul, ámbar, café, magenta y lima). | `lab-32-162-banda-02-foto-mosaicos.png`, `../laboratorio-paleta-iconos.png` |
| `22:1356` | «Group 2922» | Banner degradado con patrón pixelado «Capa 8». | `lab-22-1356-banner-degradado.png` |
| `4:338` / `4:339` | «Recurso 1 1» / «Capa 1» | Isotipo de Mérida monocromo crema, dentro del hero. | `lab-4-338-isotipo-merida.png` |
| `4:245` | «image 4» (676×1201) | **Imagen** de una paleta terrosa de referencia con un degradado libre. No la usa ningún frame. | `lab-4-245.png` |
| `14:125` | «MacBook Air - 1» (1280×832) | Formulario de escritorio (plantilla de inicio de sesión). | `lab-14-125-escritorio.png` |
| `13:74` | «logo-merida» (447×447) | Logotipo del Ayuntamiento 2024-2027 en versión negativa (blanco y lima `#9DEF0F`). | `lab-13-74.png` |
| `13:124` | «favicon» (168×204) | Isotipo solo, en lima `#9DEF0F` y blanco. | `lab-13-124-favicon.png` |
| `22:881` | «UN TEJIDO» | Texto suelto (IBM Plex Mono Bold) que parece un lema o rótulo de exploración. | `lab-22-881-un-tejido.png` |
| `22:772` | «Capa 1» | Patrón pixelado «cadena» azul. Es idéntico a `34:1453` (cierre del tablero). | `lab-22-772-patron-cadena.png` |
| `23:153` | «image 9» (563×750) | Foto vertical de una calle del centro con la Catedral, suelta en el lienzo. Sirve como alternativa vertical del hero en móvil (no se descargó). | `lab-23-153-imagen-9.png` |
| `2:2`, `14:240` | «iPhone 17 - 1», «MacBook Air - 2» | Frames vacíos, sin capturas. | — |
| `13:72`, `14:131`, `27:234` | imágenes ocultas | Ocultas en Figma; se ignoran. | — |
| `27:227` | «add_2» (19×19) | Ícono suelto de «agregar». Equivale a `Plus` de lucide. | — |
| **Vital Oceans `3539:642`** | «Zone Selector - 10» | Lanzador del agente «Por texto o por voz» con orbe y halos y tarjetas «Hablar» y «Escribir». | `vital-oceans-3539-642-agente.png` |

---

## 2. Tokens globales encontrados

### 2.1 Tipografías

| Familia | Pesos y estilos usados | Dónde | Detalle exacto |
|---|---|---|---|
| **Host Grotesk** | Regular 400, Bold 700, ExtraBold 800 | Tablero (títulos de sección, línea 1), agente (cuerpo, chips, opciones, compositor), títulos del formulario `14:125` | Títulos de sección: **105.218 px**, `line-height 0.972`, `letter-spacing -5.2609px` (−0.05 em). Variante larga: **87.289 px**, `-4.3644px` (−0.05 em). Agente: pregunta del onboarding ExtraBold 26/33; cuerpo 16/22; chips 14/14; opciones 15.718/15.718; placeholder 15/21; «n/5» y «Saltar» 12 px. Formulario: Bold 40, `tracking -2px` y `lh 0.972`; Regular 30, `-1.5px`; botón 16, `-0.8px`. |
| **Instrument Serif** | *Italic* 400 | Segunda línea de cada título de sección del tablero | **120 px** con `lh 0.972`, o **99.552 px** en títulos largos. El tracking se hereda en px (−5.2609 o −4.3644), es decir ≈ −0.044 em. |
| **IBM Plex Mono** | Medium 500, Bold 700 | Descriptores de sección (Medium); «UN TEJIDO» (Bold) | Descriptor: **16.364 px**, `line-height 1.83`, `letter-spacing 0.8182px` (0.05 em), `text-transform: uppercase`. «UN TEJIDO»: Bold 38.168 px, `lh 140.78%`, `tracking 6.4886px` (0.17 em), mayúsculas, `#F7FFD2`. |
| **Unbounded** | Regular 400, ExtraBold 800 | Nombre del agente: «BOXITO» (Regular 26/33) y «HOLA, SOY ARBO» (ExtraBold 24/30, mayúsculas) | Sólo para el saludo o la marca del asistente. |
| **Hanken Grotesk** | Regular, Black 900 | Sólo en `12:64` (tarjeta de servicio e intro) | Intro 15/23; título Black 16/22; dependencia Regular 16/22; botón «Iniciar» Black 16/22. **Se recomienda unificar a Host Grotesk**, que es visualmente cercana. |
| **Poppins** | Medium 500, Regular, Bold | Formulario `14:125`: etiquetas, casilla, enlaces y pie | Etiqueta Medium **16.181 px** (`lh normal`); textos pequeños Regular **13 px**; «Empieza ahora» Bold subrayado. Es la fuente actual de la app (`--font-sans`). |
| **Onest** | Regular, Medium, Bold | Placeholder de `14:125` (Regular **17.426 px**, `#9AA3B2`); todo el lanzador de Vital Oceans | Lanzador: título Bold 42/42.84 con `tracking -1px`; subtítulo Medium 16/23.2; tarjetas Bold 16 y Medium 12/16.2. |
| SF Pro Text | Semibold 17/22 | Barra de estado del kit de iOS | **No se implementa**: es parte del mockup del teléfono. |

**Conclusión tipográfica:** el sistema del Laboratorio es **Host Grotesk (texto e interfaz) + Instrument Serif Italic (acento editorial) + IBM Plex Mono Medium (rótulos en mayúsculas)**. Unbounded aparece sólo en el nombre del agente. Hanken, Poppins y Onest son restos de plantillas o del otro proyecto. Todas son familias de Google Fonts con licencia OFL. Para autoalojarlas, comprueba la disponibilidad de los paquetes `@fontsource/host-grotesk`, `@fontsource/instrument-serif`, `@fontsource/ibm-plex-mono` y, si se usa, `@fontsource/unbounded` antes de instalar (no se instaló nada).

### 2.2 Paletas de color

**A. Paleta vívida del Laboratorio** (tablero `32:162`, mosaicos, banner y tarjeta de servicio). Es la identidad aplicada.

| Rol | Hex exacto | Dónde | Texto que lleva encima en Figma |
|---|---|---|---|
| Crema base | `#FFF8ED` | Fondo del tablero (`4:330`), inicio de los degradados y glifos claros | café `#533630` |
| Crema del agente | `#FFF8EC` | Fondo de `22:67`, `22:360` y `12:64`; isotipo `4:339` | Difiere 1 unidad: unificar a `#FFF8ED`. |
| Azul | `#005BE8` | Mosaico 1, fin de los degradados, patrón de cierre | crema `#FFF8ED` |
| Azul (fin del degradado de Salud) | `#0D63E8` | Banda Salud | crema |
| Ámbar | `#FFB600` | Mosaico 2, banda Movilidad, tarjeta de servicio | café o negro |
| Café | `#533630` | Mosaico 3, banda Desarrollo Urbano, texto sobre bandas claras, botón «Iniciar» | blanco, crema o `#FFE7BE` |
| Magenta | `#F62FA2` | Mosaico 4, banda Seguridad | blanco |
| Lima | `#A2D200` | Mosaico 5, banda Trámites, fin del degradado de la mascota | café |
| Lima clara | `#EEFF54` | Banda Medio ambiente, inicio del degradado de la mascota | café |
| Crema cálida | `#FFE7BE` | Texto del botón «Iniciar» | — |
| Crema verdosa | `#F7FFD2` | «UN TEJIDO» | — |

> Los valores actuales de `src/design-system/tokens.css` (`#255ADF`, `#F4B940`, `#4F3731`, `#E2449F`, `#AFDF57`, `#FEF8EE`, banner `#F8F4EE → #295EE0`) se tomaron de una captura comprimida (`laboratorio-paleta-iconos.png`). **No coinciden** con Figma. Ver §9.

**B. Paleta del agente** (`22:179`, `22:218` y `22:253` en oscuro; `22:67` en claro).

| Rol | Valor | Uso |
|---|---|---|
| Noche | `#101511` | Fondo de las pantallas oscuras y texto sobre lima |
| Lima del agente | `#EBFF57` | Barra de progreso, opción seleccionada, «Siguiente», Enviar activo, borde del compositor enfocado y cursor |
| Grafito | `#343835` | Botón Enviar en reposo, opción «Otros», borde del compositor en reposo, botón «siguiente» redondo en `22:67` |
| Gris pista | `#5B615D` | Pista de la barra de progreso, placeholder y flecha de Enviar en reposo |
| Gris claro | `#BFBFBF` | Cuerpo sobre oscuro, opciones no seleccionadas, íconos Adjuntar y Dictar, «n/5», cursor sobre crema |
| Gris medio | `#9C9C9C` | Texto de invitación «Hola, puedes hablar…» sobre crema |
| Gris «Otros» | `#9FA19E` | Texto de la opción «Otros» |
| Crema clara | `#FFFBE2` | Títulos sobre oscuro |
| Chip | `rgba(242,255,234,0.14)` | Fondo de los chips de sugerencia (sobre `#101511` ≈ `#30362F`) |
| Compositor | `rgba(217,217,217,0.06)` | Fondo del compositor (≈ `#1C211D`) |
| Mascota | degradado `#EEFF54 → #A2D200` (180°); esclerótica `#E4FF8B`; pupila `#003418` | SVG de la mascota |
| Pixel olas | `#005BE8` | `pixel-olas-azul.svg` |
| Pixel flechas | degradado `#8FE200 → #009D58` | `pixel-flechas-verde.svg` |

**C. Paleta terrosa de referencia** (`4:245`). Es una **imagen**, no estilos de Figma, y no se usa en ningún frame: `#4E3934`, `#725622`, `#B197B0`, `#F2EBDB`, `#DDE2C7`, `#726F4E`, `#D1954E`, más un «custom freeform gradient» (lavanda → rosa → café → verde olivo → naranja). Se registra sólo como exploración.

**D. Formulario `14:125`.** Usa variables importadas, probablemente de una herramienta HTML→Figma: `color/grey/92 #E7EAF0` (borde del botón Google), `color/azure/89 #DCE0E8` (borde de campos), `color/azure/65 2 #9AA3B2` (placeholder), `color/azure/60 #8A93A6` (íconos), `color/azure/56 #2767F5` (asterisco y casilla), `Oxford Blue #3A4256` (texto secundario), `#040114` (etiqueta), blanco y los colores de Google.

**E. Lanzador de Vital Oceans.** Tinta `#13306B`, secundario `#6F94B1`, fondo `linear-gradient(180deg, #FFFFFF, #DBFFFF)`, chip de ícono `#E2F4FF`, orbe `#60B8FF` y halos `rgba(140,206,255,.12)`, `rgba(140,206,255,.20)` y `rgba(110,192,255,.26)`. Puntos de paginación `#D6E0EA` y `#0085FF` (activo).

### 2.3 Degradados

| Nombre | CSS exacto | Nodo |
|---|---|---|
| Hero del tablero | `linear-gradient(132.81deg, #FFF8ED 1.338%, #005BE8 56.086%)` | `4:336` |
| Banner | `linear-gradient(90deg, #FFF8ED, #005BE8)` | `22:1023` |
| Banda Salud | `linear-gradient(180deg, #FFF8ED, #0D63E8)` | `22:1274` |
| Mascota | `linear-gradient(180deg, #EEFF54, #A2D200)` en `userSpaceOnUse` (de arriba abajo de la figura) | `22:175`, `22:207`, `22:249` y `22:266` |
| Pixel flechas | `#8FE200 → #009D58` en diagonal | `22:214` |
| Lanzador de Vital Oceans | `linear-gradient(180deg, #FFFFFF, #DBFFFF)` | `3539:642` |

### 2.4 Radios

| Elemento | Radio | Proporción |
|---|---|---|
| Mosaico de 184.53 px (`22:944` y siguientes) y banner | **32.22 px** | **17.5 %** del lado |
| Foto de banda de 395×427 (`22:1277`, `22:1370`) | **50 px** | 12.7 % del ancho |
| Foto de banda de 370×400 (`29:1387`, `29:1385`, `29:1412`, `32:161`) | **46.838 px** | 12.7 % |
| Tarjeta de foto de 235.8×254.9 (`29:1444`–`29:1450`) | **18.232 px** | 7.7 % |
| Tablero y teléfono (esquinas superiores del hero) | 15 px | — |
| Tarjeta de servicio (`27:67`) | **21 px** | — |
| Botón «Iniciar» (38 px de alto) | 17 px | casi píldora |
| Opciones y «Siguiente» (53.2 y 41 px de alto) | 26.6 px | píldora |
| Chips (40 px) | 20 px | píldora |
| Compositor (56 px) | 28 px | píldora |
| Botones del compositor (44 px) y botón «siguiente» (38 px) | 22 y 19 px | círculo |
| Barra de progreso (7 px) | 3.54 px | píldora |
| Campos y botón del formulario | **11.202 px** | — |
| Casilla del formulario (22.4 px) | 6.224 px | — |
| Tarjetas «Hablar» y «Escribir» de Vital | 16 px | — |

### 2.5 Sombras y bordes

- **Laboratorio: diseño plano.** Las bandas, mosaicos, tarjetas y fotos no tienen sombra. El único «borde» es el anillo interior del compositor: `box-shadow: inset 0 0 0 1px #343835` en reposo e `inset 0 0 0 1px #EBFF57` enfocado.
- Formulario: borde de **1.245 px** `#DCE0E8` en los campos y `#E7EAF0` en el botón.
- Vital Oceans: tarjeta `0 1px 4px rgba(59,59,59,.10)`; orbe `0 14px 30px -12px rgba(0,100,200,.55)`.

### 2.6 Espaciado observado

- **Teléfono (402 px):** márgenes laterales de 20 (pie del compositor), 31–40 (contenido) y 33 (lista de opciones). El compositor tiene padding y gap de 6 px. La fila de chips usa un gap de ≈ 9.4 px entre chips y 10 px entre filas. La lista de opciones usa un gap de 3.02 px.
- **Tablero (1153 px):** margen de contenido de 98 px (8.5 %) en las bandas y 57 px en la fila de tarjetas. El gap de los mosaicos es de ≈ 29.3 px (15.9 % del lado). Las bandas miden 755 px de alto (Movilidad 721).
- **Formulario:** 8.713 px entre etiqueta y campo y 24.894 px entre campos. Padding de campo: 19.916 px vertical y 53.523 px a la izquierda (deja lugar al ícono de 22.4 px colocado a 17.43 px).
- **Vital Oceans:** padding lateral de 38 px en el texto; tarjetas con padding lateral de 26 px y gap de 10 px; 13.35 px entre título y subtítulo.

### 2.7 Movimiento

`get_motion_context` devolvió `{"nodes":[]}` para `4:136`, `12:33` y `12:64`. **No hay keyframes en Figma.** Los frames «Loader Animado» son fotogramas sueltos de un prototipo. El único movimiento concreto está en el código de Vital Oceans (ver §4.3):

- entrada: `280ms cubic-bezier(0.22,1,0.36,1)` con `translateY(18px)` y opacidad;
- halos que «respiran» con `scale(1.04)` en `4.2s ease-in-out infinite`, desfasados −1.4 s y −2.8 s, y con guarda `prefers-reduced-motion`;
- tarjetas al presionar: `scale(.97)` en 160 ms;
- tarjeta flotante con resorte (rigidez 420 y amortiguación 32).

La app ya define `--ease-suave` con la misma curva y `--duracion-lenta: 280ms`.

---

## 3. Tablero de identidad `32:162` («Frame 852»), sección principal

Lienzo de **1153 × 7529 px** con fondo `#FFF8ED` (`4:330`) y radio de 15 px. Asset de referencia del código generado: `docs/referencias/figma/tablero-32-162.referencia.tsx.txt`. Assets en `public/brand/laboratorio/tablero/`, ya descargados por la coordinación, con fotos `.jpg` (los PNG originales están en `docs/referencias/figma/originales/`).

Las coordenadas `y` son absolutas en el tablero; dentro de cada banda se indica `+n` desde su borde superior.

### 3.1 Bandas

| # | Banda | `y` (alto) | Fondo | Contenido y posiciones (escritorio, 1153 px) | Captura |
|---|---|---|---|---|---|
| 01 | **Hero** | 0–624 (624) | `linear-gradient(132.81deg, #FFF8ED 1.338%, #005BE8 56.086%)` con esquinas superiores de 15 px | Isotipo crema `isotipo-merida-blanco.svg` (215×259.64) en x 463 e y 196. Está centrado (+6 px de desvío). | `lab-32-162-banda-01-hero.png` |
| 02 | **Foto con mosaicos** | 624–1393 (769) | Foto `foto-hero-calle.jpg` a 1153×769 con `object-fit: cover`. La foto viene **oscurecida de origen**: el nodo no tiene capa de oscurecimiento. | Rejilla de 4 columnas de 184.53 px con gap de ≈ 29.3 px, de x 144 a 970. **Fila 1** (y 832): azul, ámbar, café y magenta (las dos últimas a y 834.2, desalineadas 2.2 px en Figma; normalizar). **Fila 2** (y 1064): mosaico lima en la columna 1 y **banner en las columnas 2–4** (612.6×184.94, que equivale a 3 mosaicos más 2 gaps). | `lab-32-162-banda-02-foto-mosaicos.png` |
| 03 | **Tarjetas de foto** | 1393–2146 (753) | crema | 4 tarjetas de 235.81×254.91, radio 18.232, en x 57, 324.23, 594.96 y 862.19, y 1633.37 (la cuarta en 1629, desalineada). Gaps de 31.4, 34.9 y 31.4: normalizar a uno. **Las 4 usan la misma foto** (`foto-salud-bienestar.jpg`) con el mismo recorte. Son un marcador de posición. | `lab-32-162-banda-03-tarjetas-foto.png` |
| 04 | **Salud y Bienestar** | 2146–2901 (755) | `linear-gradient(180deg, #FFF8ED, #0D63E8)` | Ícono `icono-seccion-salud.svg` (88.68×89, crema) en x 99, +154. Título en x 91, +275, caja de 439, alineado a la izquierda y color `#FFF8ED`. Descriptor en x 98, +542, ancho 425, 2 líneas, `#FFF8ED`. Foto `foto-salud-bienestar.jpg` 395×427 con radio 50 en x 669, +184. | `lab-32-162-banda-04-salud-bienestar.png` |
| 05 | **Seguridad y Protección** | 2901–3656 (755) | `#F62FA2` | Foto `foto-seguridad-tramites.jpg` 370×400 con radio 46.838 en x 98, +205. Título en x 504, +268, caja de 567, **alineado a la derecha**, blanco. Descriptor alineado a la derecha hasta x 1050, en +540, ancho 490, blanco. **Hoy no tiene ícono**: `22:1339` se borró. Estaba en x 975, +156, en blanco; para la app usa `glifo-seccion-blanco.svg` en esa posición. | `lab-32-162-banda-05-seguridad-proteccion.png` |
| 06 | **Movilidad y Tránsito** | 3656–4377 (721) | `#FFB600` | Ícono `glifo-seccion-cafe.svg` en x 99, +132. Título en x 84, +259, caja de 501, izquierda, `#533630`. Descriptor en x 98, +520, `#533630`. Foto `foto-movilidad-transito.jpg` 395×427 con radio 50 en x 669, +162. | `lab-32-162-banda-06-movilidad-transito.png` |
| 07 | **Medio ambiente y sostenibilidad** | 4377–5132 (755) | `#EEFF54` | Ícono `icono-seccion-medio-ambiente.svg` (89×121.43, café, un brote o árbol pixelado; nodo `34:1553`) en x 98, +146. Título largo en x 96, +315, caja de 625, izquierda, `#533630`. Descriptor en x 97, +548. Foto `foto-medio-ambiente.jpg` 370×400 con radio 46.838 en x 714, +188. | `lab-32-162-banda-07-medio-ambiente.png` |
| 08 | **Trámites y Atención** | 5132–5887 (755) | `#A2D200` | Foto `foto-seguridad-tramites.jpg` (**la misma que Seguridad**: falta una foto propia) 370×400 con radio 46.838 en x 98, +205. Título en x 504, +268, alineado a la derecha, `#533630`. Descriptor alineado a la derecha hasta x 1050, +540, `#533630`. **Sin ícono**: `29:1401` se borró. Estaba en x 975, +156; usa `glifo-seccion-cafe.svg`. | `lab-32-162-banda-08-tramites-atencion.png` |
| 09 | **Desarrollo Urbano y territorio** | 5887–6642 (755) | `#533630` | Ícono `glifo-seccion-blanco.svg` **centrado** en x 533, +154. Título largo centrado (caja de 667 en x 252), +292, blanco. Descriptor en x 161, +537, ancho 850, 1 línea, blanco. Foto `foto-desarrollo-urbano.jpg` 370×400 con radio 46.838, centrada (x 392), en +627: **desborda 272 px hacia la banda de cierre a propósito**. | `lab-32-162-banda-09-desarrollo-urbano.png` |
| 10 | **Cierre** | 6642–7529 (887) | crema | Remate de la foto anterior (hasta y 6914). Patrón «cadena» `patron-cadena-cierre.svg` en `#005BE8`, centrado (x ≈ 432–721, y 7048–7146). El SVG es vertical (97.6×290.5) y **se dibuja girado 90°**. | `lab-32-162-banda-10-cierre.png` |

### 3.2 Encabezado de sección temática (patrón repetido en las bandas 04–09)

```
[ícono 88.7×89]                ← separado ≈ 121 px del inicio del título
Línea 1  Host Grotesk Regular   105.218px / lh 0.972 / tracking -0.05em
Línea 2  Instrument Serif Italic 120px    / lh 0.972 / tracking -5.2609px (≈ -0.044em)
         ↓ ≈ 40–45 px
DESCRIPTOR  IBM Plex Mono Medium 16.364px / lh 1.83 / tracking 0.05em / MAYÚSCULAS / ancho máx. 425–490 px (2 líneas)
```

- Títulos largos («Medio ambiente», «Desarrollo Urbano»): 87.289 px (sans) y 99.552 px (serif), con `tracking -0.05em` respecto de 87.289.
- Los títulos tienen 2 líneas forzadas: la sans termina en «y» y la serif lleva el sustantivo. Algunos textos tienen espacios finales («Salud y », «Atención »), que deben recortarse.
- Alineación alternada en escritorio: izquierda (Salud, Movilidad, Medio ambiente), derecha (Seguridad, Trámites) y centrada (Desarrollo Urbano). La foto va en el lado opuesto al texto.
- Color del texto: `#FFF8ED` o blanco sobre fondos oscuros (Salud abajo, Seguridad y Desarrollo); `#533630` sobre claros (Movilidad, Medio ambiente y Trámites).

### 3.3 Recortes de imagen (exactos)

| Imagen | Nodos | Recorte |
|---|---|---|
| `foto-salud-bienestar.jpg` | `22:1277` y las tarjetas `29:1444`–`29:1450` | **Recorte manual** dentro de un contenedor con `overflow:hidden` y el radio: `width:114.03%; height:158.23%; left:-13.92%; top:-19.83%`. En CSS equivale a `object-fit: cover` con `object-position: ≈ 50% 34%` (centrado horizontal y un tercio superior). |
| `foto-hero-calle.jpg` | `14:205` | `object-fit: cover`, centrada |
| `foto-movilidad-transito.jpg` | `22:1370` | `object-fit: cover` con radio 50 |
| `foto-seguridad-tramites.jpg` | `29:1387` y `29:1412` | `object-fit: cover` con radio 46.838 |
| `foto-medio-ambiente.jpg` | `29:1385` | `object-fit: cover` con radio 46.838 |
| `foto-desarrollo-urbano.jpg` | `32:161` | `object-fit: cover` con radio 46.838 |

### 3.4 Mosaicos y banner

- **Mosaico:** cuadrado de 184.53 px con radio 32.22 px (17.5 %). El glifo pixelado mide 121.73×122.17 (≈ 66 %) y va centrado. Combinaciones fijas de fondo y glifo:
  - azul `#005BE8` con glifo crema `#FFF8ED`: `glifo-mosaico-azul.svg`
  - ámbar `#FFB600` con café: `glifo-mosaico-ambar-b.svg`. Es el glifo del grupo; `glifo-mosaico-ambar-a.svg` es un duplicado superpuesto (`22:973`).
  - café `#533630` con crema: `glifo-mosaico-cafe.svg`
  - magenta `#F62FA2` con crema: `glifo-mosaico-magenta.svg`
  - lima `#A2D200` con café: `glifo-mosaico-lima.svg`

  Los 5 glifos son **la misma figura** (un sol o asterisco pixelado de trazo irregular, como bordado) con trazos ligeramente distintos.
- **Banner:** 612.6×184.94 con radio 32.22 y `linear-gradient(90deg, #FFF8ED, #005BE8)`. Lleva el patrón `patron-cadena-banner.svg` (crema, SVG vertical de 86.8×258.3 que **se gira 90°**) centrado, ocupando ≈ 42 % del ancho y ≈ 47 % del alto. Es decorativo: `aria-hidden`.

### 3.5 Adaptación de 1153 px a 390 px (y tableta)

Usa unidades fluidas derivadas del lienzo: `valor / 1153 × 100vw`, con mínimos legibles.

| Elemento | Escritorio (1153) | Tableta (768) | Móvil (390, con 16 px de margen y 358 de contenido) |
|---|---|---|---|
| Margen de contenido | 98 px | 48 px | 16 px (margen del AppShell) |
| Alto de banda | 721–755 px | contenido + 96 px | contenido + 48–64 px. Sin alto fijo. |
| Título, línea sans | 105.218 px | ≈ 70 px | `clamp(2.25rem, 9.13vw, 6.576rem)` → 36 px |
| Título, línea serif | 120 px | ≈ 80 px | `clamp(2.6rem, 10.41vw, 7.5rem)` → ≈ 41 px |
| Títulos largos (×0.83) | 87.3 / 99.6 | ≈ 58 / 66 | `clamp(2rem, 7.57vw, 5.456rem)` y `clamp(2.25rem, 8.63vw, 6.222rem)` |
| Descriptor | 16.364 px | 15 px | **14 px mínimo**: `clamp(0.875rem, 1.42vw, 1.0227rem)`. Conserva la mayúscula y el `tracking 0.05em`. |
| Ícono de sección | 88.7 px | 72 px | 56 px |
| Disposición texto y foto | 2 columnas alternadas (texto ≈ 440, foto 370–395) | 2 columnas de 1 fr | **1 columna**: ícono → título → descriptor → foto a todo el ancho. **Todo alineado a la izquierda**, incluidas Seguridad y Trámites: el texto alineado a la derecha se lee mal en pantallas angostas. Desarrollo Urbano puede seguir centrado. |
| Foto de banda | 395×427 con radio 50 | 50 % del ancho con radio 40 | 100 % del ancho, `aspect-ratio: 370/400`, radio 32 (`2rem`) |
| Hero | 624 px, isotipo de 215 | 480 px, isotipo de 160 | `min-height: 320px`, isotipo de 120 px. El degradado se mantiene a 132.81°. |
| Foto con mosaicos | rejilla de 4 columnas de 184.5, gap 29.3, sobre la foto | 4 columnas de ≈ 140 | **4 columnas de ≈ 80 px** (`(358 − 3×12)/4`) con gap de 12 px y radio 17.5 % (≈ 14 px). Glifo al 66 %. Fila 2: lima más el banner en 3 columnas (≈ 266×80). La foto queda como fondo con `object-fit: cover` y la rejilla encima, con 24 px de padding. Alternativa vertical: `23:153`. |
| Tarjetas de foto | 4 en fila de 235.8×254.9 | 4 en fila de ≈ 160 | 2×2 (≈ 171 px de ancho, `aspect-ratio: 235.8/254.9`, radio 18 px), o carrusel con `scroll-snap` si hay más de 4 |
| Desborde de la foto de Desarrollo | foto que sobresale 272 px hacia el cierre | igual, proporcional | sin desborde (foto dentro de la banda); el cierre conserva el patrón |
| Patrón de cierre | 290×98 | 240 px | 180 px de ancho, centrado |

---

## 4. Especificaciones de componentes

### 4.1 Onboarding del agente (pasos con barra de progreso y «Saltar»): `22:67`, `22:179` y `22:360`

**Estructura común** (teléfono de 402×874; la barra de estado de iOS se ignora):

- **Cabecera de progreso** a y = 100 px:
  - pista desde x 40 hasta 116 px del borde derecho (246 px), 7 px de alto, radio 3.54, `#5B615D`;
  - relleno `#EBFF57` con el mismo radio. En Figma mide 20 % en 1/5 y 34.15 % en 2/5. Usa la proporción real (2/5 = 40 %).
  - contador «1/5»: Host Grotesk 12 px, `#BFBFBF`, a la derecha de la pista;
  - «Saltar»: Host Grotesk 12 px, blanco, a 33 px del borde derecho. En `22:179` aparece en minúscula («saltar»); unificar a «Saltar».
- **Paso 1 (`22:67`, fondo crema `#FFF8EC`):**
  - título centrado de 340 px de ancho, con centro en y 190: «BOXITO» en **Unbounded Regular 26/33** y debajo «Un agente que sí te atiende» en **Host Grotesk Regular 26/33**, ambos `#101511`;
  - mascota de 181.6 px centrada en y 278 (`mascota-pixel-escuchando.svg`);
  - invitación «Hola, puedes hablar, yo te escucho...» en Host Grotesk 28/31.316, `#9C9C9C`, centrada en y 514, precedida por un cursor vertical de 1.84×35 en `#BFBFBF`;
  - botón «siguiente»: círculo de 38 px en `#343835` con flecha clara (ícono girado 45°, es decir hacia la derecha), centrado en y 632.
- **Paso 2 (`22:179`, fondo `#101511`):**
  - pregunta centrada «¿Qué tipo de oportunidades te interesa encontrar?» en **Host Grotesk ExtraBold 26/33**, `#FFFBE2`;
  - fila decorativa en y 277: `pixel-olas-azul.svg` (68×52), mascota de 132 px (`mascota-pixel-mirando-lado.svg`) y `pixel-flechas-verde.svg` (63.5×63.4, **reflejado en vertical**: rotación de 180° y `scaleX(-1)`);
  - lista de opciones (radio) desde y 455, ancho 335 (x 32–367) y gap de 3.02. Cada opción mide 53.2 px de alto con radio 26.6 y texto centrado en Host Grotesk 15.718. Estados:
    - **seleccionada:** fondo `#EBFF57`, texto `#101511` y check de 20.5×19.3 (trazo `#101511` de 1.93 px) a 33 px de la derecha;
    - **no seleccionada:** fondo `#BFBFBF`, texto `#101511`;
    - **secundaria («Otros»):** fondo `#343835`, texto `#9FA19E`;
  - botón «Siguiente»: 335×41, radio 26.6, `#EBFF57`, texto `#101511` de 15.718, en y 765.
- **Paso 3 (`22:360`):** vacío, sin especificación.

**Accesibilidad e implementación:**

- La barra es un `role="progressbar"` con `aria-valuenow` y el texto «Paso 1 de 5».
- «Saltar» es un botón de **al menos 44×44** (en Figma es un texto de 12 px).
- Las opciones son `<input type="radio">` estilizados dentro de un `<fieldset>` con `<legend>` (la pregunta).
- El check es ícono más estado: no se comunica sólo con color.
- **Contraste a corregir sobre crema:** «Saltar» blanco sobre `#FFF8EC` da **1.06:1**, «1/5» `#BFBFBF` da 1.74:1, la invitación `#9C9C9C` da 2.60:1 y el relleno lima de la barra sobre crema da 1.05:1. En claro, usa `#101511` o `#5B615D` (6.00:1) para los textos, y café o azul para el relleno de la barra.

### 4.2 Inicio del chat del agente (chips y compositor): `22:218` (reposo) y `22:253` (escribiendo)

- **Fondo** `#101511`.
- **Mascota** `mascota-pixel-saludando.svg` de 216×215.6, centrada en y 148. Sube a y 129 cuando el compositor crece.
- **Bloque de saludo** centrado, con gap de 15:
  - título «HOLA, SOY ARBO» en **Unbounded ExtraBold 24/30**, mayúsculas, `#FFFBE2`. En la capa está escrito «Hola, soy arbo» y se transforma con CSS.
  - párrafo en Host Grotesk Regular 16/22, `#BFBFBF`, `max-width 320`, padding lateral de 18 y centrado.
- **Chips de sugerencia** (contenedor de 362 px, centrados y con salto de línea): 40 px de alto, padding lateral de 18, radio 20, fondo `rgba(242,255,234,0.14)` (≈ `#30362F`). Texto Host Grotesk 14/14 blanco (12.39:1). Gap de ≈ 9.4 horizontal y 10 vertical. Son `<button>` que **prellenan** el compositor; no envían solos (el asistente prepara y la persona confirma, §2.11).
- **Compositor** (pie con padding de 20 lateral, 10 arriba y 8 abajo):
  - píldora de `min-height 56`, padding y gap de 6, radio 28, fondo `rgba(217,217,217,0.06)` y anillo `inset 0 0 0 1px #343835`;
  - **enfocado:** el anillo pasa a `#EBFF57`, la altura crece a 70 y el texto ocupa varias líneas (crece hasta unas 4 líneas y luego desplaza);
  - botones circulares de **44 px**:
    - **Adjuntar:** «+» de 20 px, trazo `#BFBFBF`; lucide `Plus`;
    - **Dictar:** micrófono `#BFBFBF`; lucide `Mic`;
    - **Enviar:** fondo `#343835` con flecha hacia arriba `#5B615D` en reposo y deshabilitado; fondo `#EBFF57` con flecha `#101511` cuando hay texto (lucide `ArrowUp`);
  - campo `flex:1`. Placeholder «Escribe un mensaje…» en Host Grotesk 15/21, `#5B615D`. En el estado de escritura el texto se ve en 11.676/16.346 blanco con cursor `#EBFF57` de 2×12. **No copies los 11.7 px**: usa 15–16 px (mínimo 16 en iOS para evitar el zoom).
- **Contraste a corregir:** el placeholder `#5B615D` sobre el compositor (≈ `#1C211D`) da **2.58:1**; usa `#9FA19E` o `#BFBFBF`. El anillo en reposo `#343835` da 1.37:1 (WCAG 1.4.11 pide 3:1): usa `#5B615D` como mínimo, o confía en el contraste del contenedor.
- Cada botón lleva su `aria-label` («Adjuntar», «Dictar», «Enviar»).

### 4.3 Lanzador «Por texto o por voz» (Vital Oceans `3539:642`, comparado con el código existente)

**Figma:**

- Fondo `linear-gradient(180deg, #FFFFFF, #DBFFFF)`.
- Bloque de texto con padding lateral de 38 y superior de 92 (desde y 62), gap de 13.35:
  - **título** «Por texto / o por voz.» en Onest Bold **42/42.84** con `tracking -1px`, `#13306B`;
  - **subtítulo** «Habla de forma natural / o escribe cuando prefieras.» en Onest Medium 16/23.2, `#13306B`.
- **Orbe** centrado (contenedor de y 300 a 252 px del borde inferior), con halos concéntricos:
  - 280 px en `rgba(140,206,255,.12)`;
  - 220 px en `rgba(140,206,255,.20)`;
  - 162 px en `rgba(110,192,255,.26)`;
  - núcleo de 108 px en `#60B8FF` con sombra `0 14px 30px -12px rgba(0,100,200,.55)`.
- **Tarjetas** «Hablar» y «Escribir» en y 622, con padding lateral de 26 y gap de 10. Cada una:
  - `flex:1`, 164 px de alto, radio 16, fondo blanco y sombra `0 1px 4px rgba(59,59,59,.1)`;
  - contenido centrado con gap de 6 y padding lateral de 12;
  - chip de ícono de 52 px en `#E2F4FF` con ícono de 24 px (micrófono o teclado) y 8 px de margen inferior;
  - título en Onest Bold 16, `#13306B`;
  - subtítulo en Onest Medium 12/16.2, `#6F94B1` («Como conversas / normalmente» y «Cuando / lo prefieras»).
- **Paginación:** 4 puntos de 10 px con radio 5 y gap de 12; activo `#0085FF` e inactivos `#D6E0EA`. Padding de 34 arriba y 44 abajo.

**Código existente** (`Vital-Oceans/.../src/ui/alex/Marea.tsx` y `Marea.css`, de sólo lectura). Coincide con Figma en colores, tamaños, halos, tarjetas y tipografía. Las diferencias son intencionales y reutilizables:

1. Se abre como `<dialog>` modal a pantalla completa en el teléfono y como tarjeta centrada de `min(480px, 100vw−48px) × min(860px, 100dvh−48px)` con radio 24 y sombra `0 24px 64px rgb(19 48 107/24%)` desde 800 px.
2. Tiene un modo compacto de «tarjeta flotante» no modal junto al orbe, que deja la página usable.
3. Agrega una cabecera con botón de regreso, por eso el texto empieza con 24 px de padding superior y no con 92.
4. **Omite** los puntos de paginación: el lanzador no es un carrusel.
5. Los halos respiran (4.2 s infinito) y hay guarda `prefers-reduced-motion` en `Marea.css:867`.
6. El foco usa `outline: 3px solid #1568B7` con `offset 2px`.
7. Las tarjetas son `<button>`; «Hablar» se deshabilita con `aria-busy` mientras conecta.

**Contraste:** el subtítulo `#6F94B1` sobre blanco da **3.21:1** y no cumple AA en 12 px. Usa un tono de al menos 4.5:1 (en la app, `tinta-suave` `#505A78`).

### 4.4 Mascota pixelada (estados)

Es un rombo pixelado de 13 escalones con degradado `#EEFF54 → #A2D200` y un «ojo»: una esclerótica redondeada `#E4FF8B` y una pupila `#003418`. Tres estados en Figma, que se distinguen por la posición de la pupila:

| Estado | Archivo | Tamaño en Figma | Pupila | Uso sugerido |
|---|---|---|---|---|
| **Escuchando** (mira abajo) | `agente/mascota-pixel-escuchando.svg` | 181.6×181.3 | centrada en horizontal y abajo | Onboarding y dictado activo |
| **Mirando de lado** (pensando) | `agente/mascota-pixel-mirando-lado.svg` | 132.2×132 | a la derecha y centrada en vertical | Preguntas y «pensando…» |
| **Saludando** (atento, mira arriba) | `agente/mascota-pixel-saludando.svg` | 216×215.6 | arriba y un poco a la derecha | Inicio del chat y estado en reposo |

**Reglas:**

- Decorativa (`aria-hidden`); el estado se comunica también con texto («Escuchando…», «Pensando…»).
- Sin animaciones infinitas con movimiento reducido.
- **No es mascota oficial.**
- **No se usa en Salud mental:** ahí el acompañante es opcional, sin recompensas ni rachas, y no se presenta como mascota (§2.9).
- La pupila puede animarse como cambio de posición (de un estado a otro) con `motion/react` y `MotionConfig reducedMotion="user"`.
- Los 3 SVG traen `width` y `height` fijos: respeta la proporción y escala con un contenedor.

### 4.5 Tarjeta de servicio con «Iniciar» (`12:64`)

- **Contexto:** debajo de un párrafo de respuesta del agente en Hanken Grotesk 15/23, negro, ancho 296 en x 36.
- **Tarjeta:** 324×152 en x 31 e y 255, radio **21**, fondo **ámbar `#FFB600`**.
  - **Glifo:** 43.84×44 en café `#533630` (`agente/glifo-tarjeta-servicio-cafe.svg`), a 26 px del borde izquierdo y del superior de la tarjeta.
  - **Título:** a 87 px del borde izquierdo de la tarjeta y alineado con el glifo. «Bacheo de Calles» en Black 16/22 negro y «Obras Públicas» (dependencia) en Regular 16/22 negro.
  - **Botón «Iniciar»:** 228×38 a 30 px del borde izquierdo y 89 px del superior de la tarjeta, radio 17, fondo café `#533630`, texto «Iniciar» en Black 16/22 `#FFE7BE` (8.99:1) y centrado.
  - **Círculo vacío** de 35 px con contorno negro de 1 px a la derecha del botón. Su función no está definida (¿favorito o selección?). No lo implementes sin un propósito; si es «guardar», que sea un botón con ícono y `aria-label`.
- **En la app:**
  - aplícalo a `ServiceCard` con la dependencia como subtítulo y «Iniciar» como CTA que abre `/servicios/:id`;
  - sube el botón a ≥ 44 px de alto;
  - el color de la tarjeta puede seguir el de la categoría del mosaico (ámbar para Obras y Servicios Públicos, etc.);
  - el texto «Ayuntatel…» es **copy de diseño, no un dato**.

### 4.6 Mosaicos de íconos (`22:1352`–`22:1355` y `22:951`+`22:1279`)

Ver §3.4. **En la app** son los íconos de categoría del catálogo y de los accesos rápidos de inicio:

- cuadrado con radio del 17.5 %;
- glifo al 66 % centrado y `aria-hidden`;
- etiqueta de texto siempre debajo o al lado (nunca sólo el mosaico).

Tamaños sugeridos: 56 px (lista), 80 px (rejilla móvil) y 120–184 px (inicio en escritorio).

### 4.7 Banner (`22:1356`)

612.6×184.94 con radio 32.22, `linear-gradient(90deg, #FFF8ED, #005BE8)` y el patrón crema `patron-cadena-banner.svg` girado 90° y centrado. **Uso:** cabecera decorativa de la sección de inicio o de una campaña. Si lleva texto, ponlo sobre la mitad azul (crema sobre `#005BE8` da 5.44:1) y nunca sobre la mitad clara con texto claro.

### 4.8 Encabezados de sección temática

Ver §3.2 y §3.5. Propuesta de componente: `EncabezadoTematico` con:

- props `icono`, `lineaSans`, `lineaSerif`, `descriptor`, `foto`, `alineacion` y `tono` (`claro` u `oscuro`);
- `<h2>` con las dos líneas en `<span>` (la serif en `<em>` o una clase);
- el descriptor como `<p>` (no `<h3>`).

### 4.9 Campos de formulario (de `14:125`, adaptados)

| Parte | Figma | Recomendación para la app |
|---|---|---|
| Título y subtítulo | Host Grotesk Bold 40 con `tracking -2px`; Regular 30 con `-1.5px`; `lh 0.972` | Usa la escala de la app: `<h1>` en Host Grotesk Bold con `tracking -0.05em` |
| Etiqueta | Poppins Medium 16.181, `#040114`; asterisco `#2767F5` | Host Grotesk Medium 16 en `tinta`. Asterisco azul con texto oculto «(obligatorio)». |
| Campo | 62.235 de alto, borde 1.245 `#DCE0E8`, radio 11.202, padding 19.9 vertical, 53.5 izquierdo y 18.7 derecho (56 con botón), ícono de 22.4 a 17.4 px | Alto de 52–56 px, radio 12 (`--radius-control`). **Borde `--color-borde-control` (#767E96)**: `#DCE0E8` sólo da 1.32:1. Mantén el ícono a la izquierda. |
| Placeholder | Onest 17.426, `#9AA3B2` | Host Grotesk 16 en `tinta-suave`: `#9AA3B2` da **2.54:1**. El placeholder nunca reemplaza a la etiqueta. |
| Botón «mostrar contraseña» | 33.6 px con ícono de 23.6 | 44 px con `aria-pressed` (no aplica: la app no pide contraseñas reales) |
| Casilla | 22.4 px, radio 6.224, `#2767F5`, check de 14.9 | Área de toque de 44 px, color `azul` |
| Enlaces y textos pequeños | Poppins 13 px `#3A4256`, subrayados | 14 px mínimo, en `azul` o `tinta` subrayado |
| Botón secundario (Google) | 59.7 px de alto, borde `#E7EAF0`, radio 11.2, texto 16 | **No implementar Google.** El estilo sirve para un botón secundario con borde. |

Separación: 8.7 px entre etiqueta y campo y ≈ 25 px entre campos. Encaja con React Hook Form + Zod (§5 de AGENTS.md).

### 4.10 Loader («Loader Animado»: `12:33`, `4:136` y `12:64`)

No hay datos de animación. Por los fotogramas se infiere un recorrido de pantalla oscura `#000817` → fila de 4 círculos de 66 px sobre azul `#0085FF` (gap de ≈ 13–15) que **aparecen uno a uno** (avatares de quien «atiende») → respuesta con tarjeta de servicio sobre crema.

**Propuesta:**

- loader de **4 puntos o mosaicos** con los colores azul, ámbar, café y magenta (16–24 px, radio 17.5 %);
- aparecen en secuencia: opacidad y escala de .8 a 1, 120 ms cada uno con `--ease-suave`;
- texto visible «Buscando…» y `role="status"`;
- con movimiento reducido: estático con el texto.

**No uses fotos de personas.** Para «conectando con la dependencia» basta con el glifo o el mosaico de la categoría.

---

## 5. Textos exactos (copy) tal como están en Figma

> Son textos de **diseño**. Los nombres de servicios, líneas o programas no se tomaron de una fuente oficial y deben contrastarse con el catálogo antes de mostrarse como información.

- **`22:67`:** «1/5» · «Saltar» · «BOXITO» · «Un agente que sí te atiende» · «Hola, puedes hablar,» / «yo te escucho...» (tres puntos, no el carácter «…»). Nombre de la capa del título: «¿cómo quierés que pillowtalk te llame?», que es un resto.
- **`22:179`:** «2/5» · «saltar» · «¿Qué tipo de oportunidades» / «te interesa encontrar?» · «Grants» · «Inversión» · « Capital semilla» (con espacio inicial) · «Aceleración con financiamiento» · «Otros» · «Siguiente».
- **`22:218` y `22:253`:** «Hola, soy arbo» (se muestra «HOLA, SOY ARBO»; la capa se llama «Hola, soy Savia») · «Encuentro oportunidades, aliados y» / «recursos que pueden ayudarte a hacer» / «crecer tu proyecto.» · chips «Buscar financiamiento», «Encontrar aliados» y «Convocatorias abiertas» · placeholder «Escribe un mensaje…» · botones «Adjuntar», «Dictar» y «Enviar» (nombres de capa) · texto escrito: «Hola Arbo, estoy buscando financiamiento para un proyecto de restauración marina en México.»
- **`12:64`:** «Tiene una línea general y varios teléfonos especializados. Ayuntatel funciona como puerta de entrada para orientación y reportes; las dependencias también publican sus propios contactos.» · «Bacheo de Calles» · «Obras Públicas» · «Iniciar».
- **Tablero `32:162`:**
  - «Salud y » / «Bienestar»: «Línea de la Vida, atención psicológica y prevención del suicidio.»
  - «Seguridad y » / «Protección»: «Línea Mujer, 911, atención a emergencias y prevención de la violencia.»
  - «Movilidad y» / «Tránsito»: «tránsito y movilidad urbana»
  - «Medio ambiente» / «y sostenibilidad»: «arbolado urbano y cuidado ambiental.»
  - «Trámites y » / «Atención »: «Portal Ciudadano, pagos, consultas, trámites y seguimiento de solicitudes.»
  - «Desarrollo Urbano» / «y territorio»: «Geoportal Mérida, Visor Urbano, información catastral y consultas territoriales.»

  Los descriptores se muestran en MAYÚSCULAS por CSS.
- **Sueltos:** «UN TEJIDO» (`22:881`). Eliminados durante la extracción: «Mérida contigo es mejor» (`22:743`) y «hola» (`22:745`).
- **`14:125`:** «Welcome back» · «Sign in to your Acme workspace.» · «Continuar con tu cuenta de Google» · «O» · «Correo electrónico *» · «nombre@correo.com» · «Contraseña *» · «********» · «Conservar mi sesión» · «¿Olvidaste tu contraseña?» · «¿Aún no tienes una cuenta? Empieza ahora» · capa «Button - Mostrar contraseña».
- **Vital Oceans `3539:642`:** «Por texto» / «o por voz.» · «Habla de forma natural» / «o escribe cuando prefieras.» · «Hablar» / «Como conversas» / «normalmente» · «Escribir» / «Cuando» / «lo prefieras».

---

## 6. Assets

### 6.1 Tablero (descargados por la coordinación; no se volvieron a descargar)

`public/brand/laboratorio/tablero/`:

- **Fotos:**
  - `foto-hero-calle.jpg` (`14:205`)
  - `foto-salud-bienestar.jpg` (`22:1277` y `29:1444`–`29:1450`)
  - `foto-seguridad-tramites.jpg` (`29:1387` y `29:1412`)
  - `foto-movilidad-transito.jpg` (`22:1370`)
  - `foto-medio-ambiente.jpg` (`29:1385`)
  - `foto-desarrollo-urbano.jpg` (`32:161`)

  Los PNG originales están en `docs/referencias/figma/originales/`.
- **Isotipo:** `isotipo-merida-blanco.svg` (`4:339`, en `#FFF8EC`).
- **Glifos de mosaico:** `glifo-mosaico-azul.svg` (`22:953`), `glifo-mosaico-ambar-a.svg` (`22:973`), `glifo-mosaico-ambar-b.svg` (`22:983`), `glifo-mosaico-cafe.svg` (`22:993`), `glifo-mosaico-magenta.svg` (`22:1003`) y `glifo-mosaico-lima.svg` (`22:1013` y `22:1279`).
- **Patrones:** `patron-cadena-banner.svg` (`22:1026`, crema) y `patron-cadena-cierre.svg` (`34:1453`, azul `#005BE8`). Ambos se giran 90°.
- **Íconos de sección:**
  - `icono-seccion-salud.svg` (`22:1323`, crema)
  - `glifo-seccion-blanco.svg` (`29:1431`, blanco)
  - `glifo-seccion-cafe.svg` (`22:1359`, café)
  - **`icono-seccion-medio-ambiente.svg`** (`34:1553`, café, 89×121.43): **agregado en esta extracción** porque faltaba en la lista.

Verificación: mis descargas de control de los glifos azul, ámbar-b, café, magenta y lima, del patrón del banner y de `22:772` frente al patrón de cierre son **idénticas byte a byte** (salvo los `id`) a los archivos de la coordinación.

### 6.2 Agente (nuevos, `public/brand/laboratorio/agente/`)

Todos son SVG no vacíos, validados con `file` y con `width` y `height` en la raíz.

| Archivo | Nodo | Tamaño | Colores |
|---|---|---|---|
| `mascota-pixel-escuchando.svg` | `22:175` | 181.621×181.321 | `#EEFF54`→`#A2D200`, `#E4FF8B`, `#003418` |
| `mascota-pixel-mirando-lado.svg` | `22:207` | 132.218×132 | igual |
| `mascota-pixel-saludando.svg` | `22:249` (= `22:266`, idénticos) | 215.974×215.618 | igual |
| `pixel-olas-azul.svg` | `22:211` | 68.204×52.054 | `#005BE8` |
| `pixel-flechas-verde.svg` | `22:214` | 63.473×63.44 | `#8FE200`→`#009D58` (se muestra reflejado en vertical) |
| `glifo-tarjeta-servicio-cafe.svg` | `27:203` | 43.841×44 | `#533630` |

**No descargados a propósito:**

- íconos genéricos de interfaz (+, micrófono, enviar, check, flecha y los de iOS): AGENTS.md pide `lucide-react`. Equivalencias: `Plus`, `Mic`, `ArrowUp`, `Check`, `ArrowRight`, `Mail`, `Lock`, `Eye`;
- el círculo vacío de `12:64`, que se hace con CSS;
- las fotos de personas de `4:136`;
- la foto suelta `23:153`, que se puede pedir si se quiere el hero vertical.

### 6.3 Logotipo: comparación con `public/brand/`

- `public/brand/ayuntamiento-merida-{horizontal,vertical}.svg` usan **marino `#1C3174` y lima `#B7ED3B`** (más blanco en la horizontal). Es la versión **positiva** para fondos claros.
- Figma `13:74` («logo-merida») y `13:124` («favicon») son la versión **negativa**, sin marino: **blanco y lima `#9DEF0F`**, sobre fondo transparente para usarse en oscuro (la captura se ve sobre gris oscuro). `13:74` tiene además un detalle `#FCF1F7`.
- **Diferencia clave:** la lima de Figma (`#9DEF0F`) no es la de `public/brand` (`#B7ED3B`). No se reemplazó ni se descargó. Para superficies oscuras de la app (encabezado marino) hace falta la versión negativa **oficial** del manual de identidad; mientras no exista, la lima `#9DEF0F` queda *pendiente de verificar*.
- `isotipo-merida-blanco.svg` (crema, del hero) es una variante monocroma derivada del isotipo. Úsala sólo como decoración del Laboratorio, no como logotipo institucional.

---

## 7. Hallazgos de accesibilidad (contraste WCAG 2.2 calculado con los valores exactos)

| Combinación | Contraste | Veredicto |
|---|---|---|
| Blanco sobre `#005BE8` | 5.74:1 | AA en texto normal |
| Crema `#FFF8ED` sobre `#005BE8` | 5.44:1 | AA |
| Blanco sobre magenta `#F62FA2` | **3.59:1** | Sólo texto grande (≥ 24 px, o 18.66 px en negrita) e íconos. **El descriptor de 16.4 px de la banda Seguridad no cumple**: usa magenta fuerte `#C2307F` (5.22:1) como fondo o súbelo a ≥ 24 px. |
| Café `#533630` sobre magenta | 3.02:1 | Sólo texto grande |
| Café sobre ámbar `#FFB600` | 6.16:1 | AA |
| Café sobre lima `#A2D200` | 6.07:1 | AA |
| Café sobre lima clara `#EEFF54` | 9.84:1 | AAA |
| Blanco o crema sobre café | 10.84 y 10.27:1 | AAA |
| Marino `#1C3174` sobre ámbar, lima y lima clara | 6.86, 6.75 y 10.95:1 | AA a AAA |
| **Crema sobre el degradado de Salud** | 1.72:1 (inicio del título) · 2.43 (línea serif) · 3.14–3.60 (descriptor) | **No cumple.** El texto claro cae sobre la parte clara del degradado. Opciones: (a) texto marino o café en la mitad superior; (b) invertir el degradado (azul arriba) o hacerlo de 135°; (c) usar un velo azul sólido detrás del texto. |
| Lima del logo `#B7ED3B` sobre marino | 8.73:1 | AAA (foco en oscuro) |
| `#FFFBE2` y `#BFBFBF` sobre `#101511` | 17.72 y 10.04:1 | AAA |
| `#101511` sobre `#EBFF57` | 16.68:1 | AAA |
| Placeholder `#5B615D` en el compositor oscuro | **2.58:1** | No cumple: usa `#9FA19E` o `#BFBFBF` |
| «Saltar» blanco, «1/5» `#BFBFBF` e invitación `#9C9C9C` sobre crema | **1.06, 1.74 y 2.60:1** | No cumple |
| Placeholder `#9AA3B2` y borde `#DCE0E8` sobre blanco (formulario) | **2.54 y 1.32:1** | No cumple |
| Subtítulo de Vital `#6F94B1` sobre blanco | **3.21:1** | No cumple en 12 px |

---

## 8. Cómo aplicarlo en merida-unificada

| Pieza de Figma | Pantalla o componente de la app | Cómo |
|---|---|---|
| Lanzador «Por texto o por voz» (Vital) + paleta del agente del Laboratorio | Botón flotante del asistente (`AssistantMount`) y su primera pantalla | Toma la **estructura y el comportamiento** del código de Marea: `<dialog>` a pantalla completa en el teléfono, tarjeta centrada de 480×860 desde 800 px, modo flotante compacto, foco al título y guarda de movimiento reducido. Cámbiale la piel al Laboratorio: título en Host Grotesk Bold 42/1.02 con `tracking -0.024em`, orbe sustituido por la **mascota «saludando»** (o un orbe lima con halos `rgba(162,210,0,.12/.20/.26)`), y tarjetas «Hablar» y «Escribir» con chip de ícono en `lima-suave` o `azul-suave`. Conserva el texto «Prototipo de demostración». La voz es simulada si `VITE_INTEGRATION_MODE` no es real. |
| Onboarding del agente (`22:67` y `22:179`) | Primera vez que se abre el asistente (opcional) | 3 a 5 pasos con barra de progreso y «Saltar». Preguntas **municipales**, nunca de financiamiento: «¿Qué quieres hacer hoy?» con opciones *Reportar un problema*, *Hacer un trámite*, *Consultar mi gestión* y *Buscar un servicio*. Fondo crema en el paso 1 y noche en los siguientes, o todo crema si se prioriza la coherencia con el AppShell. Corrige los contrastes de §4.1. |
| Inicio del chat (`22:218` y `22:253`) | Pantalla vacía del chat del asistente | Mascota, «Hola, soy tu asistente» (o el nombre provisional que se decida, rotulado como simulación), párrafo, **chips que prellenan** acciones de la lista blanca (`shared/asistente/acciones.ts`) y compositor en píldora con Adjuntar, Dictar y Enviar. Tema oscuro `noche` sólo dentro del asistente; el resto de la app sigue clara. |
| Mascota (3 estados) | Asistente: reposo, escucha y pensando | Componente `MascotaAsistente` con `estado: "saludando" | "escuchando" | "pensando"` que elige el SVG. Decorativa. **Nunca en Bienestar, Salud mental ni Línea Mujer.** |
| Mosaicos y glifos | Categorías del catálogo, accesos rápidos de Inicio y `ServiceCard` | 6 categorías: Salud y Bienestar → azul y glifo crema; Seguridad y Protección → magenta (sólo ícono con texto en tinta fuera del mosaico); Movilidad y Tránsito → ámbar con glifo café; Medio ambiente → lima con glifo café (o lima clara `#EEFF54`); Trámites y Atención → lima o ámbar; Desarrollo Urbano → café con glifo crema. Siempre con texto visible. |
| Encabezados temáticos (bandas) | Cabecera de cada categoría del catálogo (`/servicios?categoria=…`) y secciones de Inicio | `EncabezadoTematico` (§4.8) con la adaptación de §3.5. Las bandas a todo el ancho van en Inicio o en la portada de una categoría, no dentro de flujos transaccionales. |
| Hero y banner | Inicio (hero) y cabecera de campañas o «Novedades» | Hero con el degradado de 132.81°, el isotipo crema y el rótulo de demostración visible. Banner con el patrón cadena como cierre decorativo. |
| Tarjeta de servicio con «Iniciar» (`12:64`) | `ServiceCard` y las respuestas del asistente que proponen un servicio | Tarjeta de radio 21 con color de categoría, glifo, nombre, dependencia y CTA «Iniciar» (≥ 44 px). El asistente **prepara y abre** la ficha; la persona confirma. |
| Salud y Bienestar (banda) | Módulo de bienestar y salud mental | Usa la **paleta** (azul y crema) y la tipografía para la portada informativa. **No** uses la mascota ni rachas, y el texto «Línea de la Vida» sale del catálogo verificado. El botón de ayuda inmediata siempre visible tiene prioridad visual sobre cualquier decoración. Corrige el contraste del degradado (§7). |
| Seguridad y Protección (banda) | Línea Mujer y emergencias | Magenta como acento, con texto en `magenta-fuerte` o tinta. «Línea Mujer» y «911» son copy hasta verificarse. Consultar información ≠ abrir canal ≠ simular (§2.10). |
| Desarrollo Urbano (banda) | Mapa y consultas territoriales | Café de fondo con texto crema. «Geoportal», «Visor Urbano» e «información catastral» son copy; la app no tiene capas oficiales autorizadas (§2.12). |
| Formulario (`14:125`) | Todos los `FormFlow` y los formularios de reporte | Sólo la anatomía (etiqueta, campo con ícono, ayuda y error) con las correcciones de §4.9. Sin Google y sin contraseña. |
| Loader | `LoadingState` | Loader de mosaicos de §4.10 con `role="status"` y texto. |
| «UN TEJIDO» (IBM Plex Mono Bold, tracking 0.17 em) | Rótulos de sección o «eyebrows» | Estilo de rótulo en mayúsculas para etiquetas cortas (p. ej. «CATEGORÍA»), en tamaño ≥ 12 px. |

### 8.1 Propuesta de tokens (CSS, Tailwind 4 `@theme`)

Reconcilia la identidad del Laboratorio con la **base del logotipo** (marino `#1C3174` y `#002C72`, lima del logo `#B7ED3B`). Mantiene los nombres en español de `src/design-system/tokens.css` y sólo cambia los valores aproximados por los exactos de Figma. **Es una propuesta: este documento no modifica `src/`.**

```css
@theme static {
  /* Tipografía del Laboratorio (autoalojar; Poppins queda como respaldo). */
  --font-sans: "Host Grotesk", "Poppins", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  --font-serif-acento: "Instrument Serif", ui-serif, Georgia, serif;   /* sólo itálica, 2.ª línea de títulos temáticos */
  --font-mono-rotulo: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace; /* 500, MAYÚSCULAS, tracking .05em */
  --font-agente: "Unbounded", "Host Grotesk", sans-serif;              /* sólo saludo o nombre del asistente */

  /* Base del logotipo (sin cambios, institucional). */
  --color-marino: #1c3174;
  --color-marino-portal: #002c72;
  --color-lima-logo: #b7ed3b;
  --color-verde: #74ba47;

  /* Laboratorio de Innovación: valores EXACTOS de Figma (antes aproximados). */
  --color-azul: #005be8;          /* antes #255adf · blanco 5.74:1, crema 5.44:1 */
  --color-azul-salud: #0d63e8;    /* fin del degradado de Salud */
  --color-ambar: #ffb600;         /* antes #f4b940 · café 6.16:1, marino 6.86:1 */
  --color-cafe: #533630;          /* antes #4f3731 · blanco 10.84:1 */
  --color-magenta: #f62fa2;       /* antes #e2449f · blanco 3.59:1 → sólo íconos y texto grande */
  --color-magenta-fuerte: #c2307f;/* se conserva para texto blanco normal (5.22:1) */
  --color-lima: #a2d200;          /* antes #afdf57 · café 6.07:1, marino 6.75:1 */
  --color-lima-clara: #eeff54;    /* NUEVO · banda Medio ambiente; café 9.84:1 */
  --color-crema: #fff8ed;         /* antes #fef8ee (unifica #FFF8EC del agente) */
  --color-crema-calida: #ffe7be;  /* texto sobre café en CTA */
  --color-banner-inicio: #fff8ed; /* antes #f8f4ee */
  --color-banner-fin: #005be8;    /* antes #295ee0 */

  /* Tema del asistente (sólo dentro del asistente). */
  --color-noche: #101511;
  --color-noche-2: #343835;
  --color-noche-borde: #5b615d;   /* pista de progreso y bordes (≥3:1 contra noche) */
  --color-noche-texto: #fffbe2;
  --color-noche-texto-suave: #bfbfbf;
  --color-noche-placeholder: #9fa19e; /* corrige #5B615D (2.58:1) */
  --color-lima-agente: #ebff57;
  --color-chip-noche: rgb(242 255 234 / 0.14);

  /* Mascota (sólo SVG o decoración). */
  --color-mascota-inicio: #eeff54;
  --color-mascota-fin: #a2d200;

  /* Fondos semánticos (se mantienen y apuntan a la crema exacta). */
  --color-fondo: #fff8ed;

  /* Radios del Laboratorio. */
  --radius-tarjeta: 1.3125rem;   /* 21 px, tarjeta de servicio (antes 22) */
  --radius-foto: 3.125rem;       /* 50 px en escritorio; usar 2rem en móvil */
  --radius-foto-tarjeta: 1.125rem; /* 18 px */
  --radius-control: 0.75rem;     /* 12 px ≈ 11.2 de Figma (sin cambio) */
  --radius-pildora: 999px;
}

/* Degradados y medidas proporcionales (no son colores de utilidad). */
:root {
  --degradado-hero: linear-gradient(132.81deg, #fff8ed 1.338%, #005be8 56.086%);
  --degradado-banner: linear-gradient(90deg, #fff8ed, #005be8);
  --degradado-salud: linear-gradient(180deg, #fff8ed, #0d63e8); /* texto oscuro arriba o velo detrás del texto claro */
  --radio-mosaico: 17.5%;        /* de 32.22 sobre 184.53 */
  --glifo-mosaico: 66%;
  --titulo-tematico-sans: clamp(2.25rem, 9.13vw, 6.576rem);
  --titulo-tematico-serif: clamp(2.6rem, 10.41vw, 7.5rem);
  --rotulo-mono: clamp(0.875rem, 1.42vw, 1.0227rem);
  --tracking-titulo: -0.05em;
  --tracking-rotulo: 0.05em;
  --interlineado-titulo: 0.972;
  --interlineado-rotulo: 1.83;
}
```

**Reglas de uso:**

- En superficies institucionales (encabezado y navegación del AppShell), **marino más lima del logo**, como hasta ahora.
- La paleta del Laboratorio es de **acento** (categorías, mosaicos, bandas e Inicio) y el tema `noche` es exclusivo del asistente.
- Los colores de estatus de Mérida Móvil no cambian.
- Al cambiar los valores, recalcula y actualiza el bloque de contrastes de `tokens.css`. La tabla de §7 tiene los nuevos valores.

---

## 9. Diferencias con la app actual (resumen)

1. Los valores del Laboratorio en `tokens.css` son aproximados y deben ser los exactos: `#005BE8`, `#FFB600`, `#533630`, `#F62FA2`, `#A2D200`, `#FFF8ED` y el banner `#FFF8ED → #005BE8`. Falta la lima clara `#EEFF54`.
2. La app usa **Poppins**; el Laboratorio usa **Host Grotesk + Instrument Serif Italic + IBM Plex Mono**.
3. `--radius-tarjeta` (22 px) dice venir «de los mosaicos del Laboratorio», pero los mosaicos usan el **17.5 %** del lado (32.22 px a 184.5 px). Los 21–22 px corresponden a la tarjeta de servicio.
4. No existen tokens del tema del asistente (`noche`, lima del agente) ni degradados del hero y de Salud.

---

## 10. Lo que no se pudo leer o queda abierto

- **Nodos eliminados durante la extracción:** `22:743`, `22:745`, `22:751`, `22:1339`, `29:1374`, `29:1401` y `34:1574` devolvieron «node not found». Faltan capturas y especificaciones de «Mérida contigo es mejor», «hola» y «Recurso 5 1».
- **`22:360` (paso 3)** está vacío y no hay nada que especificar.
- **Movimiento:** no hay keyframes. Los «Loader Animado» se documentan por inferencia.
- **Variables:** el Laboratorio no tiene variables de Figma. Los valores son literales.
- **Vital Oceans:** la paginación del Figma no está en el código porque el lanzador no es un carrusel. No hace falta replicarla.
- **Logotipo negativo oficial:** pendiente de confirmar si la lima `#9DEF0F` es la oficial para fondos oscuros.
