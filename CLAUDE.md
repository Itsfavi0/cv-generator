# Proyecto #1 — Generador de CV

Lee primero `../CLAUDE.md` (reglas comunes) y luego `PROGRESS.md` (qué falta).

## Qué es

Una app web donde el usuario llena un formulario por secciones y ve **en vivo** su CV, puede elegir entre **3 plantillas**, recibe un **puntaje de calidad** con consejos y lo **exporta a PDF**. Nivel principiante, solo frontend, sin backend.

## Stack (decidido, no cambiar)

- HTML semántico, CSS con variables y JavaScript puro con **módulos ES**. **Sin frameworks, sin bundler y sin dependencias de npm.**
- PDF: `window.print()` con `@media print` y `@page { size: A4; margin: 0 }`. No uses jsPDF ni html2canvas, porque el texto debe quedar seleccionable y legible para los sistemas ATS.
- Persistencia: `localStorage`, siempre dentro de try/catch.
- Tests: `node:test` (`npm test` → `node --test tests/`).
- Desarrollo: `npm start` → `scripts/serve.js` (servidor estático en el puerto 5173).

## Código que ya existe (revísalo, no lo reescribas desde cero)

Lo escribió la sesión coordinadora antes de pausar. Ningún archivo se ha ejecutado ni probado todavía:

- `package.json`, `scripts/serve.js`, `index.html`
- `src/js/app.js`: eventos, estado, toasts, importar/exportar, tema e impresión
- `src/js/model.js`: `TEMPLATES`, `createEmptyCV`, `createExperience`, `createEducation`, `normalizeCV`, `addSkill`, `moveItem`, `sampleCV`
- `src/js/validation.js`: `validateCV(cv)` → `{ "personal.email": "mensaje", "experience.<id>.role": … }`
- `src/js/score.js`: `scoreCV(cv)` → `{ score: 0-100, tips: [] }` y `scoreLabel`
- `src/js/storage.js`: `loadCV` / `saveCV` / `clearCV` con storage inyectable
- `src/js/render.js`: `renderCV(cv, container)`. Genera la misma estructura para todas las plantillas, con las clases `.cv`, `.cv--{template}`, `.cv__header`, `.cv__name` (+ `.is-placeholder`), `.cv__title`, `.cv__contact`, `.cv__body`, `.cv__main`, `.cv__aside`, `.cv__section`, `.cv__section-title`, `.cv__entry`, `.cv__entry-head`, `.cv__entry-title`, `.cv__entry-date`, `.cv__entry-sub`, `.cv__bullets`, `.cv__text` y `.cv__skills`. Usa la variable `--cv-accent`.
- `src/js/utils/dom.js` (`el`, `debounce`) y `src/js/utils/format.js` (`formatMonth`, `formatRange`, `toHref`, `displayUrl`, `parseDescription`, `slugify`)

**Faltan:** `src/styles/app.css`, `src/styles/cv.css`, `tests/`, `.gitignore`, `LICENSE`, `README.md` y `docs/screenshot.png`.

## Requisitos de diseño

**Editor (`app.css`):**
- Tokens en `:root`, redefinidos para modo oscuro con `@media (prefers-color-scheme: dark)` sobre `:root:not([data-theme="light"])` y también con `:root[data-theme="dark"]`. El botón ◐ alterna `data-theme`.
- En escritorio, 2 columnas: el formulario a la izquierda y la vista previa *sticky* a la derecha. Por debajo de 960 px, 1 columna. Sin scroll horizontal a 375 px.
- Clases que ya usa el HTML: `.topbar`, `.brand`, `.layout`, `.editor`, `.preview-pane`, `.card`, `.card__title` (es un `legend`), `.grid-2`, `.field` (y sus variantes `--inline` y `--check`), `.field__label`, `.field__error` (oculto si está vacío), `.field__hint`, `.btn` (y `--ghost`, `--primary`, `--dashed`, `--icon`, `--sm`, `--danger`), `.entries`, `.entry`, `.entry__toolbar`, `.entry__index`, `.entry__buttons`, `.skill-input`, `.chips`, `.chip`, `.chip__remove`, `.preview-toolbar`, `.score-card` (con `__head`, `__label`, `__hint`, `__tips`), `.score-meter` (con `--score` y `data-level` low/mid/high, dibujado con `conic-gradient`) y `.toast` (con `.is-visible` y `data-type` error/success).
- `[aria-invalid="true"]` con borde rojo. Foco visible. Respeta `prefers-reduced-motion`.
- `@media print`: oculta todo excepto `.cv-page`, sin márgenes y con `print-color-adjust: exact`.

**Hoja del CV (`cv.css`):**
- `.cv-page` es siempre una hoja blanca con texto oscuro, aunque el editor esté en modo oscuro. En pantalla: `max-width: 210mm`, `aspect-ratio: 210/297` como alto mínimo y sombra. Al imprimir: `width: 210mm`, `min-height: 297mm` y sin sombra.
- **Clásica:** una columna, encabezado centrado con línea de acento y las habilidades al final.
- **Moderna:** barra lateral de color (`--cv-accent`) a la izquierda con las habilidades; encabezado a todo el ancho.
- **Minimalista:** una columna, mucho espacio en blanco, títulos de sección pequeños en versalitas y habilidades separadas por "·".
- Tipografía del sistema, tamaños en `pt` o `px` legibles al imprimir. Evita que una entrada se corte entre páginas (`break-inside: avoid`).

## Definición de terminado

- [ ] `npm test` en verde, con tests de `format`, `validation`, `score`, `model` y `storage`.
- [ ] Verificado en el navegador integrado (con `npm start`): escribir y ver la vista previa, que aparezcan los errores al salir de un campo, las 3 plantillas, el color de acento, cargar el ejemplo, importar y exportar JSON, reiniciar, el modo oscuro, la vista de impresión y el ancho de 375 px. **Sin errores en la consola.**
- [ ] `docs/screenshot.png` (con el CV de ejemplo y la plantilla Moderna).
- [ ] README final según `../CLAUDE.md`, `.gitignore` y `LICENSE` (MIT, Favio Brañez, 2026).
- [ ] Commits pequeños por cada paso.

## Extras (solo si sobra tiempo, en este orden)

1. Atajo `Ctrl+P` que pase por la validación antes de imprimir.
2. Una cuarta plantilla ("Ejecutiva", a dos columnas con encabezado oscuro).
3. Botón "Deshacer" en el toast al eliminar una entrada.
