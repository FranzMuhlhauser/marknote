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
│           │   ├── MenuBar.tsx        # Barra de menú (Archivo, Editar, Ver, Insertar, Herramientas, Ayuda)
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
│  [📝 Documento ●] [Archivo] [Editar] [Ver] [Insertar] │
│  [Herramientas] [Ayuda]              [⬇ vX.X.X]   │
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
- **Barra de menú unificada** (TitleBar + Menú): muestra título del documento + indicador de modificado + menús Archivo, Editar, Ver, Insertar, Herramientas, Ayuda — todos con atajos de teclado. Incluye botón de actualización cuando hay nueva versión. La zona del título funciona como agarre para arrastrar la ventana.
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
- Panel modal accesible desde menú Herramientas o botón ⚙ en toolbar
- Secciones:
  - **Apariencia**: selector de temas con botones, editor de tema personalizado (6 colores)
  - **Editor**: slider de tamaño de fuente (14-22px), toggle de autoguardado
  - **Plugins**: lista de todos los plugins activos con nombre, descripción y estado
  - **Atajos**: tabla de atajos de teclado disponibles

### Estadísticas
- Panel lateral con: caracteres, palabras, líneas, párrafos, encabezados, tiempo de lectura
- Toggle desde menú Herramientas

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
