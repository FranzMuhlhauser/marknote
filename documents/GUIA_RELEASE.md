# Guía de Testing, Build y Release — Marknote

> Guía paso a paso para probar la aplicación, detectar errores, empaquetar a .exe y subir un Release a GitHub.

---

## Índice

1. [Pre-requisitos](#1-pre-requisitos)
2. [Paso 1: TypeScript Check](#2-paso-1-typescript-check)
3. [Paso 2: Build de compilación](#3-paso-2-build-de-compilación)
4. [Paso 3: Test manual en desarrollo](#4-paso-3-test-manual-en-desarrollo)
5. [Paso 4: Corrección de errores](#5-paso-4-corrección-de-errores)
6. [Paso 5: Empaquetar a .exe](#6-paso-5-empaquetar-a-exe)
7. [Paso 6: Probar el instalador](#7-paso-6-probar-el-instalador)
8. [Paso 7: Publicar Release en GitHub](#8-paso-7-publicar-release-en-github)
9. [Checklist rápido](#9-checklist-rápido)

---

## 1. Pre-requisitos

Antes de empezar, asegúrate de tener:

- **Node.js v24.16.0+** instalado
- **npm 11.13.0+** instalado
- **Git** instalado y configurado
- Acceso al repositorio en GitHub
- Una terminal (PowerShell, CMD o bash)

Verifica:

```bash
node --version   # → v24.16.0+
npm --version    # → 11.13.0+
git --version
```

---

## 2. Paso 1: TypeScript Check

Siempre lo primero. Verifica que no haya errores de tipos:

```bash
npm run typecheck
```

**Esperado:** salida limpia (sin errores).
**Si hay errores:** léelos, corrige los archivos mencionados y repite.

---

## 3. Paso 2: Build de compilación

Compila todo el proyecto (main + preload + renderer):

```bash
npm run build
```

**Esperado:** mensaje `✓ built in Xs` sin errores.

Esto genera los archivos en `out/`:
- `out/main/index.js`
- `out/preload/index.js`
- `out/renderer/` (carpeta con el frontend compilado)

---

## 4. Paso 3: Test manual en desarrollo

Ejecuta la app en modo desarrollo para probar todas las funcionalidades:

```bash
npm run dev
```

### Checklist de prueba manual

Marca cada item después de probarlo:

#### Funcionalidades básicas
- [ ] La ventana se abre sin errores en la consola de DevTools
- [ ] Aparece la pantalla de bienvenida (Crear Documento / Abrir Documento)
- [ ] Click en "Crear Documento" abre una pestaña en blanco
- [ ] Se puede escribir en el editor WYSIWYG
- [ ] Ctrl+S guarda el archivo
- [ ] Ctrl+O abre un archivo .md existente

#### Formato
- [ ] Negrita (Ctrl+B) — se ve en negrita
- [ ] Cursiva (Ctrl+I) — se ve en cursiva
- [ ] Subrayado (Ctrl+U) — se ve subrayado
- [ ] Encabezados H1, H2, H3 (Ctrl+1, Ctrl+2, Ctrl+3)
- [ ] Listas con viñetas y numeradas
- [ ] Listas de tareas (checkboxes funcionales)
- [ ] Citas (blockquote con barra izquierda)
- [ ] Línea horizontal

#### Tablas
- [ ] Insertar tabla desde el toolbar o menú Insertar
- [ ] Escribir dentro de las celdas
- [ ] Click derecho → menú contextual
- [ ] Insertar fila arriba/abajo
- [ ] Insertar columna izquierda/derecha
- [ ] Eliminar fila, columna, tabla completa
- [ ] Combinar celdas y dividir celda

#### Bloques de código
- [ ] Insertar bloque de código
- [ ] El bloque muestra el lenguaje (default: text)
- [ ] Click en el lenguaje → se puede editar
- [ ] Botón Copy — copia al portapapeles, muestra "✓ Copied"
- [ ] Botón Collapse — colapsa/expande el bloque
- [ ] El resaltado de sintaxis funciona (probar con js, python, html)

#### Imágenes
- [ ] Insertar imagen desde el toolbar
- [ ] La imagen se muestra en el editor
- [ ] Aparece toolbar flotante al pasar el mouse
- [ ] Botones de alineación (izquierda, centro, derecha) funcionan
- [ ] Handles de redimensionar (esquina, bordes) funcionan
- [ ] Doble click → editor de alt text
- [ ] Arrastrar y soltar imagen desde el explorador de archivos

#### KaTeX (matemáticas)
- [ ] Insertar fórmula inline desde el toolbar
- [ ] Insertar bloque de fórmula
- [ ] La fórmula se renderiza correctamente
- [ ] Se puede editar la fórmula

#### Mermaid (diagramas)
- [ ] Insertar diagrama Mermaid
- [ ] Se renderiza el SVG
- [ ] Se puede editar el código

#### Archivos y explorador
- [ ] Abrir carpeta desde el explorador
- [ ] Los archivos .md aparecen en la sección Proyecto
- [ ] Click en un archivo → se abre en nueva pestaña
- [ ] Crear archivo nuevo (botón 📄+)
- [ ] Crear carpeta nueva (botón 📁+)
- [ ] Click derecho en archivo → Renombrar
- [ ] Click derecho → Duplicar
- [ ] Click derecho → Eliminar (pide confirmación)
- [ ] Arrastrar archivo entre secciones
- [ ] Marcar/desmarcar favoritos con estrella

#### Pestañas
- [ ] Se abren múltiples pestañas
- [ ] Click en pestaña → cambia de documento
- [ ] Arrastrar pestaña para reordenar (aparece línea azul)
- [ ] Click derecho en pestaña → menú contextual
- [ ] "Cerrar otros" funciona
- [ ] "Cerrar a la derecha" funciona
- [ ] "Cerrar todos" funciona (vuelve a pantalla de bienvenida)
- [ ] "Cerrar guardados" funciona

#### Temas
- [ ] Botón ◐ en toolbar cicla temas
- [ ] Configuración → Apariencia → seleccionar cada tema
- [ ] Temas: Claro, Oscuro, Nord, Dracula, Solarized, GitHub
- [ ] Tema personalizado: elegir colores, guardar, preview

#### Modo enfoque
- [ ] Activar desde menú Ver o botón ◎
- [ ] Sidebars y barras se atenúan
- [ ] Al pasar el mouse reaparecen

#### Barra de estado
- [ ] Muestra formato (WYSIWYG/Markdown)
- [ ] Muestra UTF-8
- [ ] Muestra línea y columna actual
- [ ] Muestra cantidad de palabras
- [ ] Muestra tiempo de lectura
- [ ] Muestra estado de guardado (✓ / ●)

#### Menú
- [ ] Archivo → Nuevo, Abrir, Guardar, Guardar Como, Exportar HTML, Exportar PDF
- [ ] Editar → Deshacer, Rehacer, Cortar, Copiar, Pegar, Buscar
- [ ] Ver → Tema Claro, Oscuro, Modo Enfoque, Pantalla Completa, Mostrar Índice
- [ ] Insertar → Tabla, Imagen, Código, Mermaid, Fórmula, Enlace
- [ ] Herramientas → Configuración, Estadísticas
- [ ] Ayuda → Paleta de Comandos

#### Paleta de comandos (Ctrl+Shift+P)
- [ ] Se abre la paleta
- [ ] Filtra comandos al escribir
- [ ] Navegación con flechas
- [ ] Enter ejecuta el comando seleccionado

#### Exportación
- [ ] Exportar HTML → descarga un .html
- [ ] Exportar PDF → descarga un .pdf

#### Varios
- [ ] F11 activa/desactiva pantalla completa
- [ ] Vista fuente (toggle 📄/📝 en titlebar)
- [ ] Escape cierra diálogos
- [ ] Estadísticas se muestran en panel lateral

### Cómo abrir DevTools

Mientras la app está corriendo con `npm run dev`, puedes abrir las DevTools de Electron:

```bash
# En el código, descomentar o agregar en src/main/index.ts:
# mainWindow.webContents.openDevTools()
```

O simplemente presiona `Ctrl+Shift+I` si está habilitado.

Revisa la **consola** (pestaña Console) en busca de errores rojos.

---

## 5. Paso 4: Corrección de errores

Si encuentras errores:

1. **Error de TypeScript** → corrige los tipos, corre `npm run typecheck` de nuevo
2. **Error de build** → revisa el mensaje, corrige, corre `npm run build` de nuevo
3. **Error en runtime** (consola roja) → abre DevTools, identifica el componente/file, corrige
4. **Error de funcionalidad** → la feature no se comporta como esperas, revisa el código relevante

Después de cada corrección, repite desde el **Paso 1**.

---

## 6. Paso 5: Empaquetar a .exe

Una vez que todo funciona, empaqueta la aplicación:

```bash
npm run package:win
```

### Qué hace este comando:

1. Ejecuta `electron-vite build` (compila el código)
2. Ejecuta `electron-builder --win` (empaqueta en .exe)

### Output

Los archivos generados quedan en `dist-electron/`:

```
dist-electron/
├── win-unpacked/               # Versión portátil (carpeta)
│   ├── Marknote.exe            # Ejecutable directo
│   ├── resources/
│   └── ...
├── Marknote Setup X.X.X.exe    # Instalador NSIS
└── builder-effective-config.yaml
```

El archivo importante es **`Marknote Setup X.X.X.exe`**.

### Troubleshooting de empaquetado

Si `npm run package:win` falla:

**Error común: "cannot find module"**
```bash
# Asegúrate de haber hecho build primero
npm run build
# Luego empaqueta
npx electron-builder --win
```

**Error común: "NSIS not found"**
```bash
# electron-builder descarga NSIS automáticamente, pero si falla:
npx electron-builder --win --config.nsis.unicode=true
```

**Error común: "Icon not found"**
Asegúrate de que exista `resources/icon.png` y `resources/icon.ico`.

---

## 7. Paso 6: Probar el instalador

Antes de publicar, instala el .exe en una máquina limpia (o una VM):

1. Ejecuta `Marknote Setup X.X.X.exe`
2. Sigue el wizard de instalación
3. Abre la aplicación desde el acceso directo
4. Prueba las funcionalidades principales:
   - [ ] La app se abre sin errores
   - [ ] Se puede crear un documento nuevo
   - [ ] Se puede abrir un archivo .md
   - [ ] Se puede guardar
   - [ ] Los temas funcionan
   - [ ] Cerrar y volver a abrir la app (persistencia de settings)

---

## 8. Paso 7: Publicar Release en GitHub

### 8.1. Actualizar versión

Edita `package.json` y cambia el campo `version`:

```json
{
  "version": "0.2.0"
}
```

### 8.2. Actualizar version check en App.tsx

En `src/renderer/src/App.tsx`, busca esta línea:

```tsx
if (info && info.tag !== 'v0.1.1') setUpdateInfo(info)
```

Cámbiala a la nueva versión:

```tsx
if (info && info.tag !== 'v0.2.0') setUpdateInfo(info)
```

### 8.3. Hacer commit

```bash
# Ver qué archivos cambiarón
git status

# Agregar todo
git add .

# Commit con mensaje
git commit -m "v0.2.0: ... (descripción de los cambios)"

# Push
git push origin main
```

### 8.4. Crear el Release en GitHub

Opción A — Desde la web:

1. Ve a https://github.com/FranzMuhlhauser/marknote/releases
2. Click en **"Draft a new release"**
3. **Tag:** `v0.2.0` (precedido con `v`)
4. **Target:** `main`
5. **Title:** `v0.2.0`
6. **Description:** Escribe el changelog (resumen de cambios desde la versión anterior). Ejemplo:

```markdown
## v0.2.0 — 2026-06-18

### Nuevo
- Menú contextual en tablas (insertar/eliminar filas/columnas, combinar/dividir)
- Bloques de código con botón Copy y Collapse/Expand
- Imágenes redimensionables con handles de arrastre, alineación y alt text
- Tema personalizado (editor de colores en Configuración)
- Sección Plugins en Configuración
- Operaciones avanzadas en explorador: crear, renombrar, duplicar, eliminar, drag & drop
- Reordenar pestañas por arrastre
- Menú contextual en pestañas (cerrar, cerrar otros, cerrar derecha, cerrar todos, cerrar guardados)

### Mejoras
- Interfaz completa traducida al español
- 6 temas visuales (Claro, Oscuro, Nord, Dracula, Solarized, GitHub)
- Nuevos IPC handlers: createFolder, rename, duplicate, delete, move
```

7. **Attach binaries:** Arrastra el archivo `Marknote Setup X.X.X.exe` desde `dist-electron/`
8. Click en **"Publish release"**

Opción B — Desde CLI con GitHub CLI:

```bash
# Instalar gh CLI si no lo tienes: https://cli.github.com/
gh release create v0.2.0 \
  "./dist-electron/Marknote Setup 0.2.0.exe" \
  --title "v0.2.0" \
  --notes "## Cambios\n- Descripción de los cambios..."
```

### 8.5. Verificar

- [ ] El Release aparece en GitHub
- [ ] El .exe está adjunto
- [ ] Al abrir la app, aparece el botón ⬇ con la nueva versión

---

## 9. Checklist rápido

Para un release rápido, sigue esta secuencia mínima:

```bash
# 1. Verificar tipos
npm run typecheck

# 2. Compilar
npm run build

# 3. Probar en desarrollo
npm run dev
# → Prueba las features principales por 5 min

# 4. Empaquetar
npm run package:win

# 5. Probar el instalador
# → Ejecuta el .exe generado, prueba 2-3 features

# 6. Publicar
# → Sube a GitHub Releases con el .exe adjunto
```

---

## Notas adicionales

- **Versión del instalador:** electron-builder toma la versión de `package.json`
- **Icono:** debe estar en `resources/icon.png` (256x256) y `resources/icon.ico`
- **Actualización automática:** al iniciar la app, consulta `https://api.github.com/repos/FranzMuhlhauser/marknote/releases/latest` y compara con la versión actual
- **Siempre corre `npm run typecheck` y `npm run build`** antes de empaquetar
