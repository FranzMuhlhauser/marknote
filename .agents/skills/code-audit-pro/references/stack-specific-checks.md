# Pitfalls específicos del stack (más allá de seguridad)

La seguridad de Electron está cubierta en `electron-security.md`. Esto cubre bugs, código muerto y problemas de mantenibilidad típicos de cada pieza del stack.

## TipTap

- **Extensiones importadas pero no registradas** (o registradas dos veces en distintos archivos de configuración del editor) — candidato directo a código muerto o a bugs sutiles de comportamiento duplicado.
- **Listeners de `editor.on(...)` sin `editor.off(...)` correspondiente** al desmontar el componente — memory leak clásico en editores que se montan/desmontan (ej: al cambiar de documento).
- **Estado de React desincronizado del estado interno de TipTap**: si hay `useState` que intenta reflejar el contenido del editor y no está sincronizado correctamente con `onUpdate`, puede causar renders con contenido viejo o pérdida de cambios.
- **Comandos de editor ejecutados fuera de `editor.chain().focus()...run()`** de forma inconsistente — no es un bug de seguridad, pero sí una fuente típica de comportamiento errático (el editor pierde foco, comandos que no se aplican).

## KaTeX

- Verifica que el render de fórmulas no se ejecute en cada keystroke sin debounce si el documento es largo — problema de performance, no de lógica, pero vale la pena señalarlo si el resto del audit toca performance.
- Errores de parseo de LaTeX que no se capturan (`katex.render` puede lanzar excepción) y pueden tumbar el render de todo el documento en vez de solo esa fórmula.

## Mermaid

- Diagramas que se re-renderizan completos en cada cambio de estado no relacionado (falta de memoización) — impacto de performance notorio en documentos con varios diagramas.
- Igual que KaTeX: errores de sintaxis en un diagrama no deberían romper el render del resto del documento.

## markdown-it / Turndown (conversión Markdown ↔ HTML)

- **Configuración de plugins duplicada**: si hay más de un punto en el código que instancia `markdown-it` o `Turndown` con reglas custom, es candidato fuerte a duplicación — debería vivir en un único módulo de configuración compartido.
- **Reglas custom de Turndown que no tienen su contraparte en markdown-it** (o viceversa): esto produce round-trips con pérdida de información (editas, exportas a MD, reimportas, y algo cambió). Vale la pena señalarlo como bug funcional aunque no truene nada.
- Revisa si hay lógica de conversión repetida en distintos flujos (exportar, previsualizar, copiar) que podría unificarse.

## Exportación a PDF

- Si el PDF se genera a partir del HTML renderizado (vía `printToPDF` o similar), confirma que los estilos usados en pantalla (incluyendo fuentes para KaTeX/Mermaid) se carguen también en el contexto de impresión — es un problema muy común que el PDF salga con fórmulas o diagramas rotos porque el CSS de impresión no incluye esas fuentes/estilos.
- Revisa manejo de errores: si la generación del PDF falla (documento muy grande, fórmula rota), ¿el usuario recibe algún feedback o la app simplemente no hace nada?

## Vite + Electron (integración)

- Configuración de `base` / rutas de assets que funciona en dev pero se rompe en el build empaquetado (típico de apps Electron+Vite: rutas relativas vs. `file://`).
- Código específico de desarrollo (hot reload, flags de debug) que quedó activo condicionalmente mal — revisa que los `if (import.meta.env.DEV)` (o equivalente) realmente se excluyan del build de producción.

## React 19

- Uso de patrones pre-19 que ya no son necesarios (ej: `forwardRef` en casos donde React 19 ya no lo requiere, `useEffect` para sincronizar estado derivado que ahora se puede calcular directo en el render) — no es un bug, pero sí código que se puede simplificar.
- Si se usan Actions/`useActionState` o las nuevas APIs de formularios, confirma manejo de errores y estados de carga consistentes.
