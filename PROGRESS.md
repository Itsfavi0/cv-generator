# Progreso — #1 Generador de CV

> Fuente de verdad del avance. Marca `[x]` al terminar cada tarea, haz commit y añade una línea a la bitácora.

**Estado:** 🚧 Base de código escrita, sin probar · **Última actualización:** 2026-10-15

## Tareas

- [x] Modelo, validación, puntaje, almacenamiento, formato y render (`src/js/`)
- [x] `index.html`, `app.js`, `scripts/serve.js`, `package.json`
- [x] `git init`, `.gitignore`, `LICENSE` y commit inicial con el código existente
- [x] Tests: `tests/format.test.js`, `validation.test.js`, `score.test.js`, `model.test.js`, `storage.test.js`
- [x] `src/styles/app.css` (editor, modo claro/oscuro, responsivo, toast, medidor, impresión)
- [x] `src/styles/cv.css` (hoja A4 y plantillas Clásica, Moderna y Minimalista)
- [x] Verificación manual en el navegador: corregir bugs y que no haya errores en la consola
- [x] Verificación a 375 px y en la vista de impresión
- [x] `docs/screenshot.png`
- [ ] README final
- [ ] Extras (ver `CLAUDE.md`)

## Bitácora

- 2026-10-15 — La sesión coordinadora escribió la lógica de `src/js/`, `index.html` y el servidor. Todavía sin ejecutar.
- 2026-10-15 — `git init` (rama `main`), `.gitignore`, `LICENSE` (MIT) y commit inicial con el código existente.
- 2026-10-15 — Tests con `node:test` (35 casos: format, validation, score, model, storage). Corregido `npm test`: en Node 24 `node --test tests/` no acepta un directorio; ahora usa el glob `tests/**/*.test.js`.
- 2026-10-15 — `app.css`: tokens claro/oscuro (sistema + botón ◐), 2 columnas con vista previa sticky, 1 columna bajo 960 px, medidor con conic-gradient, toast e impresión.
- 2026-10-15 — `cv.css`: hoja A4 siempre blanca y plantillas Clásica, Moderna (barra lateral de acento) y Minimalista (versalitas y "·"); container query para hojas estrechas.
- 2026-10-15 — Verificado en el navegador integrado: vista previa en vivo, errores al salir del campo, 3 plantillas, color, ejemplo, importar/exportar JSON (también JSON roto y con HTML), reiniciar, tema claro/oscuro, mover/eliminar entradas, habilidades y bloqueo del PDF con errores. Consola sin errores. Bugs corregidos: `npm test` con directorio, borde rojo que no se veía (especificidad), campos que se estiraban al mostrar un error, "Importar JSON" inaccesible por teclado y entradas por encima de 20 que se perdían al recargar.
- 2026-10-15 — Verificado a 375 px (sin scroll horizontal) y la impresión con Chrome headless (CDP `Page.printToPDF`): las 3 plantillas salen en 1 página A4 con colores. Corregido: con `aspect-ratio` en un contenedor flex la hoja no crecía y el texto se salía en móvil; ahora un pseudo-elemento fija el alto mínimo. La barra superior deja de ser sticky en móvil.
- 2026-10-15 — `docs/screenshot.png` (1440×900, modo claro, CV de ejemplo con la plantilla Moderna) generada con Chrome headless vía CDP, porque el pane integrado no siempre pinta cuando la ventana está en segundo plano.

## Decisiones

- JavaScript puro en vez de React: el objetivo es dominar el DOM y el estado sin abstracciones.
- PDF con impresión nativa en vez de jsPDF: el texto queda real y legible para ATS, y no suma dependencias.
- Todas las plantillas comparten el HTML y se diferencian solo por CSS.

## Bloqueos

_(ninguno)_

## Resumen final para Favio

_(Se completa al terminar.)_
