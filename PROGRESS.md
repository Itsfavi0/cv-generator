# Progreso — #1 Generador de CV

> Fuente de verdad del avance. Marca `[x]` al terminar cada tarea, haz commit y añade una línea a la bitácora.

**Estado:** ✅ Terminado, incluidos los 3 extras (falta tu revisión) · **Última actualización:** 2026-10-15

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
- [x] README final
- [x] Extras (ver `CLAUDE.md`)

## Bitácora

- 2026-10-15 — La sesión coordinadora escribió la lógica de `src/js/`, `index.html` y el servidor. Todavía sin ejecutar.
- 2026-10-15 — `git init` (rama `main`), `.gitignore`, `LICENSE` (MIT) y commit inicial con el código existente.
- 2026-10-15 — Tests con `node:test` (35 casos: format, validation, score, model, storage). Corregido `npm test`: en Node 24 `node --test tests/` no acepta un directorio; ahora usa el glob `tests/**/*.test.js`.
- 2026-10-15 — `app.css`: tokens claro/oscuro (sistema + botón ◐), 2 columnas con vista previa sticky, 1 columna bajo 960 px, medidor con conic-gradient, toast e impresión.
- 2026-10-15 — `cv.css`: hoja A4 siempre blanca y plantillas Clásica, Moderna (barra lateral de acento) y Minimalista (versalitas y "·"); container query para hojas estrechas.
- 2026-10-15 — Verificado en el navegador integrado: vista previa en vivo, errores al salir del campo, 3 plantillas, color, ejemplo, importar/exportar JSON (también JSON roto y con HTML), reiniciar, tema claro/oscuro, mover/eliminar entradas, habilidades y bloqueo del PDF con errores. Consola sin errores. Bugs corregidos: `npm test` con directorio, borde rojo que no se veía (especificidad), campos que se estiraban al mostrar un error, "Importar JSON" inaccesible por teclado y entradas por encima de 20 que se perdían al recargar.
- 2026-10-15 — Verificado a 375 px (sin scroll horizontal) y la impresión con Chrome headless (CDP `Page.printToPDF`): las 3 plantillas salen en 1 página A4 con colores. Corregido: con `aspect-ratio` en un contenedor flex la hoja no crecía y el texto se salía en móvil; ahora un pseudo-elemento fija el alto mínimo. La barra superior deja de ser sticky en móvil.
- 2026-10-15 — `docs/screenshot.png` (1440×900, modo claro, CV de ejemplo con la plantilla Moderna) generada con Chrome headless vía CDP, porque el pane integrado no siempre pinta cuando la ventana está en segundo plano.
- 2026-10-15 — README final: frase de valor, captura, funcionalidades, stack, uso, tests, estructura, decisiones técnicas e ideas futuras. Decisiones de la noche anotadas en PROGRESS.md.
- 2026-10-15 — Extras: `Ctrl+P` con validación (y render inmediato antes de imprimir), plantilla Ejecutiva y botón "Deshacer" en el toast al eliminar una entrada. Verificados en el navegador y con impresión headless (4 plantillas, 1 página cada una). Consola sin errores.
- 2026-10-15 — Corregido el padding de la Ejecutiva en hojas estrechas. Definición de terminado completa y resumen final escrito.

## Decisiones

- JavaScript puro en vez de React: el objetivo es dominar el DOM y el estado sin abstracciones.
- PDF con impresión nativa en vez de jsPDF: el texto queda real y legible para ATS, y no suma dependencias.
- Todas las plantillas comparten el HTML y se diferencian solo por CSS.
- Extras: `Ctrl+P`/`Cmd+P` se intercepta y pasa por la misma validación que el botón; imprimir desde el menú del navegador no se puede bloquear, pero sí imprime la vista previa. "Deshacer" restaura la entrada en su posición original durante 6 s, salvo que entretanto se haya cargado otro CV o la sección esté llena.
- `npm test` usa el glob `"tests/**/*.test.js"`: en Node 24, `node --test tests/` falla porque ya no acepta un directorio.
- Los errores de validación solo se muestran en campos tocados (o todos al pulsar "Descargar PDF"), como ya hacía `app.js`.
- Alto mínimo A4 con un pseudo-elemento `::before` (`padding-top` proporcional) en vez de `aspect-ratio`: en un contenedor flex, Chrome fijaba el alto y el contenido se salía de la hoja en móvil. El requisito "aspect-ratio como alto mínimo" se cumple con otra técnica.
- Las plantillas responden al ancho de la hoja con `container-type: inline-size` (en móvil la barra lateral de la Moderna pasa abajo); al imprimir siempre es A4.
- En la Moderna, la barra lateral usa el acento oscurecido un 18 % (`color-mix`) para que el texto blanco tenga contraste también con colores claros.
- "Importar JSON" pasó de `<label>` a `<button>` que abre el `<input type=file>` oculto: un label no recibe foco con el teclado.
- Límite de 20 entradas por sección también en la UI (antes solo en `normalizeCV`, y lo que sobraba se perdía al recargar).
- En móvil (≤ 640 px) la barra superior no es sticky: ocupa dos filas y robaba demasiada pantalla.
- La captura y la prueba de impresión se hicieron con Chrome headless vía CDP (script fuera del repo), porque el pane integrado no pinta frames cuando la ventana está en segundo plano. Las pruebas funcionales sí se hicieron en el pane.

## Bloqueos

_(ninguno)_

## Resumen final para Favio

**Cómo ejecutarlo**

```bash
cd portafolio/cv-generator
npm start   # http://localhost:5173 (no hay que instalar nada)
npm test    # 36 tests con node:test
```

**Qué probar primero (5 minutos)**

1. Pulsa **Cargar ejemplo**: el puntaje debe marcar 100 y la vista previa mostrar a Valeria con la plantilla Moderna.
2. Cambia entre las **4 plantillas** (Clásica, Moderna, Minimalista, Ejecutiva) y el **color**.
3. Pulsa **Descargar PDF** → "Guardar como PDF". Abre el PDF y comprueba que el texto se puede seleccionar (eso es lo que leen los ATS). En el diálogo, deja *Márgenes: ninguno* y activa *Gráficos de fondo* si tu navegador no lo hace solo.
4. Borra el email, sal del campo con Tab y pulsa `Ctrl+P`: debe salir el error y no imprimir.
5. Elimina una experiencia y pulsa **Deshacer** en el aviso.
6. Pulsa ◐ para el modo oscuro, y abre las DevTools en modo móvil (375 px).

**Qué cambié del código existente** (detalle en la bitácora): el script `npm test` (no funcionaba en Node 24), el borde rojo de los errores (no se veía), la hoja A4 que no crecía en móvil, "Importar JSON" ahora es un botón accesible con teclado, límite de 20 entradas también en la UI, render inmediato antes de imprimir y la regex de tildes de `slugify` escrita de forma legible. El resto de la lógica estaba bien y se mantuvo.

**Qué quedó pendiente o sin verificar**

- Solo se probó en Chromium (navegador integrado y Chrome headless). Falta un vistazo en Firefox y Safari; `color-mix()` y las *container queries* necesitan versiones de 2023 o posteriores.
- El diálogo real de "Guardar como PDF" no se puede automatizar: se comprobó con `Page.printToPDF` de Chrome (1 página A4 por plantilla, con colores). Conviene que lo pruebes tú una vez.
- En la plantilla Moderna, si el CV ocupa 2 páginas, la barra lateral de color solo cubre la primera. Con un CV normal de 1 página no se nota.
- No hay tests automáticos de la interfaz (`app.js`, `render.js`); la UI se verificó a mano. Playwright quedó en "Ideas futuras" del README.
- Nada de push: los 17 commits están solo en local, en la rama `main`.
