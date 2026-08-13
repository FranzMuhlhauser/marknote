# Marknote

Editor Markdown WYSIWYG nativo para Windows  
Inspirado en Typora · Construido con Electron + React + TypeScript

[Características](#características) · [Instalación](#instalación) · [Desarrollo](#desarrollo) · [Build](#build-y-empaquetado) · [Atajos](#atajos-de-teclado)

> **Principio Rector de Marknote**  
> Marknote es un editor Markdown que combina la comodidad de una interfaz gráfica con el aprendizaje progresivo. Los botones están ahí para ayudarte hoy, pero el objetivo es que mañana domines Markdown y los necesites cada vez menos.

* * *

## Captura

```
┌──────────────────────────────────────────────────────┐
│  Titlebar                                 [📄] [⬇]  │
├──────────────────────────────────────────────────────┤
│  [Archivo] [Editar] [Ver] [Ayuda]                    │
├──────────────────────────────────────────────────────┤
│  Toolbar: Archivo | Edición | Formato | Vista        │
├──────────────────────────────────────────────────────┤
│  TabBar: [README.md] [Apuntes.md] [Guía.md]          │
├──────────┬───────────────────────────┬────────────────┤
│          │                           │                │
│  📁 Proy │   Editor WYSIWYG          │  📋 Índice     │
│  ★ Favo  │   (960px max-width)       │  • Intro       │
│  🕐 Reci │                           │  • Features    │
│  🗑 Pape │   Escribe en Markdown,    │  • Instalación │
│          │   ve el resultado en vivo  │                │
├──────────┴───────────────────────────┴────────────────┤
│  WYSIWYG | UTF-8 | Línea 23 | 1.200 palabras          │
│                                          | Guardado ✓ │
└──────────────────────────────────────────────────────┘
```

## Características

### Editor Profesional

*   **Edición WYSIWYG** con TipTap/ProseMirror — escribe Markdown, ves el resultado en tiempo real
    
*   **Ancho máximo 960px** centrado, márgenes amplios, tipografía cómoda para largas sesiones
    
*   **Resaltado de línea actual**, scroll suave, cursor visible
    
*   **Vista fuente** para editar Markdown directamente
    
*   **Arrastrar y soltar imágenes** desde el explorador de archivos
    

### Formato Rico

*   Negrita, cursiva, subrayado, tachado, resaltado, código inline
    
*   Encabezados H1–H6, listas ordenadas/desordenadas/de tareas
    
*   Citas, bloques de código, líneas horizontales
    
*   Tablas con menú contextual (insertar/eliminar filas y columnas, combinar/dividir celdas)
    
*   Alineación de texto
    

### Bloques de Código

*   **Resaltado de sintaxis** con lowlight (todos los lenguajes comunes)
    
*   **Botón Copy** con feedback visual
    
*   **Collapse/Expand** para colapsar bloques largos
    
*   **Selector de lenguaje** inline — haz clic en el lenguaje para cambiarlo
    

### Imágenes

*   **Redimensionar** con 3 handles de arrastre (esquina, ancho, alto)
    
*   **Alinear** izquierda/centro/derecha con toolbar flotante
    
*   **Texto alternativo** (alt) — doble clic en la imagen
    
*   **Dimensiones numéricas** precisas
    
*   **Persistencia al guardar** — las imágenes, videos y diagramas Mermaid se conservan en el `.md` (sintaxis `![alt](ruta)` / ```` ```video ```` / ```` ```mermaid ````) y los medios embebidos se escriben en una carpeta `<doc>.assets` junto al archivo
    

### Matemáticas (KaTeX)

*   `$E = mc^2$` para fórmulas inline
    
*   `$$\sum_{n=1}^{\infty} \frac{1}{n^2}$$` para bloques
    
*   Renderizado en tiempo real
    

### Diagramas (Mermaid)

*   Flowcharts, diagramas de secuencia, clases, Gantt, y más
    
*   Editor con vista previa SVG en vivo
    

### Gestión de Archivos

*   **Pestañas** con soporte para múltiples documentos
    
*   **Reordenar pestañas** por arrastre
    
*   **Menú contextual en pestañas**: cerrar, cerrar otros, cerrar a la derecha, cerrar todos, cerrar guardados
    
*   **Explorador lateral** con Favoritos ★, Recientes 🕐, Proyecto 📂, Papelera 🗑
    
*   **Operaciones avanzadas**: crear archivo/carpeta, renombrar, duplicar, eliminar, arrastrar y soltar
    
*   **Guardado manual** (Ctrl+S) con confirmación al salir si hay cambios sin guardar
    
*   **Importar CSV/TSV** como tabla Markdown (menú Archivo o drag & drop)
    

### Temas

*   **2 temas predefinidos**: Claro y Oscuro
    

### Modo Enfoque

*   Atenúa todo el chrome de la aplicación
    
*   Los elementos reaparecen al pasar el cursor
    

### Más

*   **Paleta de comandos** (Ctrl+Shift+P) con 20+ comandos
    
*   **Búsqueda y reemplazo** (Ctrl+F)
    
*   **Exportar a HTML y PDF**
    
*   **Pantalla completa** (F11)
    
*   **Actualizaciones automáticas** vía GitHub Releases
    
*   **Interfaz completa en español**
    

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | React 19, TypeScript, Vite 5 |
| Editor | TipTap 2.x (ProseMirror) |
| Desktop | Electron 33 |
| Markdown | markdown-it, Turndown |
| Math | KaTeX |
| Diagrams | Mermaid |
| Export PDF | html2canvas + jsPDF |
| Build | electron-vite, electron-builder |

## Instalación

### Requisitos

*   Node.js v24.16.0+
    
*   npm 11.13.0+
    

### Desde el instalador (Windows)

Descarga el `.exe` desde [Releases](https://github.com/FranzMuhlhauser/marknote/releases) y ejecuta el instalador.

### Desde el código fuente

```bash
# Clonar
git clone https://github.com/FranzMuhlhauser/marknote.git
cd marknote

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

## Desarrollo

```bash
# Hot reload
npm run dev

# Type-check
npm run typecheck

# Compilar todo
npm run build

# Empaquetar para Windows
npm run package:win
```

El comando `package:win` genera un instalador NSIS en `dist-electron/`.

## Atajos de Teclado

| Atajo | Acción |
|---|---|
| `Ctrl+N` | Nuevo documento |
| `Ctrl+O` | Abrir archivo |
| `Ctrl+S` | Guardar |
| `Ctrl+Shift+S` | Guardar como |
| `Ctrl+Z` / `Ctrl+Y` | Deshacer / Rehacer |
| `Ctrl+F` | Buscar y reemplazar |
| `Ctrl+Shift+P` | Paleta de comandos |
| `Ctrl+B` | Negrita |
| `Ctrl+I` | Cursiva |
| `Ctrl+U` | Subrayado |
| `Ctrl+Shift+M` | Alternar vista fuente Markdown |
| `Ctrl+Shift+O` | Abrir carpeta |
| `F9` | Explorador de archivos |
| `F11` | Modo Enfoque |
| `Escape` | Cerrar diálogos |
| `Tab` (en tabla) | Siguiente celda; en la última añade fila |
| `Shift+Tab` (en tabla) | Salir de la tabla |

## Roadmap

- [x] Editor WYSIWYG con Markdown en vivo
- [x] Tablas, listas de tareas, bloques de código
- [x] KaTeX (matemáticas) y Mermaid (diagramas)
- [x] Explorador de archivos con operaciones avanzadas
- [x] Múltiples pestañas con arrastre y menú contextual
- [x] Temas (6 predefinidos + personalizado)
- [x] Imágenes redimensionables con alineación y alt text
- [x] Menú contextual en tablas
- [x] Exportar HTML y PDF
- [x] Menú contextual en tablas (añadir/eliminar filas/columnas)
- [x] Bloques de código con copiar/colapsar
- [x] Atajos de navegación entre pestañas (Ctrl+Tab)
- [ ] Buscador de archivos en el explorador
- [ ] Plugins: sistema de extensiones
- [ ] Temas comunitarios

> **Windows**: al abrir el instalador, SmartScreen muestra "Windows protegió tu PC" con un botón azul "Más información" → "Ejecutar de todas formas". Es un clic extra, no bloquea la instalación.

* * *

Hecho con ❤️ por Franz Muhlhauser · MIT License