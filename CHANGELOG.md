# Changelog

Todos los cambios relevantes de este proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

## [1.2.0] - 2026-10-16

### Añadido

- Casilla **«Estudio aquí actualmente»** en Educación: desactiva la fecha de fin y muestra «Actualidad» en el CV.

## [1.1.0] - 2026-10-16

El generador pasa a llamarse **Perfila** y suma las secciones y avisos que pide un proceso de selección real.

### Añadido

- Nuevo nombre, **Perfila**, con logo propio (monograma P) en la barra superior y como favicon.
- Sección opcional de **Certificaciones**: nombre, entidad emisora, fecha y enlace a la credencial (el nombre enlaza a ella en el PDF).
- Sección opcional de **Idiomas** con niveles de una lista cerrada (Nativo y C2–A1 del MCER).
- **Habilidades en dos grupos**: técnicas/herramientas y blandas (opcionales, máx. 6), con subtítulos en el CV solo cuando hay de los dos tipos.
- Sección opcional de **Proyectos**: nombre, enlace, tecnologías, fechas y logros en viñetas.
- Campo de **LinkedIn** separado de la web, con validación de que sea un perfil de linkedin.com.
- Pie de página con el autor, la licencia MIT y el enlace al repositorio (no aparece en el PDF).
- **Aviso de longitud**: número de páginas A4 que ocupará el PDF, con aviso a partir de 3.
- El CV de ejemplo incluye proyecto, LinkedIn, certificación, idiomas y habilidades blandas, y sigue cabiendo en una página A4 con las 4 plantillas.

### Cambiado

- En la experiencia, cada línea de "Logros y responsabilidades" es una viñeta, empiece o no con guion. Bajo el campo se indica cuántas viñetas hay y si conviene añadir más o acortar alguna.
- El criterio de puntaje "80 caracteres por experiencia" se reemplaza por dos: al menos 2 logros por experiencia y ninguna viñeta de más de 200 caracteres.

- El criterio de puntaje de "5 habilidades" cuenta solo las técnicas.
- Los CV guardados o exportados con la v1.0.0 se siguen cargando: sus habilidades pasan a "técnicas".
- La plantilla Minimalista tiene márgenes, espacios e interlineado algo menores, para que el ejemplo quepa en una página.
- El criterio de puntaje de ciudad y enlace acepta LinkedIn o web.
- En la plantilla Clásica, las habilidades son texto separado por "·" en vez de recuadros.
- En el editor, las secciones opcionales vacías (Proyectos, Certificaciones, Idiomas) ocupan una sola línea con su botón "Añadir" y se despliegan al añadir la primera entrada.

### Corregido

- Los avisos sin botón de acción mostraban el texto "null" (p. ej. "Ejemplo cargado null").
- Al imprimir, la página 2 empezaba pegada al borde superior; ahora repite el margen de la plantilla.
- Una entrada muy larga saltaba entera a la página siguiente y dejaba media página en blanco; ahora se parte entre viñetas.

## [1.0.0] - 2026-10-16

Primera versión pública.

### Añadido

- Editor por secciones (datos personales, perfil, experiencia, educación y habilidades) con **vista previa en vivo**.
- **4 plantillas**: Clásica, Moderna, Minimalista y Ejecutiva, con color de acento personalizable.
- **Exportación a PDF** en A4 con la impresión nativa del navegador: texto real, seleccionable y legible por sistemas ATS.
- **Puntaje de calidad (0–100)** con consejos concretos para mejorar el CV.
- Validación de nombre, email, teléfono, web y fechas; los errores aparecen al salir del campo.
- Entradas reordenables, eliminación con **Deshacer** y habilidades como etiquetas sin duplicados.
- Guardado automático en `localStorage` e **importación/exportación en JSON**.
- Modo claro y oscuro, diseño responsivo desde 375 px y navegación completa con teclado.
- Atajo `Ctrl+P` / `Cmd+P` que valida el CV antes de imprimir.
- 36 tests automatizados con `node:test`, sin dependencias.

### Seguridad

- El contenido del usuario se inserta siempre como texto (sin `innerHTML`).
- Los enlaces solo aceptan `http` y `https`.
- Los datos importados se sanean y se limitan en tamaño antes de usarse.

[1.2.0]: https://github.com/Itsfavi0/cv-generator/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Itsfavi0/cv-generator/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Itsfavi0/cv-generator/releases/tag/v1.0.0
