# Seguridad en Electron — checklist de auditoría

Electron combina un runtime de Node.js con contenido web renderizado, así que hereda los riesgos de ambos mundos. Estos son los puntos que más frecuentemente generan vulnerabilidades reales (no teóricas) en apps Electron. Revísalos en el proceso main, en cada `BrowserWindow`/`webPreferences`, y en el preload script.

## 1. Aislamiento del proceso renderer

Busca la configuración de `webPreferences` en cada `BrowserWindow`:

- `nodeIntegration: true` — si está activo en una ventana que carga contenido que no controlas al 100% (incluyendo Markdown/HTML generado por el usuario y renderizado sin sanitizar), es **crítico**: cualquier XSS se convierte en ejecución de código arbitrario con acceso a Node.
- `contextIsolation: false` — rompe la separación entre el mundo del preload y el mundo de la página. Debería ser `true` (es el default desde Electron 12+, pero verifica que no lo hayan desactivado explícitamente).
- `sandbox: false` — reduce las capas de defensa. No siempre es crítico por sí solo, pero súmalo al resto de señales.
- `webSecurity: false` — desactiva same-origin policy. Casi nunca hay una razón legítima para esto en producción; si aparece, es alto/crítico según qué cargue esa ventana.
- `enableRemoteModule: true` (versiones viejas de Electron) — el módulo `remote` es una superficie de ataque grande y está deprecado por buenas razones.

## 2. Comunicación IPC (proceso main ↔ renderer)

- Cada canal `ipcMain.handle` / `ipcMain.on` debe **validar y sanear el input** que recibe del renderer, igual que si fuera input de un usuario no confiable — porque si el renderer está comprometido, lo es.
- Cuidado con canales que reciben una ruta de archivo, un comando, o una URL desde el renderer y la usan directamente (`fs.readFile(payload.path)`, `shell.openExternal(payload.url)` sin validar el esquema, `exec(payload.cmd)`). Esto es la puerta de entrada más común a path traversal o ejecución de comandos.
- Verifica que el preload script exponga solo funciones específicas vía `contextBridge.exposeInMainWorld`, no el objeto `ipcRenderer` completo (eso le da al renderer acceso a *cualquier* canal, no solo a los que la app necesita usar).
- Si hay un canal para guardar/exportar archivos (relevante para exportación a PDF), confirma que la ruta destino se valide o se pida vía diálogo nativo (`dialog.showSaveDialog`) en vez de aceptar cualquier ruta que mande el renderer.

## 3. Content Security Policy

- ¿Hay una CSP definida (meta tag o header) para las ventanas que cargan contenido? Sin CSP, un XSS que logre inyectar `<script>` se ejecuta sin restricciones.
- Si hay CSP, revisa que no tenga `unsafe-inline` o `unsafe-eval` sin necesidad real — con un editor tipo TipTap y renderizado de Markdown, es tentador relajar la CSP "para que funcione"; eso es exactamente el escenario que la CSP debería mitigar.

## 4. XSS vía renderizado de Markdown/HTML (relevante para este stack)

Este es el punto de mayor riesgo real en un editor tipo Marknote/TipTap con markdown-it y Turndown:

- Si el HTML resultante de `markdown-it` (o de TipTap al exportar) se inyecta con `dangerouslySetInnerHTML` o `innerHTML` sin pasar por un sanitizador (`DOMPurify` u equivalente), cualquier Markdown malicioso (por ejemplo un archivo `.md` importado de otra fuente, o contenido pegado) puede ejecutar JS en el contexto de la app.
- Si `nodeIntegration` está activo en esa misma ventana (punto 1), ese XSS se convierte en RCE. Este combo (`nodeIntegration: true` + Markdown/HTML sin sanitizar) es el hallazgo crítico más común en este tipo de apps — búscalo activamente.
- Revisa también el flujo inverso (Turndown: HTML → Markdown) por si permite construir Markdown que, al re-renderizarse, produzca HTML no esperado.
- Mermaid ejecuta y renderiza definiciones de diagramas que pueden incluir HTML/enlaces (`click` events, `securityLevel`) — confirma que `securityLevel` no esté en `'loose'` sin necesidad, ya que eso habilita ejecución de JS embebido en el diagrama.
- KaTeX es más seguro por diseño (no evalúa JS), pero confirma que no se esté usando `trust: true` sin razón, ya que eso habilita comandos que pueden insertar HTML/URLs arbitrarios.

## 5. Exportación a PDF

- Si la exportación usa una `BrowserWindow` oculta para renderizar e imprimir a PDF (`webContents.printToPDF`), verifica que esa ventana tenga las mismas restricciones de `webPreferences` que las ventanas visibles — es común bajar la guardia en ventanas "invisibles" asumiendo que no importa, cuando siguen siendo un proceso renderer con las mismas capacidades.
- Confirma que el contenido que se le pasa a esa ventana para imprimir pase por el mismo sanitizador que el resto de la app.

## 6. Actualizaciones y dependencias

- Si hay auto-updater configurado, confirma que valide la firma/checksum de las actualizaciones y use HTTPS.
- Dependencias con vulnerabilidades conocidas: si tienes acceso a bash, corre `npm audit` (ver `tools-and-commands.md`). Reporta CVEs de severidad alta/crítica como hallazgos de seguridad, no como nota al pie.

## Cómo reportar estos hallazgos

Un hallazgo de seguridad de Electron debería incluir siempre: la configuración exacta encontrada (con archivo y línea), qué la hace riesgosa en este contexto específico (no una definición genérica de XSS), y la corrección concreta (ej: "envolver el HTML en `DOMPurify.sanitize()` antes de `dangerouslySetInnerHTML` en `Editor.tsx:84`", no solo "sanitizar el input").
