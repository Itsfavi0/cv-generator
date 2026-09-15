# Generador de CV

**Escribe tu currículum una vez, míralo en vivo con cuatro diseños y descárgalo como un PDF con texto real, legible por los sistemas ATS.** Sin cuentas, sin servidor y sin dependencias: todo ocurre en tu navegador.

![Editor a la izquierda y vista previa del CV de ejemplo con la plantilla Moderna a la derecha](docs/screenshot.png)

## Funcionalidades

- **Vista previa en vivo**: cada tecla actualiza el CV al instante.
- **4 plantillas**: Clásica (serif, centrada), Moderna (barra lateral de color), Minimalista (versalitas y mucho aire) y Ejecutiva (encabezado oscuro, dos columnas), con **color de acento** a elección.
- **Puntaje de calidad (0–100)** con consejos concretos para mejorarlo (se muestran los 3 primeros pendientes): resumen de 150–600 caracteres, logros cuantificados, al menos 5 habilidades, etc.
- **Validación amable**: los errores aparecen al salir del campo, no mientras escribes. Nombre y email obligatorios; teléfono, web y fechas se comprueban.
- **Exportar a PDF** con la impresión nativa del navegador, en A4 y sin márgenes. El texto se puede seleccionar y copiar. `Ctrl+P` también pasa por la validación antes de imprimir.
- **Experiencia y educación** con varias entradas que se pueden reordenar (↑ ↓) y eliminar, con opción de **Deshacer**. Las líneas que empiezan con `-` se convierten en viñetas.
- **Habilidades como etiquetas**: Enter para añadir, varias a la vez separadas por comas y sin duplicados.
- **Guardado automático** en `localStorage`. **Importa y exporta** tus datos en JSON.
- **Modo claro y oscuro** (sigue al sistema o se elige con ◐) y diseño **responsivo** hasta 375 px.
- Accesible con teclado: foco visible, `aria-invalid` en los errores y se respeta `prefers-reduced-motion`.

## Stack

| Parte | Tecnología |
|---|---|
| Interfaz | HTML semántico, CSS con variables y *container queries* |
| Lógica | JavaScript puro con módulos ES, **sin frameworks ni bundler** |
| PDF | `window.print()` + `@media print` + `@page { size: A4; margin: 0 }` |
| Persistencia | `localStorage` (con `try/catch`) |
| Tests | `node:test` y `node:assert`, sin dependencias |
| Servidor de desarrollo | `node:http` (≈40 líneas) |

## Instalación y uso

Requisitos: Node.js 20 o superior. No hay que instalar paquetes.

```bash
git clone <url-del-repo> cv-generator
cd cv-generator
npm start
```

Abre <http://localhost:5173>. Pulsa **Cargar ejemplo** para ver un CV completo, cambia de plantilla y pulsa **Descargar PDF** (en el diálogo, elige "Guardar como PDF").

> Los módulos ES no funcionan abriendo `index.html` con doble clic (`file://`); por eso se incluye un servidor estático mínimo. También sirve cualquier otro, como la extensión Live Server.

## Tests

```bash
npm test
```

Hay 36 pruebas sobre la lógica pura: formato de fechas y URLs, validación, puntaje, saneamiento de datos importados y almacenamiento (con un `localStorage` simulado y otro que lanza errores). La interfaz se verificó a mano en el navegador; ver [`PROGRESS.md`](PROGRESS.md).

## Estructura

```
cv-generator/
├── index.html             # Formulario, barra de vista previa y plantillas <template>
├── src/
│   ├── js/
│   │   ├── app.js         # Estado, eventos, toasts, importar/exportar, tema e impresión
│   │   ├── model.js       # Forma de los datos, normalizeCV (saneamiento), ejemplo
│   │   ├── validation.js  # validateCV → { "ruta.del.campo": "mensaje" }
│   │   ├── score.js       # Criterios del puntaje y consejos
│   │   ├── storage.js     # loadCV / saveCV / clearCV con storage inyectable
│   │   ├── render.js      # Genera el HTML del CV (igual para todas las plantillas)
│   │   └── utils/         # el() para crear nodos, debounce y funciones de formato
│   └── styles/
│       ├── app.css        # Editor: tokens, modo oscuro, layout, impresión
│       └── cv.css         # Hoja A4 y las plantillas
├── tests/                 # *.test.js con node:test
├── scripts/serve.js       # Servidor estático de desarrollo
└── docs/screenshot.png
```

## Decisiones técnicas

- **JavaScript puro en vez de React.** El objetivo del proyecto es dominar el DOM, los eventos y el estado sin abstracciones. El estado es un único objeto `cv`; cada cambio llama a `update()`, que valida, recalcula el puntaje, programa el render y guarda.
- **PDF con la impresión del navegador en vez de jsPDF o html2canvas.** Esas librerías suelen convertir el CV en una imagen: los sistemas ATS no pueden leerla y el texto no se puede copiar. Con `@media print` el PDF tiene texto real y no hace falta ninguna dependencia.
- **Un solo HTML para todas las plantillas.** `render.js` genera siempre la misma estructura semántica (`header`, `section`, `article`) y cada plantilla es solo CSS (`.cv--modern`, etc.). Añadir un diseño no toca JavaScript. En la Moderna, las habilidades aparecen a la izquierda con `order: -1`, pero en el HTML van después de la experiencia, que es el orden que leen los ATS.
- **Seguridad sin `innerHTML`.** Todo el contenido del usuario se inserta como nodos de texto con el helper `el()`, así que escribir `<img onerror=…>` en el nombre se muestra literalmente. Los enlaces solo aceptan `http`/`https` (`toHref`), y los datos importados o guardados pasan por `normalizeCV`, que descarta campos desconocidos, tipos incorrectos y textos demasiado largos.
- **Errores solo en campos "tocados".** Mostrar "El email es obligatorio" antes de que el usuario escriba nada resulta agresivo. Los errores aparecen al salir del campo (`focusout`) o al intentar descargar el PDF.
- **`localStorage` inyectable.** `storage.js` recibe el almacenamiento como parámetro, así que se prueba en Node sin navegador. Todas las llamadas van en `try/catch` porque en modo privado o con las cookies bloqueadas `localStorage` lanza errores.
- **Render agrupado con `requestAnimationFrame` y guardado con `debounce`.** Escribir rápido no re-renderiza ni guarda en cada tecla.
- **Alto mínimo A4 con un pseudo-elemento.** Con `aspect-ratio` sobre el contenedor flex, Chrome dejaba la hoja con alto fijo y en móvil el texto se salía. Un `::before` invisible con `padding-top: calc(100% * 297 / 210)` fija el mínimo y la hoja crece si el CV es largo.
- **Las plantillas se adaptan al ancho de la hoja, no al de la ventana** (`container-type: inline-size`). En móvil, la barra lateral de la Moderna pasa debajo; al imprimir siempre se ve el diseño A4 completo.
- **Límites razonables** (120 caracteres por campo corto, 2000 en descripciones, 20 entradas por sección, 30 habilidades, JSON de 1 MB como máximo) para que un archivo importado no bloquee la página.

## Ideas futuras

- Botón "Ver vista previa" fijo en móvil, porque ahora la hoja queda debajo de todo el formulario.
- Más secciones opcionales: proyectos, idiomas y certificaciones.
- Elegir la tipografía de cada plantilla.
- Reordenar las entradas arrastrándolas, además de con los botones ↑ ↓.
- Tests de interfaz con Playwright.
- Publicarlo en GitHub Pages: es estático, así que no necesita cambios.

## Licencia

[MIT](LICENSE) © 2026 Favio Brañez
