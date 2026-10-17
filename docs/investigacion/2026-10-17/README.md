# Investigación del 2026-10-17

Resultados estructurados (JSON) de la investigación de sólo lectura sobre fuentes públicas del
Ayuntamiento de Mérida Son la base de `docs/INVENTARIO_SERVICIOS.md`
y `docs/REFERENCIAS_UI.md`.

| Archivo | Contenido |
|---|---|
| `web-merida-movil.json` | Mérida Móvil (fichas de tienda v4.0.2) y Reporta en línea: módulos, recorrido de reporte, observaciones de UI |
| `web-portal-municipal.json` | Portal municipal, MIDigital, catálogos por categoría, logotipos y tokens CSS observados |
| `web-portal-ciudadano.json` | Portal Ciudadano y Expediente Digital: estructura de ficha, muestra del catálogo |
| `web-visor-geoportal.json` | Visor Urbano y Geoportal: módulos, servicios geográficos, condiciones, límites de acceso |
| `web-bienestar.json` | Bienestar, salud mental (Alma Nova, Ruta de la Salud Mental) y Línea Mujer |
| `verify-datos-criticos.json` | Re-verificación de teléfonos, correos, direcciones y horarios contra su fuente (confirmado / no encontrado / inaccesible) |

Reglas aplicadas: sólo lectura, sin evadir captchas (merida.gob.mx y Visor Urbano están detrás de
Radware Bot Manager; se usaron capturas fechadas de Wayback Machine y fichas oficiales de tiendas),
sin datos personales, con URL y fecha de consulta por dato. Un anuncio visible no implica vigencia.
