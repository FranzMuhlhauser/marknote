# Marknote — Documentación del Proyecto

Editor Markdown WYSIWYG nativo para Windows, similar a Typora.
Construido con Electron + Vite + React 19 + TypeScript + TipTap.

---

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | React 19, TypeScript, Vite 5 |
| Editor | TipTap 2.x (ProseMirror) |
| Backend | Electron 33 (main process) |
| Build | electron-vite, electron-builder |
| Markdown | markdown-it, Turndown |
| Math | KaTeX |
| Diagrams | Mermaid |
| Export PDF | html2canvas + jsPDF |

---

## Requisitos

- Node.js v24.16.0+
- npm 11.13.0+
- Windows 11 (para empaquetar)

---

## Scripts Disponibles

```bash
npm run dev           # Entorno de desarrollo con hot reload
npm run build         # Compila todo (main + preload + renderer)
npm run package       # Compila + empaqueta para el SO actual
npm run package:win   # Compila + empaqueta para Windows (NSIS installer)
npm run typecheck     # npx tsc --noEmit (verificación de tipos)
```

---

## Estructura del Proyecto

```
marknote/
├── src/
│   ├── main/
│   │   └── index.ts              # Proceso principal de Electron (IPC handlers, ventana)
│   ├── preload/
│   │   └── index.ts              # Bridge de comunicación (contextBridge + ipcRenderer)
│   └── renderer/
│       └── src/
│           ├── App.tsx           # Componente principal (editor, menú, sidebars, lógica general)
│           ├── App.css           # Estilos globales (~1400 líneas, 6 temas, todos los componentes)
│           ├── env.d.ts          # Tipos globales (Window.api, etc.)
│           ├── extensions/
│           │   ├── index.ts          # Configuración de extensiones TipTap
│           │   ├── MathInline.tsx     # Nodo de fórmula matemática inline (KaTeX)
│           │   ├── MathBlock.tsx      # Nodo de bloque matemático (KaTeX)
│           │   ├── MermaidBlock.tsx   # Nodo de diagrama Mermaid
│           │   ├── CurrentLineHighlight.ts  # Plugin de resaltado de línea actual
│           │   ├── CodeBlock.tsx      # Bloque de código con copiar/colapsar (lowlight)
│           │   └── ResizableImage.tsx # Imagen con redimensionar, alinear y texto alternativo
│           ├── components/
│           │   ├── MenuBar.tsx        # Barra de menú (Archivo, Editar, Ver, Ayuda)
│           │   ├── Toolbar.tsx        # Barra de herramientas (formato, inserción, vista)
│           │   ├── TabBar.tsx         # Pestañas con arrastre y menú contextual
│           │   ├── FileExplorer.tsx   # Explorador de archivos con operaciones avanzadas
│           │   ├── SearchReplace.tsx  # Búsqueda y reemplazo
│           │   ├── CommandPalette.tsx # Paleta de comandos (Ctrl+Shift+P)
│           │   ├── Outline.tsx        # Esquema/índice del documento (H1-H3)
│           │   ├── Stats.tsx          # Estadísticas del documento
│           │   ├── StatusBar.tsx      # Barra de estado inferior
│           │   ├── Settings.tsx       # Panel de configuración (temas, plugins, atajos)
│           │   ├── WelcomeScreen.tsx  # Pantalla de bienvenida
│           │   └── TableContextMenu.tsx # Menú contextual para tablas
│           └── utils/
│               ├── markdown.ts     # Conversión MD ↔ HTML (markdown-it + Turndown)
│               ├── export.ts       # Exportación HTML y PDF
│               ├── stats.ts        # Cálculo de estadísticas del documento
│               └── themes.ts       # Gestión de temas (6 predefinidos + personalizado)
├── resources/
│   ├── icon.png                 # Ícono de la aplicación
│   └── icon.ico                 # Ícono para Windows
├── documents/
│   ├── DOCUMENTACION.md         # Este archivo
│   ├── Prompt Maestro - Desarrollo de un Editor Markdown WYSIWYG Tipo Typora.md
│   └── Prompt Maestro - Diseño y Desarrollo.md  # Documento de diseño original
├── dist-electron/               # Artefactos de empaquetado (ignorado por git)
├── electron-builder.yml         # Configuración de empaquetado
├── package.json
├── electron.vite.config.ts
└── tsconfig*.json
```

---

## Layout General

La aplicación sigue un diseño de **3 columnas**:

```
┌─────────────────────────────────────────────────────┐
│  [📝 Documento ●] [Archivo] [Editar] [Ver] [Ayuda]    │
│                                    [⬇ vX.X.X]   │
│  (barra unificada — título + menú + actualización)  │
├─────────────────────────────────────────────────────┤
│  Toolbar: Archivo | Edición | Formato | Vista       │
├─────────────────────────────────────────────────────┤
│  TabBar: [README.md] [Dia1.md] [Curso.md]           │
├──────────┬──────────────────────────┬────────────────┤
│          │                          │                │
│  Sidebar │     Editor (960px max)   │  Índice H1-H3 │
│  Izq.    │                          │  (Outline)     │
│  (240px) │    Contenido WYSIWYG     │  Stats         │
│          │                          │                │
│ Favoritos│                          │                │
│ Recientes│                          │                │
│ Proyecto │                          │                │
│ Papelera │                          │                │
│          │                          │                │
├──────────┴──────────────────────────┴────────────────┤
│  WYSIWYG | UTF-8 | Línea 45 | Col 12 | 2300 palabras │
│                                         | Guardado ✓ │
└─────────────────────────────────────────────────────┘
```

---

## Funcionalidades Implementadas

### Accesibilidad y UI
- `:focus-visible` global con `outline: 2px solid var(--accent)` para navegación por teclado
- Transiciones suaves (`background 0.15s`) en botones de menú y pestañas
- Scrollbars estilizadas en `.tabbar`, `.command-list`, `.settings-body`
- Las transiciones y animaciones respetan `prefers-reduced-motion`

### Layout y Navegación
- **Layout 3 columnas**: Explorador izquierdo (240px) + Editor central + Índice derecho (Outline)
- **Barra de menú unificada** (TitleBar + Menú): muestra título del documento + indicador de modificado + menús Archivo, Editar, Ver, Ayuda — todos con atajos de teclado. Incluye botón de actualización cuando hay nueva versión. La zona del título funciona como agarre para arrastrar la ventana. Los comandos de inserción (tabla, imagen, video, etc.) se acceden desde la barra de herramientas, la paleta de comandos (Ctrl+Shift+P) o el menú slash (/).
- **Barra de herramientas** agrupada en 6 categorías: Archivo, Edición, Formato, Estructura, Contenido, Vista. Se quitó el botón de pantalla completa del toolbar; el toggle vista fuente se movió al toolbar
- **Sistema de pestañas** (TabBar) con soporte para múltiples documentos abiertos simultáneamente
- **Reordenar pestañas** por arrastrar y soltar (HTML5 DnD), con indicador visual de posición
- **Menú contextual en pestañas**: clic derecho permite Cerrar, Cerrar otros, Cerrar a la derecha, Cerrar todos, Cerrar guardados
- **Barra de estado** inferior con: modo fijo "WYSIWYG" (se eliminó el toggle showSource), UTF-8, línea, "Columna" (nombre completo, no abreviado), palabras, tiempo de lectura, estado de guardado
- **Pantalla de bienvenida** con título "📝 Bienvenido a Marknote", botones Crear Documento / Abrir Documento, cuadrícula de atajos de teclado (Ctrl+N/O/S/Shift+P/F/F11) y archivos recientes

### Editor
- Edición WYSIWYG con TipTap (StarterKit, Underline, Link, Typography, Highlight, TextAlign)
- Ancho máximo de 960px, contenido centrado, padding 48px 64px
- Párrafos con margin 1em y letter-spacing 0.01em para mejor legibilidad
- Scroll suave, cursor visible, resaltado de línea actual (CurrentLineHighlight)
- Vista fuente Markdown con toggle 📄/📝 (Escape vuelve a WYSIWYG)
- La vista fuente hereda los mismos estilos que WYSIWYG (padding, font-size, max-width, caret-color)
- Arrastrar y soltar imágenes desde el sistema de archivos
- Tipografía agradable para largas sesiones de escritura

### Formato
- Negrita (Ctrl+B), cursiva (Ctrl+I), subrayado (Ctrl+U), tachado
- Resaltado (highlight), código inline, enlaces
- Encabezados H1-H6
- Listas ordenadas, desordenadas y de tareas (con checkbox)
- Citas (blockquote), bloques de código, líneas horizontales
- Alineación de texto (izquierda, centro, derecha)
- Tablas con soporte completo (insertar, eliminar filas/columnas, combinar/dividir celdas)

### Bloques de Código
- **Bloques de código con copiar y colapsar**:
  - Botón **Copy** con feedback visual ("✓ Copied")
  - Botón **Collapse** (▸/▾) para colapsar/expandir el bloque
  - Click en el lenguaje para editarlo inline (cambiar lenguaje de resaltado)
  - Resaltado de sintaxis via lowlight (compatible con todos los lenguajes comunes)

### Imágenes
- **Inserción de imágenes** con selector de archivos nativo o drag & drop
- **Redimensionar** con 3 handles de arrastre (esquina SE, borde E, borde S)
- **Alinear** izquierda/centro/derecha con toolbar flotante
- **Texto alternativo** (alt): doble click sobre la imagen o botón en toolbar
- **Dimensiones numéricas** precisas (width × height)
- Toolbar flotante con opciones de alineación, redimensionar y alt text

### Matemáticas (KaTeX)
- Fórmulas inline: `$E = mc^2$`
- Bloques matemáticos: `$$\sum_{n=1}^{\infty} \frac{1}{n^2}$$`
- Renderizado en tiempo real con KaTeX
- Nodo personalizado con ReactNodeViewRenderer

### Diagramas (Mermaid)
- Inserción de diagramas desde el toolbar o paleta de comandos
- Editor de código con vista previa renderizada (SVG)
- Soporte para todos los tipos de diagrama: flowchart, sequence, class, state, gantt, pie, etc.
- Botón para editar/actualizar el código del diagrama

### Menú Contextual en Tablas
- Aparece al hacer **clic derecho** sobre cualquier celda de tabla
- Opciones: insertar fila arriba/abajo, insertar columna izquierda/derecha
- Eliminar fila, eliminar columna, eliminar tabla completa
- Combinar celdas (merge) y dividir celda (split)
- Integrado vía `handleDOMEvents.contextMenu` del editor

### Archivos
- **Nuevo documento** en blanco (Ctrl+N)
- **Abrir archivo** .md del equipo (Ctrl+O)
- **Guardar** / **Guardar como** (Ctrl+S, Ctrl+Shift+S)
- **Autoguardado** cada 30 segundos si hay cambios sin guardar
- **Archivos recientes** (localStorage, últimos 10)
- **Explorador de archivos lateral** con secciones: Favoritos ★, Recientes 🕐, Proyecto 📂, Papelera 🗑
- Las sidebars tienen `flex-shrink: 1` y `min-width: 160px` para responsive; el editor central tiene `min-width: 300px` y `flex: 1 1 400px`
- El menú contextual del explorador tiene `max-width: 50vw` para no desbordar la ventana
- El explorador muestra mensaje de error visual (color `--error`) si falla la lectura de archivos
- **Favoritos**: marcar/desmarcar archivos con estrella, persistido en localStorage
- **Operaciones avanzadas del explorador**:
  - Crear archivo .md inline
  - Crear carpeta inline
  - Renombrar archivos (clic derecho → input inline)
  - Duplicar archivos (copia numerada automática)
  - Eliminar archivos (con confirmación)
  - Arrastrar y soltar para mover archivos entre secciones
  - Menú contextual en cada archivo: Renombrar, Duplicar, Eliminar

### Búsqueda y Reemplazo
- Búsqueda en el documento (Ctrl+F o Ctrl+H)
- Contador de coincidencias
- Reemplazar una coincidencia o todas
- Navegación entre resultados (flechas)
- **Coincidencias resaltadas** con decoraciones ProseMirror (color accent para coincidencias, naranja para la activa)
- **ReplaceAll transaccional**: usa `tr.replaceWith()` en orden inverso preservando el historial de undo

### Paleta de Comandos
- Ctrl+Shift+P abre paleta con 20+ comandos (todos los formatos, inserciones, acciones)
- Navegación por teclado (flechas + Enter)
- Filtrado por texto de búsqueda
- Comandos: Negrita, Cursiva, Subrayado, Tachado, Encabezados 1-3, Listas, Citas, Código, Tabla, Fórmulas, Mermaid, Línea horizontal, Enlace, Imagen
- **Fix**: el shortcut de Negrita en la paleta era incorrectamente `Ctrl+N` (conflicto con Nuevo), corregido a `Ctrl+B`

### Temas
- **6 temas predefinidos**: Claro, Oscuro, Nord, Dracula, Solarized, GitHub
- **Tema personalizado**: editor visual en Configuración con selectores de color para fondo, texto, borde, acento y fondo de código
- Los temas se persisten en localStorage y se restauran al cargar
- Botón ◐ en la barra de herramientas para ciclar temas rápidamente
- Selector de temas en Configuración con botones de selección visual
- **Variables CSS**: 8 variables globales (`--success`, `--warning`, `--error`, `--error-bg`, `--success-bg`, `--success-text`, `--mark-bg`) reemplazan colores hardcodeados
- El `--hover` en tema personalizado usa `color-mix(in srgb, bg, text 8%)` para adaptarse automáticamente

### Modo Enfoque
- Atenúa sidebars, barra de herramientas, menú, pestañas, titlebar y barra de estado
- Los elementos atenuados reaparecen al pasar el cursor sobre ellos
- Las sidebars en modo foco tienen opacidad 0.35, reaparecen al hover
- El panel de estadísticas (Stats) también se atenúa en modo foco
- **Clase `focus-mode` única**: se aplica solo en `.app` (se eliminó la duplicada en `<html>`)
- Toggle desde menú Ver o botón ◎ en toolbar

### Esquema / Índice (Outline)
- Título "📖 Documento"
- Lista de encabezados H1-H3 del documento
- Estado vacío: "Sin encabezados" + sugerencia "💡 Usa H1, H2 y H3 para generar el índice."
- Navegación clickeable a cada sección

### Pantalla Completa
- Atajo F11 (integrado con IPC Electron)
- Toggle desde menú Ver o botón ⛶ en toolbar
- Ventana sin bordes del sistema operativo

### Configuración
- Panel modal accesible desde menú Archivo > Configuración o botón ⚙ en toolbar
- Secciones:
  - **Apariencia**: selector de temas con botones, editor de tema personalizado (6 colores)
  - **Editor**: slider de tamaño de fuente (14-22px), toggle de autoguardado
  - **Plugins**: lista de todos los plugins activos con nombre, descripción y estado
  - **Atajos**: tabla de atajos de teclado disponibles

### Estadísticas
- Panel lateral con: caracteres, palabras, líneas, párrafos, encabezados, tiempo de lectura
- Toggle desde menú Ver > Estadísticas

### Exportación
- **Exportar a HTML**: descarga como archivo .html con estilos básicos inline
- **Exportar a PDF**: renderiza el editor con html2canvas, genera PDF con jsPDF
- Disponible desde menú Archivo

### Actualizaciones
- Verificación automática al iniciar mediante `electron-updater`
- Botón "⬇ Descargar vX.X.X" en la barra de menú si hay versión nueva
- **Descarga en segundo plano** con barra de progreso porcentual
- Botón "🔄 Reiniciar" cuando la descarga está completa
- Al salir de la app, instala automáticamente la actualización
- Configuración `publish` en `electron-builder.yml` apuntando a GitHub Releases
- El artefacto de release (Setup.exe) se publica en GitHub para que `electron-updater` lo detecte

### Traducción
- Interfaz completa en español (menús, tooltips, placeholders, labels)
- Traducido: CommandPalette (20+ comandos), Outline, Stats, Settings, WelcomeScreen, StatusBar, FileExplorer, TableContextMenu, TabBar

---

## IPC Handlers (Proceso Principal)

| Canal | Descripción |
|---|---|
| `dialog:open` | Abre diálogo para seleccionar archivo .md |
| `dialog:save` | Guarda archivo (con diálogo si no hay ruta) |
| `dialog:openFolder` | Abre diálogo para seleccionar carpeta |
| `folder:listFiles` | Lista archivos .md recursivamente en una carpeta |
| `file:read` | Lee contenido de un archivo |
| `file:write` | Escribe contenido en un archivo |
| `file:createFolder` | Crea una carpeta |
| `file:rename` | Renombra un archivo/carpeta |
| `file:duplicate` | Duplica un archivo (copia numerada) |
| `file:delete` | Elimina un archivo |
| `file:move` | Mueve un archivo a otra ubicación |
| `update:startDownload` | Inicia descarga de nueva versión (electron-updater) |
| `update:install` | Reinicia e instala la actualización descargada |
| `window:toggleFullscreen` | Alterna pantalla completa |
| `app:quit` | Cierra la aplicación |

### Eventos Main → Renderer

| Canal | Descripción |
|---|---|
| `update:status` | Envía estado de la actualización (`checking`, `available`, `not-available`, `downloading`, `downloaded`, `error`) |
| `file:open` | Envía ruta de archivo .md para abrir (desde segunda instancia, línea de comandos o archivo asociado) |

---

## Extensiones TipTap

| Extensión | Propósito |
|---|---|
| StarterKit | Base del editor (párrafos, encabezados, listas, history, etc.) |
| Placeholder | Texto placeholder "Start writing..." |
| Underline | Formato subrayado |
| Link | Enlaces clicables |
| Typography | Reemplazos tipográficos (comillas, guiones, etc.) |
| TaskList + TaskItem | Listas de tareas con checkbox |
| Table + TableRow + TableCell + TableHeader | Tablas completas con resize |
| Highlight | Resaltado de texto |
| TextAlign | Alineación de párrafos |
| CodeBlock (custom) | Bloques de código con lowlight, copiar y colapsar |
| ResizableImage (custom) | Imágenes con redimensionar, alinear y alt text |
| MathInline + MathBlock (custom) | Fórmulas KaTeX inline y en bloque |
| MermaidBlock (custom) | Diagramas Mermaid |
| CurrentLineHighlight (custom) | Resaltado de la línea activa en el editor |

---

## Atajos de Teclado

| Atajo | Acción |
|---|---|
| Ctrl+N | Nuevo documento |
| Ctrl+O | Abrir archivo |
| Ctrl+S | Guardar |
| Ctrl+Shift+S | Guardar como |
| Ctrl+W | Cerrar pestaña activa |
| Ctrl+Tab / Ctrl+Shift+Tab | Siguiente / anterior pestaña |
| Ctrl+Z | Deshacer |
| Ctrl+Y | Rehacer |
| Ctrl+F / Ctrl+H | Búsqueda y reemplazo |
| Ctrl+Shift+P | Paleta de comandos |
| Ctrl+B | Negrita |
| Ctrl+I | Cursiva |
| Ctrl+U | Subrayado |
| Ctrl+1/2/3 | Encabezado H1/H2/H3 |
| F11 | Pantalla completa |
| Escape | Cerrar diálogos y menús contextuales; salir de vista fuente |

---

## Empaquetado para Windows

```bash
npm run package:win
```

Genera en `dist-electron/`:
- `Marknote-<version>-Setup.exe` — Instalador NSIS (~83 MB)
- `win-unpacked/Marknote.exe` — Versión portátil

El instalador incluye:
- Wizard de instalación con elección de directorio
- Acceso directo en escritorio y menú Inicio
- Ícono personalizado

---

## Release en GitHub

Para crear un nuevo Release:

1. Actualizar `version` en `package.json`
2. `npm run package:win`
3. Commit + push + tag (ej. `v0.3.0`)
4. Crear GitHub Release con el `.exe` adjunto y el tag correspondiente
5. `electron-updater` detectará automáticamente la nueva versión en los clientes existentes

---

## Historial de Versiones

| Versión | Fecha | Cambios |
|---|---|---|
| v0.3.0 | 2026-06-18 | TitleBar+MenuBar unificados, editor 960px + padding ampliado, Outline mejorado, WelcomeScreen con atajos, StatusBar fijo "WYSIWYG" + "Columna", Ctrl+H/W/Tab, resaltado de búsqueda con decoraciones ProseMirror, replaceAll transaccional, focus-mode en Stats + fix clase duplicada, hover con color-mix, vista fuente consistente, 8 variables CSS, sidebars responsives, menú contextual clamp, errores en explorador, Escape→source view, fix shortcut Negrita Ctrl+N→Ctrl+B, transiciones, scrollbars, :focus-visible, actualización automática con electron-updater (descarga + progreso + reinicio) |
| v0.2.0 | 2026-06-18 | Menú contextual tablas, bloques código copiar/colapsar, imágenes redimensionar/alinear/alt, explorador avanzado (crear, renombrar, duplicar, eliminar, arrastrar), temas personalizados, sección plugins, traducción completa a español, reordenar pestañas, menú contextual pestañas |
| v0.1.1 | 2026-06-18 | Nuevo doc en blanco, fix open file |
| v0.1.0 | 2026-06-18 | Versión inicial: editor WYSIWYG, tablas, KaTeX, Mermaid, export, file explorer, source view |
| v0.3.1 | 2026-06-19 | Corrección flushSync (closeTab, closeOthers, closeRight, closeSaved), Table resize desactivado (`resizable: false`), Table header sort removido, SlashCommand y VideoBlock agregados, TableSizePicker, BoldItalic, TableSort, single instance lock, file association, markdown-it plugins extendidos, DEFAULT_MD template, docs actualizadas |

---

## Metodología de Desarrollo — Prompt Maestro

Se sigue estrictamente el método **Prompt Maestro**, un proceso de 6 fases para cada tarea:

### Fase 1 — Análisis
- Explicar el problema y el objetivo
- Identificar riesgos y dependencias
- Leer el código relevante para entender el estado actual

### Fase 2 — Alternativas
Proponer al menos 3 soluciones, cada una con:
- Ventajas, desventajas, complejidad, mantenibilidad

### Fase 3 — Decisión
Seleccionar la solución más simple que cumpla los requisitos y justificar la elección.

### Fase 4 — Diseño
Generar arquitectura, flujo de datos, estructura de archivos antes de escribir código.

### Fase 5 — Implementación
Escribir únicamente el código estrictamente necesario, de forma incremental:
- Un cambio por vez, validar antes de continuar
- Sin código muerto, sin sobreingeniería, sin abstracciones prematuras
- Sin comentarios en el código

### Fase 6 — Revisión Crítica
Antes de finalizar, responder:
- ¿Código innecesario? ¿Archivos que sobran? ¿Dependencias que eliminar?
- ¿Se puede simplificar? ¿Mejorar legibilidad?
- ¿Se implementó algo que aún no se necesita?
- Si algo sobra, refactorizar antes de entregar.

### Reglas Absolutas
- **Piensa antes de programar**: nunca escribir código sin antes analizar, proponer alternativas y decidir
- **El mejor código es el que no se escribe**: preguntar si es realmente necesario antes de cada línea
- **Buscar siempre la solución más simple**: menos archivos, menos funciones, menos líneas
- **Priorización**: Legibilidad > Mantenibilidad > Simplicidad > Escalabilidad > Rendimiento
- **YAGNI**: no implementar nada que no se necesite hoy
- **Prohibido**: sobreingeniería, optimización prematura, código "por si acaso", patrones innecesarios

### Estructura de Respuesta
Cada interacción sigue este formato:

1. **Objetivo** — qué se va a lograr
2. **Análisis** — contexto y exploración del código
3. **Alternativas** — 3+ opciones con pros/contra
4. **Solución Elegida** — justificación
5. **Arquitectura** — flujo y estructura
6. **Plan de Implementación** — pasos concretos
7. **Código** — solo lo necesario
8. **Revisión Crítica** — verificación de calidad
9. **Próximos Pasos** — qué sigue

### Verificación
```bash
npx tsc --noEmit   # type-check
npm run build      # compilación completa
```
Solo si ambos pasan sin errores se considera terminado.

---

## Notas Técnicas

- KaTeX CSS se importa globalmente en App.tsx: `import 'katex/dist/katex.min.css'`
- KaTeX y Mermaid se cargan dinámicamente con `import()` en useEffect
- El estado del editor se maneja con `TabDoc[]` (array de pestañas con id, filePath, content, modified)
- La conmutación entre pestañas usa un flag `switchingTab` para evitar que `onUpdate` sobrescriba el contenido
- Los temas se manejan con variables CSS personalizadas (`--bg`, `--text`, `--accent`, etc.) y atributo `data-theme` en `<html>`
- El tema personalizado se guarda en `localStorage` como JSON con 6 valores de color
- La comunicación main ↔ renderer usa `contextBridge` + `ipcRenderer.invoke`
- Las extensiones personalizadas (CodeBlock, ResizableImage, MathInline, MathBlock, MermaidBlock) usan `ReactNodeViewRenderer` para renderizado React
- El arrastre de pestañas usa HTML5 Drag & Drop API con indicadores `::before`/`::after` vía CSS
- El menú contextual de tablas detecta clics en nodos `table` mediante `view.posAtCoords` + `doc.nodesBetween`
- El icono `.ico` se genera desde PNG con `png2icons` (no usar `png-to-ico`)

---

## Extensiones TipTap (Completas)

| Extensión | Propósito |
|---|---|
| StarterKit | Base del editor (párrafos, encabezados, listas, history, etc.) |
| Placeholder | Texto placeholder "Start writing..." |
| Underline | Formato subrayado |
| Link | Enlaces clicables |
| Typography | Reemplazos tipográficos (comillas, guiones, etc.) |
| TaskList + TaskItem | Listas de tareas con checkbox |
| Table + TableRow + TableCell + TableHeader | Tablas (resize desactivado, sort por click removido) |
| Highlight | Resaltado de texto |
| TextAlign | Alineación de párrafos |
| CodeBlock (custom) | Bloques de código con lowlight, copiar y colapsar |
| ResizableImage (custom) | Imágenes con redimensionar, alinear y alt text |
| MathInline + MathBlock (custom) | Fórmulas KaTeX inline y en bloque |
| MermaidBlock (custom) | Diagramas Mermaid |
| CurrentLineHighlight (custom) | Resaltado de la línea activa en el editor |
| VideoBlock (custom) | Video embebido (YouTube/URL) con redimensionar y alinear |
| TableSort (custom) | Plugin de decoraciones para indicador de ordenamiento en tablas |
| BoldItalic (custom) | Regla de entrada/salida para `***text***` (bold + italic) |
| SlashCommand (custom) | Menú emergente al tipear `/` con opciones de inserción |

---

## Funcionalidades Implementadas (Extendido)

### Video Embebido
- Inserción de videos desde toolbar o paleta de comandos
- Soporte para YouTube (URL directa o compartida) y URLs de video genéricas
- Redimensionar con 3 handles de arrastre (esquina SE, borde E, borde S)
- Alinear izquierda/centro/derecha con toolbar flotante
- Prompt para ingresar URL al insertar

### Menú Slash Command
- Al tipear `/` en el editor se abre un popup con opciones de inserción
- Soporta: Párrafo, H1-H3, Lista, Cita, Código, Tabla, Imagen, Fórmula, Mermaid, Video, Línea horizontal
- Filtrado por texto de búsqueda mientras se escribe
- Navegación por teclado (flechas + Enter)

### Table Size Picker
- Al insertar tabla desde el toolbar, se muestra un grid selector de celdas (10×10)
- El usuario selecciona visualmente filas × columnas
- Se inserta la tabla con las dimensiones elegidas

### BoldItalic (`***text***`)
- Soporte para la sintaxis Markdown `***text***` que produce texto negrita + cursiva
- Implementado como inputRule + pasteRule personalizados

### Markdown-it Extended
- Plugins adicionales en `markdown.ts`: `markdown-it-sub` (subíndice), `markdown-it-sup` (superíndice), `markdown-it-footnote` (notas al pie), `markdown-it-mark` (resaltado), `markdown-it-ins` (insertado), `markdown-it-kbd` (teclado)
- Turndown con reglas personalizadas para: bloques de código, task items, tachado, subíndice, superíndice, imágenes con alt+width+height+align

### Default Content (DEFAULT_MD)
- Nuevos documentos se crean con un contenido inicial template que incluye ejemplos de: encabezados, formato, listas, bloque de código, tabla, matemáticas, diagrama Mermaid

### File Association / Single Instance
- `app.requestSingleInstanceLock()` para evitar múltiples instancias
- Segunda instancia envía evento `file:open` a la instancia existente
- Soporte para `open-file` (macOS) y argumento de línea de comandos (`.md` file)
- Renderer escucha `onOpenFile` desde preload para abrir archivo al recibir el evento

### Markdown Source Editor
- Vista fuente implementada con `<textarea>` sincronizado al estado del tab
- Al cambiar a vista fuente: `editor.setEditable(false)`, se muestra textarea con contenido raw
- Al cambiar a WYSIWYG: se parsea el texto del textarea y se vuelca al editor con `editor.commands.setContent()`
- Atajo Escape vuelve a WYSIWYG
- La vista fuente hereda estilos del editor (padding, font-size, max-width, caret-color)

### Toggle Auto-save
- En Settings > Editor: checkbox de autoguardado
- Controla el intervalo de `setInterval` de 30s en App.tsx

### lucide-react Icons
- La Toolbar usa `lucide-react` para iconografía (FileText, Bold, Italic, etc.)

---

## Funcionalidades en Desarrollo

- Sistema de plugins (extensiones cargables dinámicamente)
- Temas comunitarios (importar/exportar temas)
- Buscador de archivos en el explorador
- Atajo Ctrl+Tab para navegación entre pestañas

---

## Mejoras de Interfaz de Usuario (Aplicadas)

- **Sidebars responsives**: `flex-shrink: 1`, `min-width: 160px`; editor central `min-width: 300px`, `flex: 1 1 400px`
- **Menú contextual del explorador**: `max-width: 50vw` para no desbordar
- **Mensaje de error visual** en explorador cuando falla lectura de archivos
- **Transiciones suaves** en botones de menú y pestañas (`background 0.15s`)
- **`:focus-visible`** global con `outline: 2px solid var(--accent)`
- **Scrollbars estilizadas** en `.tabbar`, `.command-list`, `.settings-body`
- **`prefers-reduced-motion`** respetado en animaciones

---

## Correcciones y Bugs Solucionados

### flushSync Error al Cerrar Pestañas
- **Síntoma**: Error `flushSync was called from inside a lifecycle method` al cerrar pestañas (closeTab, closeOthers, closeRight, closeSaved)
- **Causa raíz**: `loadTabIntoEditor()` (que llama a `editor.commands.setContent()`) se invocaba dentro del updater de `setTabs(prev => ...)`. Los updaters de `setState` se ejecutan durante la fase de render de React; `setContent` dispara una transacción de ProseMirror que crea NodeViews, y el constructor de `ReactRenderer` (`@tiptap/react`) llama a `ReactDOM.flushSync()` para montar el componente React — pero `flushSync` no puede llamarse durante el render.
- **Fix**: Mover todos los side effects (`setActiveTabId`, `loadTabIntoEditor`, `setShowWelcome`, `editor?.commands.clearContent()`) fuera del updater de `setTabs`, a un `useEffect` o a la función contenedora. Cuatro funciones corregidas en `App.tsx`.

### Estado Obsoleto del Editor tras Cerrar Todo
- **Síntoma**: Tras cerrar todas las pestañas, al hacer clic en el editor quedaba un loop infinito de `Component does not exist` con montones de renders.
- **Causa raíz**: El editor se montaba sin tabs activos y sin limpiar su contenido anterior.
- **Fix**: Asegurar `showWelcome` se active y `editor.commands.clearContent()` se llame fuera del updater de `setTabs`.

### Tabla: Resize Interfería con Edición
- **Síntoma**: Las tablas tenían handles azules de redimensionamiento que interferían con clics y selección de celdas.
- **Causa raíz**: `Table.configure({ resizable: true })` activaba el plugin `columnResizing` de `@tiptap/extension-table`, que inyecta `<colgroup>`, `<col>` con estilos inline, y manejadores de eventos para redimensionar.
- **Fix**: Cambiar a `resizable: false` en `src/renderer/src/extensions/index.ts`.

### Tabla: Click en Header Ordenaba sin Control
- **Síntoma**: Cada clic en una celda `<th>` ordenaba la tabla, impidiendo escribir en celdas de encabezado o incluso seleccionar texto en tablas de una sola fila.
- **Causa raíz**: `handleClickOn` para `tableHeader` que devolvía `true` (consumiendo el evento) cuando `childCount < 2` y ejecutaba `sortTable`.
- **Fix**: Eliminar el bloque `handleClickOn` completo (líneas 76-111) y su import `tableSortKey` en `App.tsx`.

### Atajo Negrita en Paleta de Comandos
- **Síntoma**: La paleta mostraba `Ctrl+N` para Negrita, conflicto con Nuevo Documento.
- **Fix**: Corregido a `Ctrl+B`.

### Modo Enfoque: Clase Duplicada
- **Síntoma**: `focus-mode` se aplicaba tanto en `.app` como en `<html>`.
- **Fix**: Eliminar la duplicada en `<html>`, mantener solo en `.app`.

### Menú Contextual: overflow
- **Síntoma**: El menú contextual del explorador se desbordaba horizontalmente.
- **Fix**: Agregar `max-width: 50vw` al menú contextual.

---

## Problemas Conocidos

- **TabContextMenu detecta solo tablas del editor activo**: El menú contextual usa `view.posAtCoords` y funciona correctamente, pero no hay atajo de teclado para tablas.
- **Source view ↔ WYSIWYG pierde sintaxis no compatible**: Elementos que Turndown no puede convertir (como atributos HTML avanzados en Markdown) pueden perderse al alternar entre vistas.
- **El modo foco atenúa Stats**: Por diseño, pero Stats no reaparece al hover a diferencia de sidebars (mejora menor pendiente).
- **Autoguardado sobrescribe sin confirmación**: Si el archivo se modificó externamente, el autoguardado lo sobrescribe.
- **Decoraciones de búsqueda (SearchReplace) no se limpian al cerrar**: Quedan decoraciones en el editor hasta que se abre una nueva búsqueda (no visible para el usuario pero sí en el estado interno de ProseMirror).
- **TabView (vista fuente) en pestaña nueva**: Al abrir vista fuente y luego cambiar de pestaña, el textarea no se sincroniza correctamente si hubo cambios sin guardar.

---

## Arquitectura del Proyecto

### Flujo de Datos

```
Electron Main Process (src/main/index.ts)
    │
    ├── IPC Handlers (dialog:*, file:*, folder:*, window:*, update:*)
    │
    ├── contextBridge (src/preload/index.ts)
    │       └── expone api.* en window.api
    │
    └── Renderer (src/renderer/)
            │
            ├── App.tsx (estado global, editor, layout)
            │   ├── tabs: TabDoc[] (array de pestañas)
            │   ├── activeTabId: string
            │   ├── showWelcome: boolean
            │   ├── showSource: boolean (vista fuente)
            │   ├── showSearch: boolean, showCommandPalette, showSettings
            │   ├── focusMode: boolean
            │   ├── theme: string, customTheme
            │   └── autoSave: boolean
            │
            ├── components/ (UI)
            ├── extensions/ (TipTap personalizadas)
            └── utils/ (markdown, export, themes, stats, prompt)
```

### Manejo de Estado del Editor

1. Cada pestaña tiene: `{ id, filePath?, content, modified, savedContent }`
2. Al cambiar de pestaña: se guarda el contenido actual en `tabs[].content`, se carga el nuevo tab con `loadTabIntoEditor`
3. `onUpdate` del editor escribe en `tabs[].content` pero un flag `switchingTab` evita sobrescribir durante cambios de pestaña
4. `onSelectionUpdate` actualiza línea/columna/palabras en la barra de estado

### Ciclo de Vida del Editor

- `editor` se crea con `useEditor()` de TipTap
- Cuando no hay tabs activos y no hay `showWelcome`, se limpia el contenido con `editor.commands.clearContent()`
- La vista fuente reemplaza el editor con `<textarea>`; al volver, se parsea el markdown de vuelta

---

## Próximos Pasos

1. **Testing end-to-end**: Verificar todas las funcionalidades (tablas, imágenes, videos, mermaid, katex, búsqueda, pestañas, modo foco, temas) tras las correcciones
2. **Resolver problemas conocidos**: Especialmente sincronización de vista fuente al cambiar de pestaña y limpieza de decoraciones de búsqueda
3. **Sistema de plugins**: Arquitectura para extensiones cargables dinámicamente
4. **Temas comunitarios**: Importar/exportar temas como archivos JSON
5. **Ctrl+Tab**: Navegación por pestañas con orden de uso reciente (MRU) — *Ya implementado básico, pendiente MRU*
6. **Buscador de archivos**: En el explorador lateral

---

## Diferencias entre Documentación e Implementación Real

| # | Documentación dice | Realidad | Estado |
|---|---|---|---|
| 1 | `markdown.ts` usa plugins `markdown-it-sub`, `markdown-it-sup`, `markdown-it-footnote`, `markdown-it-mark`, `markdown-it-ins`, `markdown-it-kbd` | `markdown.ts:4` — solo `new MarkdownIt({...})` sin plugins adicionales. Esas 6 dependencias **no existen** en `package.json`. | ❌ Doc incorrecta |
| 2 | `package.json` version = v0.3.1 | `"version": "0.1.2"` — desactualizada respecto al historial documentado | ⚠️ Desincronizado |
| 3 | "Toggle Auto-save" en Settings controla el intervalo de 30s | `App.tsx:241-245`: el `useEffect` de autoguardado se ejecuta **siempre** que `activeTab?.modified` es true, sin verificar la preferencia del usuario | 🐛 Bug |
| 4 | Workspace folder se persiste entre sesiones | No hay persistencia (`localStorage` ni archivo de config), se pierde al reiniciar | ⚠️ No implementado |
| 5 | `lang="en"` en HTML (doc implícito) | `index.html:3`: `lang="en"` pero toda la UI está en español | ⚠️ Inconsistencia |
| 6 | Ctrl+Tab listado como [ ] en Roadmap (README) | `App.tsx:480-489` — Ctrl+Tab **ya está implementado** (navegación circular) | ⚠️ Roadmap desactualizado |
| 7 | Menú contextual tablas como [ ] en Roadmap (README) | Implementado desde v0.2.0 | ⚠️ Roadmap desactualizado |
| 8 | SearchReplace decoraciones "no se limpian al cerrar" (problema conocido) | El plugin se registra/desregistra con `useEffect` en `SearchReplace.tsx`; las decoraciones se limpian al desmontar | ✅ Resuelto |
| 9 | `@tiptap/extension-image` como dependencia | No se usa en ningún import; `ResizableImage.tsx` extiende el nodo `image` con nombre propio | ♻️ Innecesaria |

---

## Observaciones de Arquitectura (2026-06-22)

### Puntos Fuertes
- **Separación clara** Main ↔ Preload ↔ Renderer con `contextBridge`
- **Estado centralizado** en `App.tsx` con `TabDoc[]` minimiza la complejidad del flujo de datos
- **Extensiones TipTap personalizadas** con `ReactNodeViewRenderer` bien encapsuladas
- **Sistema de temas basado en CSS variables** permite 6 temas + personalizado sin recarga
- **FileExplorer con 4 secciones** y operaciones CRUD completas vía IPC

### Deuda Técnica
- **App.tsx monolítico** (677 líneas): mezcla estado global, lógica de editor, handlers de teclado, y layout JSX. Dificulta testing y mantenimiento.
- **CSS global** (~1400 líneas sin revisar): estilos planos sin modules, 6 temas inline. Riesgo de colisiones y dificultad para escalar.
- **Flujo de pestañas frágil**: el flag `switchingTab` con `setTimeout(50ms)` es un hack temporal. Podría fallar en condiciones de latencia alta.
- **SlashCommand usa `createRoot()` directo** en vez de integración React estándar, potencial conflicto con StrictMode.
- **Auto-save toggle sin efecto**: la UI muestra el control pero el backend no lo respeta.
- **Tema personalizado duplica lógica** entre `themes.ts:saveTheme()` y `Settings.tsx:applyCustomTheme()` con el mismo conjunto de propiedades CSS.

### Riesgos de Modificación
1. **App.tsx**: Cualquier cambio en el sistema de pestañas requiere probar todas las funciones de cierre (closeTab, closeOthers, closeRight, closeAll, closeSaved) por el historial de bugs `flushSync`.
2. **Extensiones NodeView**: Usan `ReactNodeViewRenderer` que crea `ReactRenderer` internamente; cambios en el ciclo de vida pueden reintroducir errores `flushSync`.
3. **SearchReplace**: El plugin de decoraciones ProseMirror manipula el estado del editor directamente; cambios en la limpieza pueden dejar decoraciones huérfanas.
4. **FileExplorer con drag & drop**: Opera sobre paths de archivo reales; bugs pueden causar pérdida de datos.

---

## Tareas Pendientes (Actualizado 2026-06-22)

### Bugs Confirmados
- [ ] **Auto-save toggle inoperante**: El checkbox en Settings no controla el `useEffect` de autoguardado en `App.tsx:241`
- [ ] **markdown-it plugins documentados pero ausentes**: `markdown-it-sub`, `markdown-it-sup`, `markdown-it-footnote`, `markdown-it-mark`, `markdown-it-ins`, `markdown-it-kbd` no están en `package.json` ni se importan en `markdown.ts`
- [ ] **package.json version desactualizada**: `"0.1.2"` contra v0.3.1 documentado

### Deuda Técnica
- [ ] **App.tsx monolítico**: Refactorizar en hooks separados (useTabs, useEditorState, useKeyboardShortcuts)
- [ ] **CSS modularizar**: Migrar a CSS modules o styled-components para evitar colisiones
- [ ] **`@tiptap/extension-image`**: Dependencia no utilizada, remover
- [ ] **`switchingTab setTimeout(50ms)`**: Reemplazar por mecanismo más robusto basado en transacciones PM
- [ ] **SlashCommand `createRoot()` directo**: Migrar a renderizado React controlado
- [ ] **Persistir workspace folder** en localStorage

### Features Pendientes
- [ ] Sistema de plugins (extensiones cargables dinámicamente)
- [ ] Temas comunitarios (importar/exportar JSON)
- [ ] Buscador de archivos en el explorador lateral
- [ ] Ctrl+Tab con orden MRU (ya implementado básico)
- [ ] Sincronización de vista fuente al cambiar de pestaña
- [ ] Soporte para subíndice/superíndice/notas al pie en markdown-it (documentado pero no implementado)

---

## Bitácora de la Sesión Actual

### 2026-06-22 — Auditoría de Arquitectura y Corrección de Bugs (10:00-12:00)

**Objetivo**: Realizar auditoría completa del código vs documentación para identificar discrepancias, bugs y deuda técnica.

**Actividades realizadas**:
1. Lectura completa de todos los archivos fuente (33 archivos):
   - `src/main/index.ts` (184 líneas)
   - `src/preload/index.ts` (27 líneas)
   - `src/renderer/src/App.tsx` (677 líneas)
   - 13 componentes en `components/`
   - 11 extensiones en `extensions/`
   - 5 utilidades en `utils/`
   - Archivos de configuración: `package.json`, `electron.vite.config.ts`, `electron-builder.yml`
2. Lectura de `README.md` (199 líneas) y `documents/DOCUMENTACION.md` (757 líneas)
3. Comparación sistemática documentación vs implementación → 9 diferencias identificadas
4. Identificación de 3 bugs confirmados y 6 items de deuda técnica

**Problemas encontrados**:
1. **Auto-save toggle inoperante**: El checkbox "Auto-guardado cada 30s" en Settings no está conectado al `useEffect` que ejecuta el guardado periódico.
2. **6 dependencias markdown-it documentadas pero inexistentes**: Ni en package.json ni en código.
3. **package.json version = "0.1.2"** vs v0.3.1 documentado.
4. **Ctrl+Tab ya implementado** en código (navegación circular) pero listado como pendiente en README Roadmap.
5. **`@tiptap/extension-image` innecesaria** como dependencia.
6. **`lang="en"`** en HTML para app 100% en español.
7. **Workspace folder sin persistencia** entre sesiones.
8. **SearchReplace ya limpia decoraciones** al desmontar (problema conocido resuelto).

**Próximas tareas recomendadas**:
- Corregir auto-save toggle en App.tsx y Settings.tsx
- Remover `@tiptap/extension-image` de package.json
- Actualizar package.json version
- Actualizar README Roadmap
- Agregar dependencias markdown-it faltantes si se requieren
- Refactorizar App.tsx en hooks separados

---

## Registro Técnico de Decisiones

| Decisión | Alternativas | Razón |
|---|---|---|
| Mover side effects fuera de `setTabs` updater | 1. Refactor editor init, 2. setTimeout, 3. Ignorar el error | Los updaters ejecutan en fase de render; `flushSync` no puede llamarse allí. Refactor del editor era muy riesgoso. |
| `resizable: false` en Table | 1. Quitar Table extension, 2. Custom NodeView sin resize, 3. Mantener y aceptar bugs | `columnResizing` inyecta DOM y eventos que rompen edición. Custom NodeView era sobreingeniería. |
| Remover `handleClickOn` para `tableHeader` | 1. Refactor sort condicional, 2. Mantener con flag, 3. Eliminar | Sort-on-click rompía edición en headers. Refactor condicional agregaba complejidad innecesaria para una feature no esencial (el sort sigue disponible desde el plugin TableSort). |
| SlashCommand como extensión separada | 1. Integrar en Toolbar, 2. Paleta de comandos, 3. Plugin TipTap dedicado | Como extensión TipTap es auto-contenida, reutilizable, con ciclo de vida manejado por ProseMirror. |
| VideoBlock como NodeView (no markdown-it) | 1. markdown-it plugin, 2. HTML puro, 3. NodeView React | NodeView React permite renderizado interactivo (resize, align) igual que imágenes. |
| DEFAULT_MD con ejemplos in-template | 1. Documento vacío, 2. Cargar de archivo externo, 3. Template inline | Inline elimina dependencia externa; ejemplos ayudan al usuario a descubrir features. |

---

## Bitácora de la Sesión Actual

### 2026-06-18 — Corrección de flushSync y bugs de tablas (18:00-20:30)

**Funcionalidades implementadas hoy**: Ninguna. Sesión dedicada a debugging y corrección de bugs.

**Problemas encontrados**:
1. Error `flushSync was called from inside a lifecycle method` al cerrar pestañas (closeTab, closeOthers, closeRight, closeSaved)
2. Tablas: handles de resize interferían con clics y selección de celdas
3. Tablas: clic en celda `<th>` ejecutaba sort y bloqueaba la edición del encabezado

**Soluciones aplicadas**:
1. Extraer `loadTabIntoEditor`, `setActiveTabId`, `setShowWelcome`, `clearContent` de dentro de los updaters de `setTabs` en las 4 funciones de cierre
2. Cambiar `Table.configure({ resizable: true })` → `false` en `extensions/index.ts:43`
3. Eliminar bloque `handleClickOn` para `tableHeader` (líneas 76-111) y su import `tableSortKey` en `App.tsx`

**Archivos modificados**:
- `src/renderer/src/App.tsx` — flushSync fix + tableHeader sort removido
- `src/renderer/src/extensions/index.ts` — resizable false

**Próximas tareas recomendadas**:
- Probar la aplicación end-to-end tras correcciones
- Actualizar documentación del proyecto

### 2026-06-19 — Actualización de documentación (14:00-16:30)

**Funcionalidades implementadas hoy**: Ninguna código nuevo. Sesión dedicada exclusivamente a documentación.

**Problemas encontrados**:
- Documentación existente desactualizada vs el código real:
  - 4 extensiones TipTap no documentadas (SlashCommand, VideoBlock, TableSort, BoldItalic)
  - 1 componente no documentado (TableSizePicker)
  - 2 utils no documentados (prompt.ts, DEFAULT_MD)
  - 6 dependencias no documentadas (lucide-react, markdown-it-sub, markdown-it-sup, markdown-it-footnote, markdown-it-mark, markdown-it-ins, markdown-it-kbd)
  - 3 bugs corregidos no documentados (flushSync, table resize, table header sort)
  - Features de sistema no documentadas (single instance lock, file association, second instance forwarding)
  - Evento IPC `file:open` faltaba en la tabla de eventos Main → Renderer

**Soluciones aplicadas**:
- Tabla completa de extensiones TipTap (16 extensiones vs 12 anteriores)
- Nueva sección "Funcionalidades Implementadas (Extendido)" con: Video Embebido, Menú Slash Command, Table Size Picker, BoldItalic, Markdown-it Extended, Default Content, File Association / Single Instance, Markdown Source Editor, Toggle Auto-save, lucide-react Icons
- Nuevas secciones: Funcionalidades en Desarrollo, Mejoras de UI, Correcciones y Bugs Solucionados, Problemas Conocidos, Arquitectura del Proyecto, Próximos Pasos, Registro Técnico de Decisiones
- Bitácora completa con ambas sesiones
- Versión v0.3.1 agregada al Historial de Versiones
- Evento `file:open` agregado a tabla IPC Events

**Archivos modificados**:
- `documents/DOCUMENTACION.md` — todas las adiciones y correcciones

**Próximas tareas recomendadas**:
1. Probar la aplicación end-to-end tras las correcciones de la sesión anterior
2. Resolver problemas conocidos documentados (sincronización vista fuente, limpieza decoraciones)
3. Sistema de plugins (extensiones cargables dinámicamente)
4. Ctrl+Tab con orden MRU
5. Buscador de archivos en el explorador lateral

### 2026-06-22 — Simplificación de Interfaz (14:00-15:00)

**Objetivo**: Reducir elementos visuales eliminando los menús Insertar y Herramientas de la barra superior, moviendo sus opciones a Archivo y Ver.

**Cambios realizados**:
1. **MenuBar.tsx**:
   - Eliminado menú `Insertar` (8 items: Tabla, Imagen, Video, Enlace, Bloque de Código, Mermaid, Fórmula, Cita)
   - Eliminado menú `Herramientas` (2 items: Configuración, Estadísticas)
   - Movido "Configuración" a menú `Archivo` (antes de "Salir")
   - Movido "Estadísticas" a menú `Ver` (después de "Mostrar/Ocultar Índice")
   - Eliminadas 8 props `onInsert*` de `MenuBarProps`

2. **App.tsx**:
   - Eliminados 7 props `onInsert*` del JSX `<MenuBar>`

3. **README.md**:
   - ASCII art actualizado: `[Archivo] [Editar] [Ver] [Ayuda]`

4. **DOCUMENTACION.md**:
   - Actualizadas referencias a menús en layout, componentes y descripciones

**Impacto**: Ninguna funcionalidad se pierde. Todos los comandos de inserción siguen accesibles desde Toolbar, Paleta de Comandos (Ctrl+Shift+P) y SlashCommand (/). Configuración y Estadísticas se movieron a menús existentes.

**Archivos modificados**:
- `src/renderer/src/components/MenuBar.tsx`
- `src/renderer/src/App.tsx`
- `README.md`
- `documents/DOCUMENTACION.md`

### 2026-06-22 — Simplificación de Toolbar (15:00-16:30)

**Objetivo**: Reemplazar la barra de herramientas con iconos de lucide-react por una versión minimalista con etiquetas de texto, eliminando botones avanzados y manteniendo solo operaciones básicas de Markdown.

**Cambios realizados**:
1. **Toolbar.tsx**:
   - Interface `ToolbarProps` reducida de 15 props a 5: `editor`, `onNew`, `onOpen`, `onOpenFolder`, `onSave`, `onCommandPalette`
   - Eliminado import completo de `lucide-react` (25 iconos)
   - Reemplazados todos los iconos por etiquetas de texto: `+ Nuevo`, `Abrir`, `Carpeta`, `Guardar`, `Deshacer`, `Rehacer`, `H1`/`H2`/`H3`, `B`, `I`, `Lista`, `Tareas`, `Cita`, `Código`, `Mentor`
   - Eliminados botones: tema, focus mode, vista fuente, settings, explorer, underline, strikethrough, table, image, link, math, video

2. **App.tsx**:
   - Toolbar JSX simplificado a 6 props
   - Eliminados callbacks huérfanos: `insertImage`, `insertLink`, `insertMathBlock`, `insertMermaid`, `insertQuote`, `insertVideo`, `cycleTheme`, `handleInsertTable`, `handleTableSizeSelect`
   - Eliminados estados huérfanos: `tablePickerPos`, `lastTableSize`
   - Eliminado JSX de `<TableSizePicker>`
   - Eliminados imports huérfanos: `TableSizePicker`, `showPrompt`

**Impacto**: La barra de herramientas es más simple y didáctica. Las acciones avanzadas siguen accesibles desde Paleta de Comandos (Ctrl+Shift+P), SlashCommand (/), barra de menú, y atajos de teclado. El paquete `lucide-react` queda como dependencia no utilizada (pendiente de remover).

**Archivos modificados**:
- `src/renderer/src/components/Toolbar.tsx`
- `src/renderer/src/App.tsx`
- `documents/DOCUMENTACION.md`

### 2026-06-22 — Sistema de Hints Educativos (16:30-18:00)

**Objetivo**: Implementar un sistema educativo contextual que enseñe la sintaxis Markdown al usar los botones de formato por primera vez.

**Filosofía**: "Los botones son una ayuda permanente, pero Marknote debe enseñar Markdown hasta que el usuario cada vez necesite menos los botones y termine dominando Markdown de forma natural."

**Cambios realizados**:

1. **`src/renderer/src/utils/markdownHints.ts`** (CREADO):
   - Interfaz `MarkdownHint` con `id`, `title`, `markdown`, `example`, `explanation`
   - Tipo `HintType`: `'toolbar' | 'mentor' | 'contextual' | 'onboarding'`
   - Interfaz `ActiveHint` con `id`, `type`, `data`, `anchorRect`
   - 9 hints para: H1, H2, H3, Bold, Italic, BulletList, TaskList, Blockquote, CodeBlock
   - Helpers `markdownHintSeen(id)` y `markdownHintMarkSeen(id)` para localStorage

2. **`src/renderer/src/components/MarkdownHintCard.tsx`** (CREADO):
   - Popover posicionado (`position: fixed`) anclado al botón clickeado vía `DOMRect`
   - Diseño de tarjeta educativa: icono 💡, título, sintaxis Markdown, ejemplo, explicación, botón "Lo aprendí ✓"
   - Click fuera → cierra sin marcar como visto
   - Click "Lo aprendí ✓" → `localStorage.setItem('marknote-hint-<id>', 'true')` + cierra
   - Corrección de posición si el card se sale de la ventana
   - Sin dependencias externas

3. **`src/renderer/src/components/Toolbar.tsx`** (MODIFICADO):
   - Nuevo estado `activeHint: ActiveHint | null`
   - Nueva función `handleFormatClick` que ejecuta el comando inmediatamente y programa la aparición del hint tras 150ms
   - Timer con cleanup en unmount
   - Los 9 botones de formato ahora usan `handleFormatClick` en lugar de inline `editor.chain()`
   - Botones de archivo, undo/redo y mentor no afectados

4. **`src/renderer/src/App.css`** (MODIFICADO):
   - ~90 líneas nuevas de estilos para `.markdown-hint-card` y subcomponentes
   - Flecha CSS `::before` apuntando al botón
   - Diseño limpio con esquinas redondeadas, sombra suave, tipografía mono para sintaxis

**Persistencia**: 9 claves en localStorage: `marknote-hint-h1`, `marknote-hint-h2`, `marknote-hint-bold`, etc. Valores: `'true'`. Sin fechas, contadores ni metadatos.

**Preparado para futuro**:
- Tipos `HintType` permiten hints desde mentor, contextual u onboarding sin refactor
- Todas las claves siguen patrón `marknote-hint-*`, fácil de limpiar para restablecer ayudas

**Archivos creados**:
- `src/renderer/src/utils/markdownHints.ts`
- `src/renderer/src/components/MarkdownHintCard.tsx`

**Archivos modificados**:
- `src/renderer/src/components/Toolbar.tsx`
- `src/renderer/src/App.css`
- `documents/DOCUMENTACION.md`

**Sin cambios**:
- `App.tsx` — Toolbar props no cambiaron
- `MenuBar.tsx`, `CommandPalette.tsx` — no tocados
- `package.json` — sin nuevas dependencias

### 2026-06-22 — Mentor Markdown (18:00-19:30)

**Objetivo**: Crear las bases del Mentor Markdown, un sistema educativo offline que enseña la sintaxis Markdown desde la aplicación.

**Arquitectura seleccionada**: Archivos TypeScript (Opción A). Descartada SQLite (Opción B) por ser sobreingeniería — los datos son estáticos, no hay consultas relacionales, y se evita una dependencia nativa.

**Cambios realizados**:

1. **`src/renderer/src/knowledge/index.ts`** (CREADO):
   - Interfaz `KnowledgeTopic` con `id`, `title`, `category`, `summary`, `syntax[]`, `details`, `example`, `tips[]`, `related[]`
   - Tipo `TopicCategory`: `'basico' | 'intermedio' | 'avanzado'`
   - 12 temas educativos completos en español: headings, bold-italic, lists, checklists, blockquotes, code-blocks, tables, images, links, mermaid, math, videos
   - Cada tema incluye sintaxis, explicación, ejemplo, tips y temas relacionados
   - Cero dependencias externas, completamente offline

2. **`src/renderer/src/components/MentorModal.tsx`** (CREADO):
   - Modal overlay con sidebar de temas agrupados por categoría (📘 Básico, 📗 Intermedio, 📕 Avanzado)
   - Panel de contenido con: sintaxis (chips de código), explicación, ejemplo, tips y temas relacionados navegables
   - Escape para cerrar, click fuera cierra
   - Diseño limpio de 720×520px con scroll interno

3. **`src/renderer/src/App.tsx`** (MODIFICADO):
   - Agregado `showMentor` state y renderizado de `<MentorModal>`
   - Nuevo prop `onMentor` para Toolbar

4. **`src/renderer/src/components/Toolbar.tsx`** (MODIFICADO):
   - Cambiado prop `onCommandPalette` → `onMentor` en el botón Mentor
   - Mentor ahora abre directamente el modal educativo
   - CommandPalette sigue accesible por Ctrl+Shift+P

5. **`src/renderer/src/App.css`** (MODIFICADO):
   - ~170 líneas de estilos para mentor modal y componentes internos

**Impacto**: El botón Mentor ahora abre un explorador completo de sintaxis Markdown. CommandPalette sigue disponible por atajo de teclado. Sistema preparado para futuras expansiones (búsqueda, práctica interactiva, onboarding).

**Archivos creados**:
- `src/renderer/src/knowledge/index.ts`
- `src/renderer/src/components/MentorModal.tsx`

**Archivos modificados**:
- `src/renderer/src/App.tsx`
- `src/renderer/src/components/Toolbar.tsx`
- `src/renderer/src/App.css`
- `documents/DOCUMENTACION.md`

**Sin cambios**:
- `MenuBar.tsx`, `CommandPalette.tsx`, `MarkdownHintCard.tsx`
- `package.json` — sin nuevas dependencias
