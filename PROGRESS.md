# Progreso — #1 Generador de CV

> Fuente de verdad del avance. Marca `[x]` al terminar cada tarea, haz commit y añade una línea a la bitácora.

**Estado:** 🚧 Base de código escrita, sin probar · **Última actualización:** 2026-10-15

## Tareas

- [x] Modelo, validación, puntaje, almacenamiento, formato y render (`src/js/`)
- [x] `index.html`, `app.js`, `scripts/serve.js`, `package.json`
- [x] `git init`, `.gitignore`, `LICENSE` y commit inicial con el código existente
- [ ] Tests: `tests/format.test.js`, `validation.test.js`, `score.test.js`, `model.test.js`, `storage.test.js`
- [ ] `src/styles/app.css` (editor, modo claro/oscuro, responsivo, toast, medidor, impresión)
- [ ] `src/styles/cv.css` (hoja A4 y plantillas Clásica, Moderna y Minimalista)
- [ ] Verificación manual en el navegador: corregir bugs y que no haya errores en la consola
- [ ] Verificación a 375 px y en la vista de impresión
- [ ] `docs/screenshot.png`
- [ ] README final
- [ ] Extras (ver `CLAUDE.md`)

## Bitácora

- 2026-10-15 — La sesión coordinadora escribió la lógica de `src/js/`, `index.html` y el servidor. Todavía sin ejecutar.
- 2026-10-15 — `git init` (rama `main`), `.gitignore`, `LICENSE` (MIT) y commit inicial con el código existente.

## Decisiones

- JavaScript puro en vez de React: el objetivo es dominar el DOM y el estado sin abstracciones.
- PDF con impresión nativa en vez de jsPDF: el texto queda real y legible para ATS, y no suma dependencias.
- Todas las plantillas comparten el HTML y se diferencian solo por CSS.

## Bloqueos

_(ninguno)_

## Resumen final para Favio

_(Se completa al terminar.)_
