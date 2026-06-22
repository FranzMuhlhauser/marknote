# Fix: `getMarkdown` TDZ ReferenceError

## Causa

`getMarkdown` (useCallback, línea 330) es referenciada en arrays de dependencias y cuerpos de funciones desde la línea 200 (`saveUnsavedTab`), antes de que la `const` sea inicializada. Esto produce un ReferenceError por Temporal Dead Zone.

## Cambio

Mover `getMarkdown`, `saveDoc` y `saveAsDoc` (líneas 330-360) justo después del cierre de `confirmCloseMultiple` (después de línea 198), antes de `saveUnsavedTab` (línea 200).

## Pasos manuales

En `src/renderer/src/App.tsx`:

1. **Cortar** desde `const getMarkdown = useCallback((` hasta el cierre `}, [activeTab, activeTabId, getMarkdown])` de `saveAsDoc`.

   Específicamente, eliminar este bloque:
   ```ts
     const getMarkdown = useCallback(() => {
       if (showSource) return sourceText
       if (!editor) return ''
       return htmlToMd(editor.getHTML())
     }, [editor, showSource, sourceText])
   
     const saveDoc = useCallback(async () => {
       if (!activeTab) return
       const text = getMarkdown()
       const path = await window.api.saveFile(activeTab.filePath ?? undefined, text)
       if (path) {
         setTabs(prev => prev.map(t =>
           t.id === activeTabId ? { ...t, filePath: path, content: text, modified: false } : t
         ))
         setSourceText(text)
         addRecent(path)
       }
     }, [activeTab, activeTabId, getMarkdown])
   
     const saveAsDoc = useCallback(async () => {
       if (!activeTab) return
       const text = getMarkdown()
       const path = await window.api.saveFile(undefined, text)
       if (path) {
         setTabs(prev => prev.map(t =>
           t.id === activeTabId ? { ...t, filePath: path, content: text, modified: false } : t
         ))
         setSourceText(text)
         addRecent(path)
       }
     }, [activeTab, activeTabId, getMarkdown])
   ```

2. **Pegar** ese bloque entre `confirmCloseMultiple` y `saveUnsavedTab`:

   - Buscar: `  }\n\n  const saveUnsavedTab`
   - Reemplazar con: `  }\n\n` + (bloque pegado) + `\n\n  const saveUnsavedTab`

3. Verificar que `toggleSource` y el `useEffect` del teclado sigan funcionando (sí, porque `getMarkdown` ahora está antes).

## Verificación

```bash
npm run typecheck
npm run build
```
