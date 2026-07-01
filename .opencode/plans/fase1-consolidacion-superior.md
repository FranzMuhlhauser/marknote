# Fase 1: Consolidación de la parte superior

## Estado
✅ **COMPLETADO** (2026-07-02)

## Objetivo
Reducir de 5 barras a 3 en la zona superior, eliminar duplicación y reorganizar la toolbar.

## Verificación
Este plan fue revisado el 2026-07-02. Todos los cambios propuestos ya estaban implementados:
- ✅ MenuBar.tsx: ya tiene title, modified, updateStatus, drag region
- ✅ Toolbar.tsx: ya no tiene onFullscreen, ya tiene onToggleSource
- ✅ App.tsx: no existe `<header className="titlebar">`
- ✅ App.css: ya tiene `-webkit-app-region: drag` en menubar
- ✅ La reorganización de la toolbar fue superada por una simplificación más radical (2026-06-22)

**El plan fue superado por cambios posteriores. No requiere implementación adicional.**

---

## Cambios necesarios (histórico)

### 1. MenuBar.tsx
**Añadir props**: `title`, `modified`, `updateInfo`, `onUpdate`
**Añadir layout**: título a la izquierda, update a la derecha, drag region en el nav
**Mantener**: todos los menús existentes

### 2. Toolbar.tsx  
**Eliminar prop**: `onFullscreen`
**Añadir prop**: `onToggleSource`
**Reorganizar grupos**:
```
Archivo: Nuevo, Guardar
Edición: Deshacer, Rehacer
Formato: B, I, U, S
Estructura: H1, H2, H3, Lista, ☑
Contenido: {}, ⊞, 🖼, 🔗, ◈, ∫
Vista: ◐, ◎, 📄, ⚙
```

### 3. App.tsx
**Eliminar**: `<header className="titlebar">...</header>` (líneas 453-466)
**Actualizar**: props de MenuBar (title, modified, updateInfo, onUpdate)
**Actualizar**: props de Toolbar (onToggleSource, eliminar onFullscreen)
**Actualizar**: botón de update movido al menubar

### 4. App.css
**Eliminar**: `.focus-mode .titlebar-actions` de focus mode
**Añadir**: `.menubar` con `-webkit-app-region: drag`
**Añadir**: `.menubar-item` con `-webkit-app-region: no-drag`
**Ajustar**: `.titlebar` puede eliminarse o simplificarse
