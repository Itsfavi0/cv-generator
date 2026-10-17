# Changelog

Todos los cambios relevantes de este proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Añadido

- Sección opcional de **Certificaciones**: nombre, entidad emisora, fecha y enlace a la credencial (el nombre enlaza a ella en el PDF).
- Sección opcional de **Idiomas** con niveles de una lista cerrada (Nativo y C2–A1 del MCER).
- **Habilidades en dos grupos**: técnicas/herramientas y blandas (opcionales, máx. 6), con subtítulos en el CV solo cuando hay de los dos tipos.
- El CV de ejemplo incluye certificaciones, idiomas y habilidades blandas, y sigue cabiendo en una página A4 con las 4 plantillas.

### Cambiado

- El criterio de puntaje de "5 habilidades" cuenta solo las técnicas.
- Los CV guardados o exportados con la v1.0.0 se siguen cargando: sus habilidades pasan a "técnicas".
- La plantilla Minimalista tiene márgenes y espacios entre secciones algo menores, para que el ejemplo quepa en una página.

### Corregido

- Los avisos sin botón de acción mostraban el texto "null" (p. ej. "Ejemplo cargado null").

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

[Sin publicar]: https://github.com/Itsfavi0/cv-generator/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Itsfavi0/cv-generator/releases/tag/v1.0.0
