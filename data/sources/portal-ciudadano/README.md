# Instantáneas del Portal Ciudadano (MIDigital)

Datos públicos consultados en modo sólo lectura para construir el inventario y la muestra
verificable del Catálogo Municipal del prototipo. No implican integración técnica ni autorización
de reutilización: en una integración real, el catálogo debe obtenerse de una fuente autorizada.

| Archivo | Contenido | Fuente | Consulta |
|---|---|---|---|
| `2026-10-17/indice-tramites.json` | 387 fichas del listado: clave, nombre, unidad, categorías, grupos, descripción, modalidad, enlace a la ficha | https://portalciudadano.merida.gob.mx/TramitesEnLinea/tramites | 2026-10-17 |
| `2026-10-17/fichas-detalle.json` | 27 fichas abiertas: requisitos, costo, tiempos, procedimientos, módulos y horarios tal como los publica la fuente | https://portalciudadano.merida.gob.mx/TramitesEnLinea/detalle-tramite/{id} | 2026-10-17 |

- Los costos, requisitos y horarios cambian: la interfaz siempre muestra la fecha de consulta y el enlace a la ficha oficial.
- No se copiaron datos personales (el padrón de inspectores con fotografías no se descargó a este repositorio).
- Para regenerar `src/data/catalogo/*.json`: `npm run catalogo:importar`.
