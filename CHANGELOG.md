# Changelog

Todos los cambios relevantes de este proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

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

[1.0.0]: https://github.com/USUARIO/cv-generator/releases/tag/v1.0.0
