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
│           │   ├── OnboardingModal.tsx # Guía interactiva de 7 pasos (primera ejecución)
│           │   ├── TableContextMenu.tsx # Menú contextual para tablas
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

### Guía de Onboarding
- Modal interactivo de 7 pasos que se muestra automáticamente en la primera ejecución
- Se oculta con localStorage (`marknote-onboarding-shown`) para no mostrar nuevamente
- Componente `OnboardingModal.tsx` con:
  - 7 pasos educativos: Bienvenida, Editor WYSIWYG, Barra de herramientas, Explorador, Paleta de comandos, Atajos útiles, Inicio
  - Navegación entre pasos con botones Anterior/Siguiente
  - Indicadores visuales de progreso (dots interactivos)
  - Botón Cerrar (✕) para saltar la guía
- Accesible permanentemente desde menú **Ayuda > Ver guía nuevamente**
- Diseño minimalista sin highlights de elementos
- Sin dependencias externas adicionales
- Almacenamiento persistente en `localStorage` bajo clave `marknote-onboarding-shown`

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
| `spellcheck:addWord` | Agrega una palabra al diccionario personalizado del spell checker |
| `spellcheck:removeWord` | Elimina una palabra del diccionario personalizado |
| `spellcheck:addWords` | Agrega múltiples palabras en lote (usado al iniciar) |

### Eventos Main → Renderer

| Canal | Descripción |
|---|---|
| `update:status` | Envía estado de la actualización (`checking`, `available`, `not-available`, `downloading`, `downloaded`, `error`) |
| `file:open` | Envía ruta de archivo .md para abrir (desde segunda instancia, línea de comandos o archivo asociado) |
| `spellcheck:replace-word` | Envía sugerencia seleccionada desde el menú contextual de ortografía; el renderer reemplaza la palabra en el editor |
| `spellcheck:add-word` | Envía palabra a agregar al diccionario personalizado vía menú contextual |

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
- Asociación de archivos `.md` (registro en el sistema operativo para abrir Markdown con Marknote)

---

## Release en GitHub

Para crear un nuevo Release:

1. Actualizar `version` en `package.json`
2. `npm run build:win` — genera `dist-electron/Marknote-<version>-Setup.exe`
3. Commit + push
4. `npm run release` — crea tag, pusha, crea GitHub Release con release notes automáticos, y sube los artefactos (Setup.exe, blockmap, latest.yml)
5. `electron-updater` detectará automáticamente la nueva versión en los clientes existentes

El script `scripts/release.ps1` automatiza los pasos 4-5. Requiere `gh` CLI autenticado y working tree limpio (o `-Force`).

---

## Historial de Versiones

| Versión | Fecha | Cambios |
|---|---|---|
| v0.3.0 | 2026-06-18 | TitleBar+MenuBar unificados, editor 960px + padding ampliado, Outline mejorado, WelcomeScreen con atajos, StatusBar fijo "WYSIWYG" + "Columna", Ctrl+H/W/Tab, resaltado de búsqueda con decoraciones ProseMirror, replaceAll transaccional, focus-mode en Stats + fix clase duplicada, hover con color-mix, vista fuente consistente, 8 variables CSS, sidebars responsives, menú contextual clamp, errores en explorador, Escape→source view, fix shortcut Negrita Ctrl+N→Ctrl+B, transiciones, scrollbars, :focus-visible, actualización automática con electron-updater (descarga + progreso + reinicio) |
| v0.2.0 | 2026-06-18 | Menú contextual tablas, bloques código copiar/colapsar, imágenes redimensionar/alinear/alt, explorador avanzado (crear, renombrar, duplicar, eliminar, arrastrar), temas personalizados, sección plugins, traducción completa a español, reordenar pestañas, menú contextual pestañas |
| v0.1.4 | 2026-06-24 | Diccionario personalizado (localStorage), menú contextual ortografía (Menu nativo + IPC + expandToWord), autocompletado descartado, .md file association en instalador NSIS |
| v0.1.1 | 2026-06-18 | Nuevo doc en blanco, fix open file |
| v0.1.0 | 2026-06-18 | Versión inicial: editor WYSIWYG, tablas, KaTeX, Mermaid, export, file explorer, source view |
| v0.3.1 | 2026-06-19 | Corrección flushSync (closeTab, closeOthers, closeRight, closeSaved), Table resize desactivado (`resizable: false`), Table header sort removido, SlashCommand y VideoBlock agregados, TableSizePicker, BoldItalic, TableSort, single instance lock, file association, markdown-it plugins extendidos, DEFAULT_MD template, docs actualizadas |
| v0.3.4 | 2026-06-24 | Menú contextual de corrección ortográfica con sugerencias Hunspell, "Agregar al diccionario" e "Ignorar palabra" vía Menu nativo de Electron + IPC, expandToWord helper para reemplazo en ProseMirror |
| v0.3.3 | 2026-06-24 | Diccionario personalizado de corrección ortográfica (localStorage + Electron spellchecker API), UI en Configuración, registro automático al iniciar, customDictionary.ts, estilos CSS para diccionario |
| v0.3.2 | 2026-06-24 | Guía de Onboarding interactiva (7 pasos), localStorage persistencia, menú Ayuda > Ver guía nuevamente, OnboardingModal.tsx, estilos minimalistas, decisiones arquitectónicas documentadas |

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
- Se conserva la ruta de archivo de inicio en el main antes de abrir la ventana
- `app.on('open-file')` y argumento de línea de comandos `.md` ahora se manejan mediante `dispatchOpenFile()` para enviar el evento al renderer con seguridad
- Se expone `app:getStartupFile` al renderer para abrir el archivo inicial después de montar la aplicación
- Segunda instancia envía evento `file:open` a la instancia existente y reutiliza la misma lógica de apertura
- Renderer escucha `onOpenFile` desde preload y abre el documento recibido usando `openFileFromExplorer`
- El instalador NSIS registra la asociación `.md` mediante `electron-builder.yml > fileAssociations`, apuntando a `resources/icon.ico` como ícono

### Bug detectado
- El archivo `.md` recibido en el arranque no se entregaba de forma confiable al renderer en la primera instancia, lo que provocaba un documento vacío en lugar de cargar el archivo.

### Causa raíz
- `process.argv` se evaluaba en el main, pero la coordinación con la ventana principal y el `did-finish-load` no era robusta.
- El path inicial podía perderse antes de que el renderer estuviera listo para procesar `file:open`.

### Solución aplicada
- Añadido almacenamiento temporal `startupFilePath` en `src/main/index.ts`.
- Unificado el envío de archivos entrantes en `dispatchOpenFile()`.
- Expuesto `getStartupFile` desde `src/preload/index.ts` y tipado en `src/renderer/src/env.d.ts`.
- Inicializado el archivo de arranque en `src/renderer/src/App.tsx` con la misma función de apertura existente.

### Archivos modificados
- `src/main/index.ts`
- `src/preload/index.ts`
- `src/renderer/src/env.d.ts`
- `src/renderer/src/App.tsx`

### Pruebas realizadas
- Escenario 1: aplicación cerrada + doble clic en `.md` → se abre el archivo automáticamente.
- Escenario 2: aplicación ya abierta + doble clic en otro `.md` → la app recibe la nueva ruta y abre el documento.
- Escenario 3: abrir la aplicación desde accesoso directo → se crea un documento vacío normal.

### Comportamiento esperado
- Asociaciones `.md` en Windows abren el archivo correcto en Marknote.
- Si la aplicación ya está abierta, un nuevo archivo `.md` envía el path a la instancia existente.
- Abrir la aplicación sin archivo usa la experiencia de documento vacío estándar.

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

### Diccionario Personalizado de Corrección Ortográfica
- Permite al usuario agregar palabras personalizadas que no se marcan como error ortográfico
- Input en Configuración > Corrección ortográfica con campo de texto + botón "Agregar"
- Lista de palabras agregadas con botón ✕ para eliminar cada una
- Persistencia en `localStorage` bajo clave `marknote-custom-dictionary`
- Al iniciar la app, todas las palabras se registran en el spell checker nativo de Electron vía IPC
- Usa `session.addWordToSpellCheckerDictionary()` y `session.removeWordFromSpellCheckerDictionary()` de Electron
- Sin dependencias externas

### Menú Contextual de Corrección Ortográfica
- Al hacer clic derecho sobre una palabra mal escrita (subrayada en rojo), se muestra un menú contextual nativo con:
  - **Sugerencias de corrección** (hasta 5, generadas por Hunspell vía Chromium)
  - **Agregar al diccionario** — guarda la palabra en localStorage y la registra en el spell checker
  - **Ignorar palabra** — registra la palabra en el spell checker para la sesión actual
- Implementado con el `Menu` nativo de Electron (`Menu.buildFromTemplate` + `menu.popup`)
- Sin componentes React, sin CSS, sin dependencias externas
- El menú se posiciona automáticamente cerca del cursor, se cierra con Escape y al hacer clic fuera (comportamiento nativo del SO)
- La selección de una sugerencia reemplaza la palabra en el editor mediante IPC + ProseMirror
- La detección de palabra mal escrita usa el evento `webContents.on('context-menu')` que provee `params.misspelledWord` y `params.dictionarySuggestions`

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

## Decisiones Arquitectónicas del Onboarding

### Componente `OnboardingModal.tsx`
- **Ruta**: `src/renderer/src/components/OnboardingModal.tsx`
- **Estructura**: 7 pasos educativos organizados en array de objetos `OnboardingStep` con: título, descripción, emoji de icono
- **Estado**: Gestión simple con `useState(currentStep)` dentro del componente modal
- **Navegación**: Botones Anterior/Siguiente con lógica de desactivación en primer/último paso
- **Progreso**: Indicadores visuales (dots) que permiten saltar a cualquier paso al hacer clic

### Persistencia
- **Mecanismo**: `localStorage` con clave `marknote-onboarding-shown`
- **Inicialización**: En `App.tsx`, el estado `showOnboarding` se inicializa consultando si el valor está guardado
- **Guarda**: Al cerrar el modal (botón Cerrar o click en último paso > "Comenzar"), se establece `marknote-onboarding-shown = 'true'`
- **Reactivación**: Menú **Ayuda > Ver guía nuevamente** limpia el localStorage y muestra el modal

### Integración en App.tsx
- **Importación**: `import { OnboardingModal } from './components/OnboardingModal'`
- **Estado**: `const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem('marknote-onboarding-shown') !== 'true')`
- **Renderizado**: Condicional `{showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}`
- **Prop en MenuBar**: `onShowOnboarding={() => setShowOnboarding(true)}`

### Estilos CSS
- **Overlay**: Fondo oscuro semi-transparente con `position: fixed` y `z-index: 10000`
- **Modal**: Ancho 500px (max-width 90vw), fondo según tema, bordes y sombra
- **Contenido**: Flex column centrado, con icono de 48px, título H2, descripción
- **Indicadores de progreso**: Dots interactivos de 8px, activo con `--accent`, inactivo con `--border`
- **Botones**: Anterior (secundario, desactivable) y Siguiente/Comenzar (primario)
- **Responsividad**: Adapta ancho a móvil con `max-width: 90vw`

### Impacto Arquitectónico
- **Minimalista**: Sin dependencias externas (no usa librerías de tour o highlight)
- **No-blocking**: El modal es modal pero permite cerrar y continuar usando la app
- **Reutilizable**: La lógica de localStorage y estado se puede adaptar para otros onboardings
- **Sostenible**: Basado en patrones React estándar (`useState`, props, renderizado condicional)

### Mejoras Futuras Posibles
- Opción de "No mostrar nuevamente" directamente en el modal (sin necesidad de localStorage manual)
- Persisten múltiples pasos vistos (analytics) para entender dónde usuarios abandonan
- Integración con tutorial interactivo que resalte elementos (tooltips) — requeriría dependencia adicional
- Localización: soportar múltiples idiomas en los pasos del onboarding
- Guía contextual: mostrar pasos relevantes según el workflow del usuario

---

## Decisiones Arquitectónicas del Diccionario Personalizado

### Estrategia
- **Spell checker nativo de Electron**: Se usó `session.addWordToSpellCheckerDictionary()` / `session.removeWordFromSpellCheckerDictionary()` en lugar de implementar un corrector ortográfico personalizado o integrar una librería externa como `hunspell` o `nspell`.
- **localStorage como almacenamiento**: Se eligió `localStorage` sobre archivos JSON por simplicidad — el diccionario es un array pequeño de strings (< 100 palabras típicamente), no requiere operaciones de archivo ni IPC para lectura/escritura, y es consistente con el patrón usado por otras configuraciones (tema, onboarding, archivos recientes).

### Persistencia (Two-tier)
| Capa | Propósito | API |
|---|---|---|
| `localStorage` (renderer) | Persistencia entre sesiones | `getItem`/`setItem` con clave `marknote-custom-dictionary` |
| `session.addWordToSpellCheckerDictionary` (main) | Registrar palabras en Chromium/Hunspell | IPC `spellcheck:addWord` / `spellcheck:removeWord` / `spellcheck:addWords` |

En cada inicio de la aplicación, se leen las palabras desde `localStorage` (renderer) y se envían al proceso principal vía IPC para registrarlas en el spell checker nativo.

### Archivos involucrados
| Archivo | Rol |
|---|---|
| `src/renderer/src/utils/customDictionary.ts` | Utilidad de lectura/escritura a `localStorage` (getCustomWords, addCustomWord, removeCustomWord) |
| `src/main/index.ts` | 3 IPC handlers (`spellcheck:addWord`, `spellcheck:removeWord`, `spellcheck:addWords`) |
| `src/preload/index.ts` | 3 métodos expuestos al renderer (`addCustomWord`, `removeCustomWord`, `addCustomWords`) |
| `src/renderer/src/env.d.ts` | Tipos TypeScript para los nuevos métodos en `FileAPI` |
| `src/renderer/src/components/Settings.tsx` | UI: input + botón Agregar + lista de palabras con botón Eliminar |
| `src/renderer/src/App.tsx` | Registro automático de palabras personalizadas al montar la aplicación |
| `src/renderer/src/App.css` | Estilos para `.dictionary-add`, `.dictionary-list`, `.dictionary-word`, `.dictionary-remove`, `.settings-desc` |

### Por qué no archivos JSON
1. **Complejidad innecesaria**: Leer/escribir un archivo JSON requiere IPC adicional (fs en main process), manejo de errores de archivo, permisos, y carga asíncrona.
2. **Sin ventajas reales**: El diccionario es datos de configuración de usuario, no datos de documento. `localStorage` ya se usa para propósitos equivalentes (tema personalizado, onboarding).
3. **Rendimiento**: `localStorage` es síncrono y no requiere esperar a que el proceso principal responda.

### Por qué no una base de datos
- **Sobredimensionado**: Una base de datos (SQLite, IndexedDB, etc.) para un array de strings no tiene sentido. YAGNI.

### Flujo de datos
```
Usuario escribe palabra → Settings.tsx
  → addCustomWord() → localStorage.setItem()
  → window.api.addCustomWord(word) → IPC
    → main process → session.defaultSession.addWordToSpellCheckerDictionary()

App startup → App.tsx useEffect
  → getCustomWords() → localStorage.getItem()
  → window.api.addCustomWords(words) → IPC (batch)
    → main process → session.defaultSession.addWordToSpellCheckerDictionary() x N
```

### Pruebas realizadas
1. **Agregar palabra**: Escribir "Marknote" en el input → Enter → aparece en la lista → la palabra deja de marcarse como error ortográfico en el editor
2. **Eliminar palabra**: Click en ✕ → la palabra desaparece de la lista → se marca nuevamente como error ortográfico
3. **Persistencia**: Cerrar y reabrir la app → las palabras personalizadas siguen en la lista y no se marcan como error
4. **Palabra duplicada**: Intentar agregar una palabra ya existente → no se duplica en la lista
5. **Palabra vacía**: Input vacío o solo espacios → botón Agregar deshabilitado, no se agrega
6. **Startup**: Al iniciar la app, todas las palabras personalizadas se registran correctamente en el spell checker vía IPC batch

### Comportamiento esperado
- Las palabras agregadas nunca se marcan como error ortográfico (subrayado rojo)
- Al eliminar una palabra, vuelve a marcarse como error si no está en el diccionario de Español
- El diccionario persiste entre sesiones sin intervención del usuario
- Sin dependencias externas, sin base de datos, sin archivos JSON

---

## Decisiones Arquitectónicas del Menú Contextual de Ortografía

### Estrategia
- **Menú nativo de Electron** (`Menu.buildFromTemplate` + `menu.popup`) en lugar de un overlay React personalizado.
- **Causa raíz**: El corrector ortográfico de Chromium/Electron marca palabras mal escritas internamente y solo expone esa información a través del evento `webContents.on('context-menu')` en el proceso principal (`params.misspelledWord`, `params.dictionarySuggestions`). No hay API para consultar desde el renderer si una palabra está mal escrita ni para obtener sugerencias.

### Alternativas consideradas
| Alternativa | Problema |
|---|---|
| Overlay React personalizado | No hay API desde el renderer para detectar si una palabra está mal escrita ni para obtener sugerencias. Habría que pasar por IPC, y aun así manejar posicionamiento, Escape y click-outside manualmente. |
| `contextmenu` del renderer + IPC | Requiere prevenir el evento `contextmenu` en el DOM, enviar la palabra al main process para verificarla, y no hay API pública para consultar el corrector. |
| **Menú nativo de Electron** (elegida) | El evento `context-menu` del webContents ya provee `misspelledWord` y `dictionarySuggestions`. `Menu.popup()` maneja posicionamiento, Escape y click-outside automáticamente. Cero código de UI. |

### Flujo de datos
```
Usuario → clic derecho en palabra mal escrita
→ Chromium detecta misspelling y dispara evento en main process
→ mainWindow.webContents.on('context-menu', (event, params) => {
    params.misspelledWord, params.dictionarySuggestions
  })
→ event.preventDefault() (cancela menú nativo por defecto)
→ Menu.buildFromTemplate(items) con sugerencias + acciones
→ menu.popup({ window: mainWindow })
  → Usuario hace clic en sugerencia:
    → webContents.send('spellcheck:replace-word', suggestion, word)
    → Renderer recibe evento en App.tsx
    → expandToWord(editor.state.doc, cursorPos) encuentra límites de la palabra
    → editor.chain().setTextSelection(range).deleteSelection().insertContent(replacement).run()
  → Usuario hace clic en "Agregar al diccionario":
    → webContents.send('spellcheck:add-word', word) → renderer actualiza localStorage
    → session.defaultSession.addWordToSpellCheckerDictionary(word)
  → Usuario hace clic en "Ignorar palabra":
    → session.defaultSession.addWordToSpellCheckerDictionary(word) (solo sesión actual)
```

### Archivos involucrados
| Archivo | Cambio |
|---|---|
| `src/main/index.ts` | Nuevo handler `context-menu` en `createWindow()` con `Menu.buildFromTemplate` |
| `src/preload/index.ts` | 2 nuevos listeners: `onSpellcheckReplaceWord`, `onSpellcheckAddWord` |
| `src/renderer/src/env.d.ts` | 2 nuevos métodos en `FileAPI` |
| `src/renderer/src/App.tsx` | useEffect con listeners + función `expandToWord` para reemplazo en ProseMirror |

### Por qué Menu nativo vs overlay React
1. **Sin UI que construir**: El `Menu` de Electron renderiza menús nativos del SO. No se necesita CSS, componentes React, ni manejo de eventos de teclado.
2. **Posicionamiento automático**: `menu.popup()` muestra el menú en la posición del cursor del mouse.
3. **Cierre automático**: Escape y clic fuera del menú son manejados por el SO.
4. **Cero dependencias**: Todo está en las APIs built-in de Electron.

### Función expandToWord
- Ubicada en `App.tsx` como función module-level
- Recibe el documento ProseMirror y una posición (cursor)
- Busca hacia atrás y adelante usando regex Unicode (`\p{L}\p{M}0-9'`) para detectar límites de palabra
- Soporta caracteres acentuados del español (á, é, í, ó, ú, ü, ñ)
- Retorna `{ from, to }` para seleccionar la palabra completa

### Pruebas realizadas
1. **Sugerencias visibles**: Clic derecho en palabra mal escrita → aparecen sugerencias de corrección
2. **Reemplazo de palabra**: Clic en una sugerencia → la palabra mal escrita se reemplaza correctamente en el editor
3. **Agregar al diccionario**: Clic derecho → "Agregar al diccionario" → la palabra deja de marcarse como error
4. **Ignorar palabra**: Clic derecho → "Ignorar palabra" → la palabra deja de marcarse como error (sesión actual)
5. **Sin misspelling**: Clic derecho en palabra correcta → no se intercepta el menú, se muestra el menú por defecto del navegador
6. **Caracteres acentuados**: Palabras con tildes y ñ se expanden correctamente con `expandToWord`
7. **Escape**: El menú nativo se cierra con Escape (comportamiento del SO)
8. **Click fuera**: El menú se cierra al hacer clic fuera (comportamiento del SO)

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

### Checkbox en Listas de Tareas Desalineado Verticalmente
- **Síntoma**: El checkbox se ubicaba en la parte inferior de la línea de texto, pegado a la base, en lugar de centrado verticalmente con el texto.
- **Causa raíz**: El `<label>` dentro de los task items contiene un `<input>` + `<span>` vacío (checkboxStyler). Con el `<label>` en inline por defecto, el `<span>` vacío establecía un baseline en la parte inferior, y el `<input>` (con `vertical-align: baseline`) se alineaba contra ese baseline, apareciendo pegado al fondo.
- **Fix (3 intentos)**:
  1. Cambiar `margin-top: 0.3em` → `0.15em` en el `<label>` — insuficiente, el checkbox seguía abajo por el baseline del `<span>`
  2. Agregar `display: flex; align-items: center; margin-top: 0` al `<label>` — el checkbox se centró dentro del label, pero ahora quedaba arriba del texto por no considerar el `line-height: 1.8`
  3. Ajustar `margin-top: 0.5em` para alinear el centro del checkbox con el centro de la primera línea de texto en `line-height: 1.8` y `font-size: 16px`
- **Estado**: ✅ Resuelto
- **Archivo modificado**: `src/renderer/src/App.css` — línea 1249

---

## Problemas Conocidos

- **TabContextMenu detecta solo tablas del editor activo**: El menú contextual usa `view.posAtCoords` y funciona correctamente, pero no hay atajo de teclado para tablas.
- **Source view ↔ WYSIWYG pierde sintaxis no compatible**: Elementos que Turndown no puede convertir (como atributos HTML avanzados en Markdown) pueden perderse al alternar entre vistas.
- **El modo foco atenúa Stats**: Por diseño, pero Stats no reaparece al hover a diferencia de sidebars (mejora menor pendiente).
- **Autoguardado sobrescribe sin confirmación**: Si el archivo se modificó externamente, el autoguardado lo sobrescribe.
- **Decoraciones de búsqueda (SearchReplace) no se limpian al cerrar**: Quedan decoraciones en el editor hasta que se abre una nueva búsqueda (no visible para el usuario pero sí en el estado interno de ProseMirror).
- **TabView (vista fuente) en pestaña nueva**: Al abrir vista fuente y luego cambiar de pestaña, el textarea no se sincroniza correctamente si hubo cambios sin guardar.

---

## Análisis de Funcionalidad Propuesta: Autocompletado de Palabras (2026-06-24)

### Estado
❌ **Descartado** — no implementado.

### Contexto
Se evaluó la posibilidad de agregar autocompletado de palabras al editor (sugerencias predictivas mientras se escribe).

### Análisis

| Criterio | Evaluación |
|---|---|
| **Aprendizaje de Markdown** | Markdown tiene ~10 reglas de sintaxis. El slash command (`/`) ya cubre la inserción estructural. Autocompletar sintaxis no aporta valor. |
| **Distracciones** | Cualquier popup predictivo aparece *mientras se escribe*, interrumpiendo el *flow*. Contradice directamente "menos interfaz, más escritura". |
| **Complejidad técnica** | Requiere: diccionario español completo (~300-500KB), estructura de datos (trie), integración con input de ProseMirror, popup posicionado con navegación por teclado y cierre al hacer clic fuera. Alto costo de implementación. |
| **Mantenimiento** | El diccionario debe mantenerse actualizado. Edge cases: acentos, palabras compuestas, conjugaciones verbales, nombres propios, mezcla de idiomas. |
| **Experiencia de escritura** | El autocompletado está diseñado para *código* (nombres largos de variables, APIs). En prosa, la palabra se escribe completa rápidamente; un popup agrega latencia mental sin beneficio real. |
| **Coherencia con Typora** | Typora no tiene autocompletado de palabras. iA Writer tampoco. Bear tampoco. No es un feature de editores de prosa minimalistas. |

### Decisión
**No implementar.** El autocompletado de palabras contradice la filosofía central de Marknote, tiene un costo técnico alto y no está presente en editores minimalistas equivalentes.

### Alternativas futuras (si se reconsidera)
1. **Autocompletado intra-documento** — solo sugiere palabras que ya aparecen en el documento actual. No requiere diccionario externo, es contextual y liviano.
2. **Autocompletado de emoji shortcodes** — `:smile` → 😊. Mapeo estático, común en editores de texto, no interrumpe la escritura de prosa.
3. **Extensión del slash command** — agregar más comandos en lugar de crear un sistema nuevo.

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

### 2026-06-23 — Mejora de Contraste en Tema Oscuro (10:00-10:15)

**Problema detectado**: En el tema oscuro, la separación visual entre el menú superior, barra de herramientas, explorador, editor y panel de índice era casi imperceptible debido al bajo contraste de los bordes y colores de fondo.

**Causa raíz**: La variable `--border: #3d3d3d` (RGB 61,61,61) proporcionaba muy poco contraste contra los fondos oscuros del tema (`--toolbar-bg: #2d2d2d`, delta 16; `--sidebar-bg: #252526`, delta 24; `--bg: #1e1e1e`, delta 31). El peor caso era el borde inferior del toolbar contra su propio fondo, con solo 16 puntos RGB de diferencia.

**Cambios realizados**:
- Modificado `--border` de `#3d3d3d` a `#555555` en el bloque `[data-theme='dark']` de `App.css`

**Contraste resultante**:
| Fondo | Delta antes | Delta después | Mejora |
|---|---|---|---|
| `--toolbar-bg` (#2d2d2d) | 16 | 40 | 2.5× |
| `--sidebar-bg` / `--titlebar-bg` (#252526) | 24 | 48 | 2× |
| `--bg` (#1e1e1e) | 30 | 55 | 1.8× |

**Archivos modificados**:
- `src/renderer/src/App.css` — línea 30

**Observaciones relevantes**:
- Ningún otro tema fue modificado (light, nord, dracula, solarized, github permanecen intactos)
- Ninguna regla de layout, componente o archivo adicional fue tocado
- El valor `#555555` sigue siendo un gris oscuro y minimalista, coherente con la estética del tema
- Todas las separaciones estructurales mejoraron simultáneamente (menú↔toolbar, toolbar↔tabbar, sidebar↔editor, etc.) al compartir todas la variable `--border`

### 2026-06-23 — Corrección de Toggle de Tema en Toolbar (10:15-10:30)

**Bug detectado**: Al cambiar del tema oscuro al tema claro usando el botón ☀️/🌙 del toolbar, el usuario debía hacer 2 o más clics para que el cambio se aplicara. Desde el menú Ver o el panel Settings funcionaba correctamente con 1 clic.

**Análisis**:
- La función `toggleTheme` en `App.tsx:375` implementaba un ciclo de 3 estados: `light → dark → system → light`
- El estado `'system'` no es una apariencia visual sino una preferencia que resuelve a `'light'` o `'dark'` según el SO
- Al partir de `'dark'`, el primer clic iba a `'system'`: si el SO estaba en modo oscuro, la apariencia no cambiaba; si estaba en modo claro, cambiaba a claro pero el estado quedaba como `'system'`, requiriendo un segundo clic para llegar a `'light'`

**Solución aplicada**:
- Modificado `toggleTheme` para que sea un toggle binario `light ↔ dark`, eliminando `'system'` del ciclo
- `'system'` ahora se trata como apariencia clara (cae al `else`), llevando a `'dark'` en 1 clic
- El estado `'system'` sigue siendo seleccionable desde el menú Ver (`Tema Claro`/`Tema Oscuro`) y desde Settings

**Archivos modificados**:
- `src/renderer/src/App.tsx` — líneas 375-380 (función `toggleTheme`)

**Posibles mejoras futuras**:
- Agregar un indicador visual en el botón del toolbar cuando el tema activo es `'system'` (ej. icono 🌗)
- Considerar un menú desplegable en el toolbar con las 3 opciones (Claro, Oscuro, Sistema) en lugar de un solo botón toggle

### 2026-06-23 — Diferenciación de Iconos Código / Vista Fuente (10:30-10:40)

**Decisión de diseño**: Cambiar el icono del botón "Bloque de Código" de `</>` a `{}` para diferenciarlo visualmente del botón "Ver Markdown" (`<>`).

**Razones**:
- Los iconos `</>` (bloque de código) y `<>` (vista fuente) eran visualmente casi idénticos — ambos usan ángulos brackets, diferenciándose solo por una barra `/`
- La confusión se agravaba porque ambos conceptos están relacionados con "código/formato"
- `{}` es el símbolo universal de código en editores e IDEs (VS Code, GitHub, IntelliJ)
- `<>` se mantiene para vista fuente porque representa HTML/markup, semánticamente apropiado

**Cambios realizados**:
- `src/renderer/src/components/Toolbar.tsx` — línea 190: cambiado `</>` por `{}` en el botón de bloque de código

**Archivos afectados**:
- `src/renderer/src/components/Toolbar.tsx`
- `documents/DOCUMENTACION.md`

### 2026-06-23 — Checklist: Sintaxis `- [ ]` No Funciona en WYSIWYG (10:45-11:00)

**Bug detectado**: La sintaxis Markdown estándar de checklists `- [ ]` y `- [x]` no se convertía en checklists interactivas al escribir en el editor WYSIWYG. El Mentor enseñaba `- [ ]` pero el usuario tenía que usar `[ ]` (sin dash) para que Tiptap la reconociera.

**Investigación**:
1. El Mentor (`knowledge/index.ts`) enseña correctamente `- [ ] Tarea pendiente`
2. El preprocesador (`markdown.ts`) acepta `- [ ]` para importación desde source view
3. El turndown (`markdown.ts`) exporta `- [ ]` desde HTML
4. **El `inputRegex` de `@tiptap/extension-task-item`** solo acepta `[ ]` (bare) — no contempla el list marker `- ` o `* `

**Causa raíz**:
El input rule original en `node_modules/@tiptap/extension-task-item/dist/index.cjs:10`:
```js
const inputRegex = /^\s*(\[([( |x])?\])\s$/;
```
Este regex requiere `[ ]` al inicio de línea. No acepta el list marker `- ` estándar de Markdown. Adicionalmente, `[( |x)]` es un character class mal formado que coincide con paréntesis y pipe como caracteres literales.

**Solución aplicada**:
Extender `TaskItem` en `extensions/index.ts` con un input rule personalizado que acepta el list marker opcional `- ` o `* ` antes de `[ ]`.

Regex nuevo:
```
/^\s*(?:[-*]\s+)?\[(x| ?)\]\s$/
```

**Compatibilidad**: El nuevo regex acepta todos los formatos previos (`[ ]`, `[x]`) más los nuevos (`- [ ]`, `- [x]`, `* [ ]`, `* [x]`).

**Archivos modificados**:
- `src/renderer/src/extensions/index.ts` — líneas 8, 43-55

**Decisión**: Se mantiene la sintaxis Markdown estándar `- [ ]` y `- [x]` como la enseñada por el Mentor y como la que funciona en el editor.

**Observaciones futuras**:
- El input rule original de `@tiptap/extension-task-item` tiene un bug en su character class `[( |x)]` que coincide con caracteres no esperados `(`, `|`, `)`. La extensión personalizada corrige esto usando `(x| ?)` que solo acepta `x` o espacio.

### 2026-06-23 — Consistencia Ctrl+B / Botón Explorador (11:00-11:15)

**Problema detectado**: Ctrl+B mostraba u ocultaba el explorador (toggle), pero el botón ✕ dentro del explorador solo permitía cerrarlo (`setShowExplorer(false)`). Una vez cerrado el explorador, no existía ningún elemento UI para reabrirlo sin usar el atajo de teclado.

**Causa raíz**:
- Ctrl+B usaba `setShowExplorer(s => !s)` (toggle)
- El botón ✕ usaba `setShowExplorer(false)` (asignación fija)
- No había ningún botón en el toolbar ni menú para mostrar/ocultar el explorador

**Cambios realizados**:

1. **`src/renderer/src/App.tsx` — línea 810**:
   - ✕ handler cambiado de `setShowExplorer(false)` a `setShowExplorer(s => !s)`
   - Misma lógica que Ctrl+B; al estar dentro del explorador, el toggle solo se activa cuando está visible (cierra)

2. **`src/renderer/src/components/Toolbar.tsx`**:
   - Agregado prop `onToggleExplorer` a `ToolbarProps`
   - Nuevo botón `🗂` con título "Explorador (Ctrl+B)" en el grupo Vista (antes del botón `<>`)
   - Usa la misma lógica `setShowExplorer(s => !s)` que Ctrl+B

3. **`src/renderer/src/App.tsx` — línea 782**:
   - Pasado `onToggleExplorer={() => setShowExplorer(s => !s)}` al `<Toolbar>`

**Archivos modificados**:
- `src/renderer/src/App.tsx`
- `src/renderer/src/components/Toolbar.tsx`
- `documents/DOCUMENTACION.md`

**Observaciones de UX**:
- El botón `🗂` está en el grupo Vista del toolbar (`<>` `🎯` `☀️`), cerca de otros comandos de visualización
- El título del botón incluye el atajo `(Ctrl+B)` para reforzar el descubrimiento del atajo de teclado
- El ✕ dentro del explorador usa ahora la misma función de toggle (aunque en la práctica siempre cierra por estar dentro del panel)
- El estado `showExplorer` sigue siendo la única fuente de verdad — no se crearon nuevos estados

### 2026-06-23 — Sistema Educativo de Botones Markdown (11:15-11:30)

**Problema detectado**: Los botones Markdown (H1, H2, H3, Negrita, Cursiva, Lista, Checklist, Cita, Código) mostraban tooltips tradicionales con atajos de teclado (ej. `title="Negrita (Ctrl+B)"`). Estos tooltips nativos aparecían inmediatamente al hacer hover, compitiendo con el sistema educativo `MarkdownHintCard` que requiere 2 segundos de hover. El usuario nunca llegaba a descubrir la tarjeta educativa.

**Causa raíz**: Dos sistemas de ayuda superpuestos: `title` nativo (inmediato, sin valor educativo) y `MarkdownHintCard` (2s de delay, enseña sintaxis real). El `title` ganaba por inmediatez.

**Cambios realizados**:

1. **`src/renderer/src/components/Toolbar.tsx`**:
   - Eliminado `markdownHintSeen` del import — los hints ahora se muestran en cada hover
   - Eliminado el check `if (markdownHintSeen(id) || ...)` en `handleMouseEnter` — el hint ya no depende de primera visita
   - Eliminados los `title` de los 9 botones Markdown: H1, H2, H3, Bold, Italic, bulletList, taskList, blockquote, codeBlock
   - Los botones de acción (📄 📂 📁 💾 ↶ ↷ 🗂 `<>` 🎯 ☀️/🌙 🤖) conservan sus `title`

2. **`src/renderer/src/components/MarkdownHintCard.tsx`**:
   - Eliminado import de `markdownHintMarkSeen`
   - Eliminada función `handleLearned`
   - Eliminado botón "Lo aprendí ✓"
   - La tarjeta ahora solo muestra: 💡 título → Markdown → Ejemplo → Explicación, sin interacción requerida

**Comportamiento resultante**:
- Mouse sobre botón Markdown → 2 segundos → aparece tarjeta educativa
- Mouse sale del botón → 2 segundos → tarjeta se oculta automáticamente
- Sin modales, sin captura de foco, sin interrupción de escritura
- Los timers se cancelan mutuamente en movimientos rápidos (no hay tarjetas fantasma)

**Filosofía aplicada**: "Los botones son una ayuda permanente, no una dependencia." El usuario descubre la sintaxis Markdown de forma progresiva y no intrusiva, cada vez que necesita recordarla.

**Archivos modificados**:
- `src/renderer/src/components/Toolbar.tsx`
- `src/renderer/src/components/MarkdownHintCard.tsx`
- `documents/DOCUMENTACION.md`

**Archivos no modificados**:
- `src/renderer/src/utils/markdownHints.ts` — datos y funciones `markdownHintSeen`/`markdownHintMarkSeen` conservados para uso futuro (onboarding, estadísticas, Mentor interactivo)
- `src/renderer/src/App.tsx`
- `src/renderer/src/App.css`

**Tareas futuras relacionadas**:
- Reintroducir persistencia (`markdownHintMarkSeen`) si se desea que el usuario pueda marcar hints como aprendidos y simplificar la UI
- Extender el sistema a hints contextuales (tipo `contextual`) u onboarding (tipo `onboarding`) usando el mismo MarkdownHintCard

### 2026-06-23 — Debugging y Fix de Hints Educativos (11:30-12:00)

**Problema**: Tras la refactorización del sistema de hints (tarjetas en hover con 2s de delay), las tarjetas educativas no aparecían al hacer hover sobre los botones Markdown. El código parecía correcto pero no se veía ningún hint en pantalla.

**Investigación**:
1. Se revisó que los 9 botones Markdown tuvieran `onMouseEnter={handleMouseEnter(id, e)}` correctamente asignados — sí estaban
2. Se verificaron los timers: `enterTimer` se iniciaba en `handleMouseEnter` y `leaveTimer` en `handleMouseLeave` — correcto
3. Se agregaron `console.log` de depuración en 5 puntos: `handleMouseEnter`, `handleMouseLeave`, antes del `setTimeout`, dentro del timer al setear `hintState`, y en la renderización condicional del `<MarkdownHintCard>`
4. Se verificó que `getBoundingClientRect()` se capturaba dentro de `setTimeout`, lo que podía causar que `e.currentTarget` quedara obsoleto si React reciclaba el evento sintético o si el DOM se modificaba entre la captura y la ejecución del timer

**Causa raíz**: `e.currentTarget.getBoundingClientRect()` se ejecutaba dentro del `setTimeout(800)` del `enterTimer`. Aunque React 19 eliminó el event pooling, `currentTarget` puede volverse `null` si el elemento se desmonta del DOM entre el momento del evento y la ejecución del callback. En la práctica, el problema era que el rectángulo se capturaba tarde, y el `MarkdownHintCard` se renderizaba con un `DOMRect` inválido o nulo, resultando invisible.

**Solución**:
1. **`src/renderer/src/components/Toolbar.tsx`**:
   - Agregado `hintRect = useRef<DOMRect | null>(null)` para capturar el rectángulo inmediatamente
   - `handleMouseEnter` ahora captura `hintRect.current = e.currentTarget.getBoundingClientRect()` antes de cualquier timer
   - El `setTimeout` del `enterTimer` usa `hintRect.current` en lugar de `e.currentTarget.getBoundingClientRect()`
   - El `setHintState` ahora pasa `hintRect.current` como `anchorRect`
   - Se eliminó un `handleMouseLeave` duplicado que estaba causando conflictos

**Archivos modificados**:
- `src/renderer/src/components/Toolbar.tsx`

**Archivos no modificados**:
- `src/renderer/src/components/MarkdownHintCard.tsx`
- `src/renderer/src/utils/markdownHints.ts`

**Comportamiento verificado** (por el usuario): Las tarjetas educativas aparecen correctamente tras 2s de hover sobre cualquier botón Markdown, y se ocultan 2s después de que el mouse sale del botón.

### 2026-06-23 — Fix Checklists al Alternar Vista Markdown (12:00-12:30)

**Problema**: Al cambiar de vista Markdown a vista de edición (WYSIWYG), los checklists perdían su formato y se convertían en listas normales. La sintaxis `- [ ] texto` se transformaba en `• texto` después del toggle.

**Evidencia del bug**:
1. Vista edición inicial: checklists correctos (checkboxes visibles)
2. Vista Markdown: sintaxis correcta `- [ ] texto`
3. Al volver a vista edición: se convertía en lista normal `• texto`
4. Vista Markdown final: sintaxis incorrecta `* texto` (perdió el `[ ]`)

**Causa raíz**: `preprocessTaskLists()` en `markdown.ts` generaba `<li data-checked="true/false">` pero **sin el atributo `data-type="taskItem"`**. La regla `parseHTML` de `@tiptap/extension-task-item` busca `li[data-type="taskItem"]` (con prioridad 51), no `li[data-checked]`. Al no matchear, ProseMirror caía al `ListItem` genérico (`tag: 'li'`, prioridad 50), creando `listItem` dentro de `taskList`. Como el esquema de `taskList` solo acepta `taskItem+`, el parser reinterpretaba el `<ul>` como `bulletList`, perdiendo los checkboxes.

**Fix**: Se agregó `data-type="taskItem"` al `<li>` generado en `preprocessTaskLists`, haciendo que el parse rule de TaskItem matchee correctamente.

**Cambio (1 línea)**:
```diff
- return `<li data-checked="${checked}"><label>...
+ return `<li data-type="taskItem" data-checked="${checked}"><label>...
```

**Archivo modificado**:
- `src/renderer/src/utils/markdown.ts` — línea 49

**Archivos no modificados**:
- `src/renderer/src/extensions/index.ts`
- `src/renderer/src/App.tsx`
- `src/renderer/src/components/Toolbar.tsx`
- `src/renderer/src/components/MarkdownHintCard.tsx`

**Comportamiento verificado**: El toggle vista Markdown ↔ WYSIWYG preserva correctamente los checklists en ambos sentidos, sin pérdida de formato.

### 2026-06-23 — Checkbox Alignment Fix (12:30-13:15)

**Problema**: El checkbox en listas de tareas (taskList) se mostraba desalineado verticalmente respecto al texto. Tras varios intentos de corrección con `margin-top` y `vertical-align`, el checkbox seguía en la parte inferior (baseline del `<span>` vacío dentro del `<label>`).

**Investigación**:
- El NodeView de `@tiptap/extension-task-item` genera: `<label><input><span></span></label>` — el `<span>` vacío (checkboxStyler) establece un baseline en la parte inferior del label
- Con `vertical-align: baseline` (default), el `<input>` se alinea contra ese baseline, quedando pegado al fondo
- `vertical-align: middle` no funciona de forma fiable contra el baseline dominante del `<span>` vacío

**Solución aplicada (3 iteraciones)**:

1. **Intento 1**: `margin-top: 0.3em → 0.15em` — el checkbox seguía abajo (baseline issue, no de margin)
2. **Intento 2**: `display: flex; align-items: center; margin-top: 0` — el checkbox se centró dentro del label (el flex ignora el `<span>` vacío), pero ahora quedaba arriba del texto
3. **Intento 3 (final)**: `display: flex; align-items: center; margin-top: 0.5em` — centra el checkbox dentro del label y lo posiciona a la altura correcta para alinear su centro con el centro de la primera línea de texto

**Cálculo de `margin-top`**:
- `font-size: 16px`, `line-height: 1.8` → línea = 28.8px
- Checkbox ~13-16px → centro a ~8px del tope del label
- Centro del texto: 28.8 / 2 = 14.4px
- `margin-top` necesario = 14.4px - 8px = 6.4px ≈ **0.4-0.5em**

**CSS final**:
```css
.ProseMirror ul[data-type='taskList'] li > label {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  margin-top: 0.5em;
}
```

**Archivo modificado**:
- `src/renderer/src/App.css` — línea 1249

### 2026-06-24 � Navegaci�n del �ndice

**Descripci�n de la funcionalidad**:
- Al hacer clic en un �tem del panel lateral "DOCUMENTO" (Outline), el editor ahora realiza un desplazamiento suave (scroll) hacia la posici�n exacta del encabezado correspondiente.
- Se implement� una animaci�n CSS de resaltado temporal (1.5 segundos) sobre el encabezado destino para proveer feedback visual confirmando la navegaci�n.

**Archivos modificados**:
- src/renderer/src/components/Outline.tsx: Se actualiz� la funci�n goTo(pos) para obtener el nodo del DOM mediante editor.view.nodeDOM(pos), invocar scrollIntoView nativo e inyectar/retirar la clase CSS de resaltado.
- src/renderer/src/App.css: Se agregaron los estilos para la clase .heading-highlight con @keyframes de animaci�n para un desvanecimiento suave (highlight-fade).

**Decisiones tomadas**:
- **Reutilizaci�n del �ndice existente**: No fue necesario reescribir el panel derecho ni crear identificadores paralelos, ya que ProseMirror expone la posici�n absoluta de cada nodo en el documento. Esto permite recuperar el elemento DOM directamente desde la posici�n.
- **Scroll nativo**: Se us� el m�todo est�ndar Element.scrollIntoView({ behavior: 'smooth' }) sobre el DOM renderizado por ProseMirror por su simplicidad y robustez frente a soluciones propietarias del editor.
- **Feedback visual m�nimo**: Se opt� por una animaci�n CSS en vez de un estado en React o re-renderizado para mantener un alto rendimiento y evitar l�gica compleja de estado.

**Pruebas realizadas**:
- **Reutilizacin del ndice existente**: No fue necesario reescribir el panel derecho ni crear identificadores paralelos, ya que ProseMirror expone la posicin absoluta de cada nodo en el documento. Esto permite recuperar el elemento DOM directamente desde la posicin.
- **Scroll nativo**: Se us el mtodo estndar Element.scrollIntoView({ behavior: 'smooth' }) sobre el DOM renderizado por ProseMirror por su simplicidad y robustez frente a soluciones propietarias del editor.
- **Feedback visual mnimo**: Se opt por una animacin CSS en vez de un estado en React o re-renderizado para mantener un alto rendimiento y evitar lgica compleja de estado.

**Pruebas realizadas**:
- Validada la navegacin a encabezados de distintos niveles (H1, H2, H3).
- Validadas las posiciones en documentos extensos con barras de desplazamiento activas (el scroll suave centra el encabezado en la vista).
- Validadas anclas con encabezados que tienen texto idntico, ya que la navegacin se basa en posiciones absolutas dentro del documento y no en anclas de texto.

**Observaciones futuras**:
- Si se agregan vistas de esquema o subsecciones ms complejas, la misma lgica basada en posiciones del documento (pos) debera mantenerse como la manera preferida de indexacin y navegacin dentro de Tiptap/ProseMirror.

### 2026-06-24 — Revisión Ortográfica en Español

**Descripción de la funcionalidad**:
- El editor WYSIWYG ahora detecta palabras mal escritas en español y las resalta con subrayado rojo ondulado nativo del navegador.
- Clic derecho sobre una palabra subrayada muestra sugerencias ortográficas en el menú contextual nativo de Chromium.
- Funciona completamente offline tras la primera descarga del diccionario.

**Evaluación de alternativas**:

| Criterio | A) Spellcheck nativo Chromium/Electron | B) Electron session API | C) typo-js + Hunspell |
|---|---|---|---|
| Complejidad | Mínima (solo config) | Misma que A (es la misma API) | Alta (plugin PM + tokenización) |
| Dependencias | 0 (embebido en Electron) | 0 | +2 (typo-js + .aff/.dic ~5MB) |
| Mantenimiento | 0 (Chromium actualiza) | 0 | Alto (diccionarios manuales) |
| Offline | Sí (Hunspell integrado) | Sí | Sí |
| Integración Tiptap | Nativa (contenteditable) | Nativa | Manual (decoraciones PM) |

**Solución elegida**: **A — Spellcheck nativo de Chromium/Electron**

**Motivos**:
1. Cero dependencias — ya incluido en Electron 33 (Chromium Hunspell)
2. Cero código de corrección — el motor maneja tokenización, diccionarios y renderizado del subrayado
3. Integración perfecta con Tiptap — `contenteditable` soporta `spellcheck` nativamente
4. Menú contextual con sugerencias gratuito por el motor del navegador
5. Respeta la filosofía del proyecto: YAGNI, solución más simple, priorizar lo nativo

**Alternativas descartadas**:
- **B (Electron session API)**: No es una alternativa separada, es la API formal para configurar A. Se usa `session.setSpellCheckerLanguages()`.
- **C (typo-js + Hunspell)**: Reimplementa lo que Chromium ya hace. Agrega dependencias, código de tokenización, plugin de decoraciones ProseMirror. Viola la regla "No implementar un corrector ortográfico propio".

**Archivos modificados**:
- `src/main/index.ts`: Agregado `session` al import de Electron, `spellcheck: true` en `webPreferences`, y `session.defaultSession.setSpellCheckerLanguages(['es'])` después de crear la ventana.
- `src/renderer/src/App.tsx`: Agregado `attributes: { spellcheck: 'true', lang: 'es' }` en `editorProps` del `useEditor()` para que el `div[contenteditable]` de Tiptap tenga el atributo `spellcheck`.

**Pruebas realizadas**:
- `npx tsc --noEmit` — sin errores de tipos
- `npm run build` — compilación exitosa (14.07s)
- Verificación de que `spellcheck: true` se propaga al DOM del editor
- El `<textarea>` de vista fuente mantiene `spellCheck={false}` (correcto, es código Markdown raw)

**Observaciones futuras**:
- Si se desea soportar múltiples idiomas, se puede extender `setSpellCheckerLanguages(['es', 'en'])` en el main process
- El menú contextual de sugerencias es el nativo de Chromium; si se desea uno personalizado, se necesitaría `webContents.on('context-menu')` en el main process
- La corrección no aplica en bloques de código ni en fórmulas matemáticas (comportamiento correcto, ya que esos NodeViews tienen `contentEditable={false}`)

### 2026-06-24 — Release v0.1.4 y Asociación de Archivos .md

**Objetivo**: Completar el ciclo de release para v0.1.4 incluyendo todas las funcionalidades de corrección ortográfica y asegurar que los archivos `.md` se asocien automáticamente con Marknote en Windows.

**Cambios realizados**:

1. **`electron-builder.yml`**:
   - Agregada sección `fileAssociations` con extensión `.md`, descripción "Markdown" e icono `resources/icon.ico`
   - El instalador NSIS ahora registra la asociación en el sistema operativo

2. **`documents/DOCUMENTACION.md`**:
   - Actualizado Historial de Versiones con v0.1.4
   - Actualizada sección de Empaquetado para incluir asociación .md
   - Actualizada sección File Association con el registro en instalador
   - Actualizada sección Release en GitHub con el script automatizado
   - Agregada esta bitácora de la sesión

**Release publicado**:
- `npm run build:win` → `Marknote-0.1.4-Setup.exe` (118 MB)
- `npm run release` → tag `v0.1.4` + GitHub Release + artifacts subidos
- URL: https://github.com/FranzMuhlhauser/marknote/releases/tag/v0.1.4

**Archivos modificados**:
- `electron-builder.yml`
- `documents/DOCUMENTACION.md`

### 2026-06-24 — Corrección de Cierre de Pestañas y Mejora Visual

**Objetivo**: Corregir tres problemas del sistema de pestañas: (1) bug al cerrar el primer documento con "No guardar", (2) botón cerrar invisible en primera pestaña, (3) mejorar diferenciación visual de pestaña activa.

---

#### Tarea 1 — Bug de Cierre del Primer Documento

**Bug detectado**: Al cerrar el primer documento (modificado) y seleccionar "No guardar" en el diálogo de confirmación, el flujo no finalizaba correctamente. El comportamiento era inconsistente: en pestañas posteriores funcionaba, en la primera no.

**Causa raíz**: La función `closeTab()` llamaba `editor?.commands.clearContent()` después de remover la última pestaña (L582). Esta llamada disparaba `onUpdate` del editor de forma **síncrona**, antes de que React hubiera procesado las actualizaciones de estado (`setTabs([])`, `setActiveTabId(null)`, `setShowWelcome(true)`). El `onUpdate` se ejecutaba con valores del closure stale (`activeTabId` aún con el ID de la pestaña cerrada, `tabs` con la pestaña todavía presente), causando una segunda actualización de estado que interfería con el cierre.

**¿Por qué solo afectaba a la primera pestaña?** Porque `clearContent()` solo se llamaba en la rama `next.length === 0` (última pestaña). Al cerrar pestañas intermedias, el flujo iba por `else if (id === activeTabId)` que no llamaba `clearContent()`.

**Misma causa en `closeAll()`**: La función `closeAll()` también llamaba `editor?.commands.clearContent()` después de las actualizaciones de estado (L521), con el mismo riesgo de stale closure.

**Solución aplicada**:
- `closeTab()`: Eliminada la línea `editor?.commands.clearContent()`. No es necesaria porque al renderizar:
  - `showWelcome = true` + `tabs.length === 0` → se muestra `WelcomeScreen` en lugar de `EditorContent`
  - El editor con contenido antiguo queda oculto visualmente
  - Cuando el usuario crea un nuevo documento, `newDoc()` → `loadTabIntoEditor()` → `editor.commands.setContent()` reemplaza el contenido
- `closeAll()`: Misma corrección. Se eliminó `editor?.commands.clearContent()` y la dependencia `editor` del `useCallback`.

**Archivos modificados**:
- `src/renderer/src/App.tsx` — L566-589 (closeTab), L518-521 (closeAll)

---

#### Tarea 2 — Botón Cerrar en la Primera Pestaña

**Bug detectado**: La primera pestaña no poseía botón cerrar (×). Las demás pestañas sí. Inconsistencia visual y funcional.

**Causa raíz**: En `TabBar.tsx` línea 145:
```typescript
{tabsLength > 1 && (
  <button className="tab-close" ...>×</button>
)}
```
La condición `tabsLength > 1` ocultaba el botón cuando solo había una pestaña.

**¿Por qué existía?** Patrón común en editores con pestañas para evitar que el usuario cierre la última pestaña. Sin embargo, Marknote ya maneja correctamente el estado sin pestañas (WelcomeScreen).

**Impacto de eliminarla**: Cero. `closeTab()` ya maneja `next.length === 0` mostrando WelcomeScreen. `closeAll()` también. No hay riesgos.

**Solución aplicada**: Eliminada la condición `tabsLength > 1 &&` para que el botón cerrar se renderice siempre.

**Archivos modificados**:
- `src/renderer/src/components/TabBar.tsx` — línea 145

---

#### Tarea 3 — Mejora Visual de Pestañas

**Problema detectado**: En 4 de los 6 temas, `--toolbar-bg` era idéntico a `--bg`:
| Tema | --toolbar-bg | --bg | ¿Igual? |
|---|---|---|---|
| Nord | #eceff4 | #eceff4 | ✅ |
| Dracula | #282a36 | #282a36 | ✅ |
| Solarized | #fdf6e3 | #fdf6e3 | ✅ |
| GitHub | #ffffff | #ffffff | ✅ |

Como la pestaña activa usa `background: var(--bg)` y las inactivas heredan `--toolbar-bg` del tabbar, no había diferenciación de fondo entre activa e inactiva en estos temas. Solo el `border-bottom: 2px solid var(--accent)` distinguía la activa.

**Solución aplicada**: Se cambió `--toolbar-bg` en cada tema al mismo valor que `--sidebar-bg` y `--titlebar-bg`, creando una jerarquía visual consistente:

| Tema | --toolbar-bg (nuevo) | --bg (sin cambio) | Contraste |
|---|---|---|---|
| Nord | #e5e9f0 | #eceff4 | 7 puntos |
| Dracula | #21222c | #282a36 | 6 puntos |
| Solarized | #eee8d5 | #fdf6e3 | 14 puntos |
| GitHub | #f6f8fa | #ffffff | 9 puntos |

**Jerarquía visual resultante** (de más externo a más interno):
1. Toolbar/TabBar → `--toolbar-bg` (neutro)
2. Pestaña inactiva → hereda `--toolbar-bg`
3. Pestaña activa → `--bg` (conecta visualmente con el editor)
4. Editor → `--bg`

**Indicadores de pestaña activa** (sin cambios, ya eran correctos):
- `background: var(--bg)` — fondo del editor, la "eleva" visualmente
- `color: var(--text)` — contraste completo
- `border-bottom: 2px solid var(--accent)` — línea inferior con color del tema
- `margin-bottom: -1px` — conecta con el contenido del editor

**Archivos modificados**:
- `src/renderer/src/App.css` — temas Nord, Dracula, Solarized, GitHub (solo variable `--toolbar-bg`)

---

#### Pruebas Realizadas

1. **Cierre con "No guardar"**: Crear documento → modificar → Ctrl+W → "No guardar" → se cierra sin segundo diálogo, WelcomeScreen aparece
2. **Cierre con "Guardar"**: Crear documento → modificar → Ctrl+W → "Guardar" → diálogo Guardar como → guarda y cierra
3. **Cierre con "Cancelar"**: Crear documento → modificar → Ctrl+W → "Cancelar" → el documento permanece abierto
4. **Cerrar todos**: Múltiples tabs → Cerrar todos → "No guardar ninguno" → WelcomeScreen
5. **Botón cerrar** en primera pestaña: Aparece × en tab con título "Sin título" (modificado) y en tabs de archivos
6. **Botón cerrar** en pestañas posteriores: Sigue funcionando igual que antes
7. **Visual modo claro**: Pestaña activa se diferencia por fondo + underline + contraste de texto
8. **Visual modo oscuro**: Misma diferenciación, sin colores agresivos
9. **Themes Nord/Dracula/Solarized/GitHub**: Pestaña activa claramente identificable en todos
10. **`npx tsc --noEmit`**: Sin errores de tipos
11. **`npm run build`**: Compilación exitosa

#### Observaciones Futuras
- Si se agregan más temas en el futuro, verificar que `--toolbar-bg` siempre sea diferente de `--bg`
- El early return en `TabBar.tsx` (L23) ocultaba el TabBar cuando hay una sola pestaña sin modificar y sin filePath. ~~Esto es intencional: reduce ruido visual para documentos nuevos vacíos~~ **Corregido en v0.3.5**: ahora el TabBar se muestra siempre que haya al menos un documento abierto, independientemente de su estado.
- Las funciones `closeOthers`, `closeRight` y `closeSaved` no fueron modificadas porque no presentan el mismo patrón de bug (no llaman a `clearContent()` después de async)

### 2026-06-24 — Corrección de Renderizado Matemático (KaTeX)

**Bug detectado**: Las fórmulas matemáticas con delimitadores `$$...$$` y `$...$` se mostraban como texto plano literal en lugar de renderizarse con KaTeX. El contenido `$$ x+y=7 $$` aparecía exactamente como `$$ x+y=7 $$` en el editor.

**Análisis realizado**: Se revisó el flujo completo de renderizado matemático:

1. **Carga de archivos .md**: `App.tsx:217` llama a `editor.commands.setContent(mdToHtml(tab.content))`. `mdToHtml` usa `markdown-it` sin plugins matemáticos, por lo que `$$...$$` se convertía en `<p>$$...$$</p>` (texto literal), no en `<div data-math-block>`.
2. **Escritura manual**: `MathBlock` y `MathInline` no tenían `addInputRules()` ni `addPasteRules()`, por lo que escribir o pegar `$$...$$` nunca creaba un nodo mathBlock.
3. **Guardado**: No existían reglas turndown para `div[data-math-block]` o `span[data-math-inline]`. Al guardar, el contenido LaTeX en el atributo `data-tex` se perdía.
4. **KaTeX**: Correctamente instalado (`katex@^0.17.0`) y cargado (`import('katex')` en App.tsx L150). Los NodeViewComponents ya renderizan correctamente cuando reciben un nodo con `tex` poblado. El problema estaba antes de KaTeX: los nodos nunca se creaban desde markdown.

**Causa raíz**: Tres gaps independientes en el pipeline de carga/guardado:

| Gap | Etapa | Archivo/Línea | Impacto |
|---|---|---|---|
| 1. `markdown-it` sin reglas math | Carga (.md → editor) | `markdown.ts:96` | `$$` → `<p>` literal, no se crean nodos math |
| 2. Sin PasteRules | Pegado | `MathBlock.tsx`, `MathInline.tsx` | `$$` pegado no se convierte en nodo math |
| 3. Sin reglas turndown | Guardado (editor → .md) | `markdown.ts:5,100` | Nodos mathBlock → LaTeX perdido en el Markdown |

**Solución aplicada**: Modificaciones en 3 archivos:

**1. `src/renderer/src/utils/markdown.ts`**:
- **`preprocessMath()`** (L78-93): Nueva función que, antes de `markdown-it`:
  - Protege bloques de código (``` y `) de procesamiento matemático
  - Convierte `$$...$$` → `<div data-math-block data-tex="..."></div>`
  - Convierte `$...$` → `<span data-math-inline data-tex="..."></span>`
  - Escapa `&` y `"` en el contenido LaTeX para seguridad en atributos HTML
- **`mdToHtml()`** (L96-98): Integra `preprocessMath()` en la cadena: `md.render(preprocessTaskLists(preprocessMath(source)))`
- **Reglas turndown** (L34-52):
  - `mathBlock`: `div[data-math-block]` → `$$\n{tex}\n$$`
  - `mathInline`: `span[data-math-inline]` → `${tex}$`

**2. `src/renderer/src/extensions/MathBlock.tsx`** (L23-33):
- Importa `PasteRule` desde `@tiptap/core`
- Agrega `addPasteRules()` con regex `/\$\$([\s\S]*?)\$\$/g` que convierte el texto pegado en nodos mathBlock

**3. `src/renderer/src/extensions/MathInline.tsx`** (L23-33):
- Importa `PasteRule` desde `@tiptap/core`
- Agrega `addPasteRules()` con regex `/(?<!\$)\$(\S[^$\n]*?)\$(?!\$)/g` que convierte el texto pegado en nodos mathInline

**Por qué no se modificaron otras cosas**:
- `MathBlock` y `MathInline` requerían parseHTML/renderHTML explícitos para `data-tex` (Tiptap no mapea automáticamente `tex` → `data-tex`)
- `KaTeX` carga async en `useEffect` y los componentes ya manejan el estado intermedio (fallback a texto plano si KaTeX no está listo)
- No se agregaron dependencias nuevas
- El slash command y command palette ya funcionaban (insertan nodos math directamente)

**Flujo resultante**:

```
Archivo .md con $$x+y=7$$
        │
        ▼
  preprocessMath()
        │
        ▼
  <div data-math-block data-tex="x+y=7">
        │
        ▼
  markdown-it (pasa HTML literal con html:true)
        │
        ▼
  editor.commands.setContent() → Tiptap parsea div[data-math-block]
        │
        ▼
  MathBlockComponent → katex.renderToString("x+y=7") → ¡Renderizado!
```

**Pruebas realizadas**:

1. **Carga de archivo con `$$`**: Crear archivo .md con `$$ x+y=7 $$` → abrir en Marknote → se renderiza con KaTeX
2. **Pegado de fórmulas**: Copiar `$$ x+y=7 $$` desde texto plano → pegar en Marknote → se renderiza como fórmula
3. **Guardar y reabrir**: Escribir fórmula → guardar → cerrar → reabrir → la fórmula sigue renderizada
4. **Documento mixto**: Título, texto normal, lista, `$$...$$`, subtítulo → todo renderiza correctamente
5. **Source mode (Ctrl+Shift+M)**: `$$` se mantienen como `$$ x+y=7 $$` → al volver a WYSIWYG se renderizan
6. **Inline math**: `$E = mc^2$` en medio de un párrafo → se renderiza como fórmula inline
7. **Múltiples fórmulas**: Varias `$$` separadas en el mismo documento → cada una renderiza independientemente
8. **Código protegido**: `` `$$x=1$$` `` en inline code → se muestra como código literal, no como math
9. **`npx tsc --noEmit`**: Sin errores de tipos
10. **`npm run build`**: Compilación exitosa (vite build, 2901 módulos transformados)

**Comportamiento esperado del pegado**:
- Texto plano con `$$...$$` → se crea automáticamente un bloque mathBlock renderizado con KaTeX
- Texto plano con `$...$` → se crea automáticamente un nodo mathInline renderizado
- HTML externo con `<pre><code>` → preservado como bloque de código (no afectado)
- Inline code con `` `$$...$$` `` → preservado como código literal (no se procesa como math)

**Observaciones futuras**:
- El inline math regex `(?<!\$)\$(\S[^$\n]*?)\$(?!\$)` puede producir falsos positivos con contenido tipo `$5.00` (precios en dólares). Para usos matemáticos reales funciona correctamente. Si se necesitan símbolos de dólar literales, usar `\$`.
- `MathBlockComponent` y `MathInlineComponent` usan `(window as any).katex` cargado asincrónicamente. Si KaTeX no está cargado cuando el nodo se monta, muestra el LaTeX en texto plano como fallback. Al cambiar `node.attrs.tex` (ej. editar), el `useEffect` re-ejecuta y renderiza con KaTeX si ya está disponible.
- Si en el futuro se agregan InputRules para escritura manual de `$$`, la UX sería más completa. Actualmente el usuario puede usar el slash command (`/`) o command palette (`Ctrl+Shift+P`) para insertar fórmulas, o escribir `$$...$$` en el Markdown source mode.

### 2026-06-24 — Corrección de Pegado: ChatGPT como CodeBlock

**Bug detectado**: Al copiar contenido desde ChatGPT y pegarlo en Marknote, todo el contenido se insertaba como un bloque de código único. Encabezados, listas, tablas y fórmulas matemáticas no se interpretaban.

**Ejemplo**:
- Copiado: `## Título`, `1. Paso 1`, `$$x+y=7$$`
- Resultado actual: todo dentro de `<pre><code>`, sin renderizado Markdown
- Resultado esperado: H2, lista ordenada, bloque matemático renderizado

**Análisis realizado**:

1. Se inspeccionó el flujo de pegado de ProseMirror en `editorProps` de `App.tsx` (L105-147).
2. No existía `handlePaste`, `transformPastedHTML` ni `transformPastedText` — el pegado usaba el comportamiento default de ProseMirror.
3. Se determinó que ChatGPT (y otras aplicaciones web) colocan en el portapapeles `text/html` con el contenido envuelto en `<pre><code>...contenido...</code></pre>`, incluso para texto que no es código.
4. ProseMirror mapea `<pre>` → `codeBlock` mediante la regla `parseHTML` de `@tiptap/extension-code-block` (`{ tag: 'pre', preserveWhitespace: 'full' }`).
5. El contenido completo terminaba dentro de un solo nodo `codeBlock`, impidiendo la interpretación de Markdown.

**Diferencias entre fuentes de pegado**:
- **Bloc de Notas**: solo provee `text/plain` — no hay `<pre>`, no hay transformación. Se inserta como párrafos.
- **VS Code**: provee `text/html` con `<pre><code><span class="hljs-...">...</span></code></pre>` — contiene hijos HTML (syntax highlighting), no se desempaqueta.
- **ChatGPT**: provee `text/html` con `<pre><code>contenido texto plano sin spans</code></pre>` — Sin hijos HTML → se desempaqueta para interpretar Markdown.

**Causa raíz**:
ChatGPT envuelve su contenido en `<pre><code>` incluso para Markdown no-code. ProseMirror mapea `<pre>` → `codeBlock` terminando con todo en un bloque de código.

**Solución aplicada**:

**Archivo modificado**: `src/renderer/src/App.tsx` — dentro de `editorProps`.

Se agregó `transformPastedHTML` (L148-167) con la siguiente lógica:

1. **Detectar `<pre><code>`**: Si el HTML pegado contiene un `<pre>` con un `<code>` sin hijos HTML (syntax highlighting spans), se extrae el texto.
2. **Validar que parezca Markdown** (`looksLikeMarkdown`): Regex que detecta patrones como `# `, `## `, `- `, `* `, `> `, `[ ]`, `[x]`, `1. `, `|...|`, `$$`. Si no hay coincidencia, se devuelve el HTML original intacto (preservando code blocks legítimos).
3. **Convertir a HTML interpretado**: Si el texto parece Markdown, se pasa por `mdToHtml()` que interpreta encabezados, listas, tablas, fórmulas `$$...$$`, etc. El HTML resultante es insertado por ProseMirror.

```typescript
transformPastedHTML: (html) => {
  const looksLikeMarkdown = (text: string): boolean => {
    return /(?:^|\n)\s*(?:#{1,6}\s|[-*]\s|>\s|\[\s?\]|\d+\.\s+\S|\|.+\||\$\$)/m.test(text)
  }
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const pre = doc.body.querySelector('pre')
  if (!pre) return html
  const code = pre.querySelector('code')
  const el = code?.children.length === 0 ? code :
             !code && pre.children.length === 0 ? pre : null
  if (!el) return html
  const text = el.textContent || ''
  return looksLikeMarkdown(text) ? mdToHtml(text) : html
}
```

**Por qué esta solución**:
- **No elimina CodeBlock**: solo se desempaqueta `<pre><code>` cuando el contenido parece Markdown.
- **No rompe pegado de código real**: VS Code incluye `<span>` de syntax highlighting → `children.length > 0` → no se desempaqueta.
- **No afecta pegado desde Bloc de Notas**: solo provee `text/plain`, no pasa por `transformPastedHTML`.
- **No agrega dependencias**: `DOMParser` es nativo del navegador (Chromium/Electron).
- **Reutiliza `mdToHtml`**: ya existente en `markdown.ts` y correctamente configurado con `preprocessMath` y `preprocessTaskLists`.

**Pruebas realizadas**:

| Caso | Origen | Resultado |
|---|---|---|
| 1 | ChatGPT con `## Título`, `- lista`, `$$x+y=7$$` | Markdown interpretado: H2, lista, math renderizado |
| 2 | Bloc de Notas (texto plano) | Párrafos insertados normalmente |
| 3 | VS Code (código con syntax highlighting) | CodeBlock preservado con resaltado sintáctico |
| 4 | Página web con `<pre><code>` y Markdown (tablas, encabezados) | Markdown interpretado correctamente |
| 5 | Página web con `<pre><code>` sin Markdown (texto legítimo en pre) | CodeBlock preservado intacto |
| 6 | ChatGPT con contenido mixto: headings + listas + math | Todo renderiza: H2, listas, fórmulas KaTeX |
| 7 | `npx tsc --noEmit` | Sin errores de tipos |
| 8 | `npm run build` | Compilación exitosa |

**Comportamiento esperado final**:
- **ChatGPT (Markdown)**: `transformPastedHTML` desempaqueta `<pre><code>`, `mdToHtml` interpreta → encabezados, listas, tablas, fórmulas renderizadas.
- **Bloc de Notas**: Sin `text/html`, ProseMirror usa `text/plain` directamente, inserta párrafos.
- **VS Code**: `<pre><code><span>...</span></code>` → `children.length > 0` → `el = null` → HTML original → codeBlock con syntax highlighting.
- **Web con `<pre><code>` sin spans**: Si el texto parece Markdown → interpretado. Si no → codeBlock preservado.
- **Fórmulas matemáticas `$$...$$`**: Al pasar por `mdToHtml`, `preprocessMath` las convierte en `<div data-math-block>`, que Tiptap renderiza con KaTeX.

**Observaciones futuras**:
- El regex `looksLikeMarkdown` puede refinarse si aparecen falsos positivos/negativos con patrones Markdown adicionales (ej. `---` para HR, `` ``` `` para code fences).
- La validación de `children.length === 0` asume que syntax lighting usa elementos HTML hijo. Si algún sistema usa solo atributos o text-decoration, podría no detectarse correctamente. Hasta ahora VS Code, GitHub, y Stack Overflow usan `<span>` con clases CSS.
- `DOMParser` está disponible en el proceso renderer de Electron 30+ sin configuración adicional.

---

### 2026-06-24 — Bug: Pérdida de Contenido Matemático al Abrir Archivos

**Síntoma**: Al abrir archivos .md existentes con contenido matemático (`$$x+y=7$$`, `$E=mc^2$`), las fórmulas no se renderizaban con KaTeX. El bloque matemático aparecía vacío (textarea en lugar de fórmula) y, al guardar o interactuar con el editor, el contenido se perdía permanentemente (reemplazado por `$$\n\n$$`).

**Hipótesis evaluadas**:
1. `preprocessMath` no procesa el regex correctamente → ❌ (el HTML generado es correcto: `data-tex` poblado)
2. markdown-it envuelve `<div>` en `<p>` → ❌ (html:true respeta HTML blocks)
3. `onUpdate` con `switchingTab` race condition → ❌ (el flag protege correctamente)
4. `setTimeout(50ms)` en `loadTabIntoEditor` → ❌ (no afecta la parseada de atributos)
5. **Tiptap `addAttributes` no parsea `data-tex`** → ✅ **confirmada**

**Análisis del flujo completo**:

1. **Lectura del archivo**: `window.api.readFile(path)` → `"$$x+y=7$$"`
2. **`mdToHtml()`** → `preprocessMath` → `<div data-math-block data-tex="x+y=7"></div>`
3. **`editor.commands.setContent(html)`**:
   - `parseHTML: div[data-math-block]` → ✅ matchea el tag
   - Atributo `tex`: Tiptap busca `node.getAttribute('tex')` por defecto → **no existe** (el HTML tiene `data-tex`)
   - `tex` = `''` ← **pérdida aquí**
4. **NodeView**: `node.attrs.tex` es `''` (falsy) → muestra `<textarea>` vacío
5. **Primer `onUpdate`** (click, tecleo, o save):
   - `editor.getHTML()` → `renderHTML` produce `<div tex="" data-math-block="">` (atributo `tex`, no `data-tex`)
   - `htmlToMd()` → turndown rule `mathBlock` busca `data-tex` → **no lo encuentra** → `tex = ''` → `$$\n\n$$`
   - `setTabs` guarda `$$\n\n$$` → **contenido irrecuperable**

**Causa raíz**:

`MathBlock.tsx:11-13` y `MathInline.tsx:11-13`: `addAttributes({ tex: { default: '' } })` sin `parseHTML`/`renderHTML` explícitos. Por defecto Tiptap:
- **Parse**: busca atributo HTML `tex` (no `data-tex`)
- **Render**: escribe atributo HTML `tex` (no `data-tex`)

Inconsistencia con:
- `preprocessMath()` que genera `data-tex`
- turndown rule `mathBlock` que lee `data-tex`

**Archivos modificados**:

- `src/renderer/src/extensions/MathBlock.tsx` — `addAttributes()`
- `src/renderer/src/extensions/MathInline.tsx` — `addAttributes()`

**Solución aplicada**:

En ambos archivos, agregar `parseHTML` y `renderHTML` explícitos al atributo `tex`:

```typescript
addAttributes() {
  return {
    tex: {
      default: '',
      parseHTML: (el) => el.getAttribute('data-tex'),
      renderHTML: (attrs) => ({ 'data-tex': attrs.tex })
    }
  }
},
```

**Por qué esta solución**:
- Modificación mínima: 3 líneas adicionales por archivo
- Sin dependencias nuevas
- Sin tocar KaTeX, markdown.ts, ni flujo de apertura
- Cierra el gap entre `preprocessMath` (escribe `data-tex`) y Tiptap (espera `data-tex`)
- Cierra el gap entre renderHTML (escribe `data-tex`) y turndown (lee `data-tex`)

**Revisión de extensiones similares**:
| Extensión | `addAttributes` | `parseHTML` | ¿Bug real? |
|---|---|---|---|
| `MathBlock` | `tex: { default: '' }` | `div[data-math-block]` | ✅ **Corregido** |
| `MathInline` | `tex: { default: '' }` | `span[data-math-inline]` | ✅ **Corregido** |
| `MermaidBlock` | `code: { default: '' }` | `div[data-mermaid]` | ❌ No (no hay preprocessMermaid) |
| `VideoBlock` | `src, type, width, height, align` | `div[data-video-block]` | ❌ No (inserción interactiva) |
| `ResizableImage` | `src, alt, width, height, align` | `div[data-resizable-image]`, `img` | ❌ No (inserción interactiva) |

**Pruebas realizadas**:

| # | Escenario | Resultado |
|---|---|---|
| 1 | Abrir archivo `.md` existente con `$$x+y=7$$` (bloque) | ✅ KaTeX renderizado |
| 2 | Abrir archivo `.md` existente con `$E=mc^2$` (inline) | ✅ Inline renderizado |
| 3 | Guardar → cerrar → reabrir (persistencia bloque) | ✅ `$$x+y=7$$` intacto |
| 4 | Guardar → cerrar → reabrir (persistencia inline) | ✅ `$E=mc^2$` intacto |
| 5 | Documento mixto (texto + listas + fórmulas bloque + inline) | ✅ Todo renderiza |
| 6 | Source mode (Ctrl+Shift+M): `$$x+y=7$$` visible | ✅ Sintaxis preservada |
| 7 | Source mode → volver a WYSIWYG | ✅ Fórmula renderizada |
| 8 | `npx tsc --noEmit` | ✅ Sin errores de tipos |
| 9 | `npm run build` | ✅ Compilación exitosa |

**Comportamiento esperado final**:
- Archivos .md con `$$...$$` y `$...$` se cargan correctamente y se renderizan con KaTeX
- El ciclo guardar → cerrar → reabrir preserva el contenido matemático
- Source mode muestra la sintaxis original
- Sin regresión en otros componentes (listas, checklists, imágenes, código)

---

### 2026-06-24 — Bug: Primer Documento Sin Pestaña Visible

**Síntoma**: Al abrir Marknote y crear el primer documento (nuevo o desde WelcomeScreen), no aparecía ninguna pestaña visible. El usuario no podía identificar el documento activo, cerrarlo ni visualizar cambios pendientes. Al abrir un segundo documento, las pestañas aparecían normalmente.

**Análisis realizado**:

1. Se revisó el flujo de creación de documentos: `createTab()` produce `{ id, filePath: null, content: '', modified: false }` para un documento nuevo.
2. Se revisó el renderizado de `TabBar` en `App.tsx:863`: el componente siempre se renderiza, sin condiciones.
3. Se encontró la condición exacta en `TabBar.tsx:23`:
   ```typescript
   if (tabs.length <= 1 && !tabs[0]?.filePath && !tabs[0]?.modified) return null
   ```
4. Esta condición oculta el TabBar cuando hay una sola pestaña sin archivo asociado (`filePath === null`) y sin modificaciones (`modified === false`).

**Causa raíz**:

`TabBar.tsx:23`: el early return fue diseñado intencionalmente para "reducir ruido visual para documentos nuevos vacíos" (documentado en `DOCUMENTACION.md:1785`). Sin embargo:

- El botón cerrar (×) se había habilitado para todas las pestañas (incluyendo la primera) en una corrección previa, pero el TabBar nunca se mostraba para activarlo.
- El indicador de modificado (●) no era visible porque el TabBar estaba oculto.
- El título del documento no era identificable.

| Condición | tabs.length | filePath | modified | ¿TabBar visible? |
|---|---|---|---|---|
| 0 tabs, WelcomeScreen | 0 | - | - | ❌ (correcto) |
| 1 tab nuevo, sin modificar | 1 | null | false | ❌ **bug** |
| 1 tab nuevo + modificado | 1 | null | true | ✅ |
| 1 archivo abierto | 1 | "/path/doc.md" | false | ✅ |
| Múltiples tabs | ≥2 | cualquier | cualquier | ✅ |

**Archivo modificado**:

- `src/renderer/src/components/TabBar.tsx` — línea 23

**Cambio aplicado**:

```diff
-  if (tabs.length <= 1 && !tabs[0]?.filePath && !tabs[0]?.modified) return null
+  if (tabs.length === 0) return null
```

**Por qué esta solución**:
- Modificación mínima: 1 línea
- Sin cambios en `App.tsx` ni en ningún otro archivo
- Sin reescribir el sistema de tabs
- El TabBar se muestra siempre que haya al menos un documento
- Sigue ocultándose cuando no hay tabs (WelcomeScreen visible)

**Pruebas realizadas**:

| # | Escenario | Resultado |
|---|---|---|
| 1 | 0 pestañas → WelcomeScreen | ✅ TabBar oculto, WelcomeScreen visible |
| 2 | 1 documento nuevo (sin tocar) | ✅ `[Sin título] [×]` visible |
| 3 | 1 documento nuevo + escribir → ● | ✅ `[Sin título ●] [×]`, indicador visible |
| 4 | 1 archivo abierto desde disco | ✅ `[doc.md] [×]` visible |
| 5 | Múltiples pestañas (arrastrar, cerrar, seleccionar) | ✅ comportamiento normal |
| 6 | Cerrar última pestaña → WelcomeScreen | ✅ vuelve correctamente a WelcomeScreen |
| 7 | Botón cerrar [×] en el primer documento | ✅ visible y funcional |
| 8 | `npx tsc --noEmit` | ✅ Sin errores de tipos |
| 9 | `npm run build` | ✅ Compilación exitosa |

**Comportamiento esperado final**:
- Siempre hay una pestaña visible cuando hay al menos un documento abierto
- El botón [×] está disponible en el primer documento
- El indicador ● aparece al modificar el contenido
- El título del documento ("Sin título" o nombre del archivo) es visible
- WelcomeScreen sigue mostrándose correctamente cuando no hay documentos
