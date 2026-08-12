---
name: code-audit-pro
description: Realiza auditorías exhaustivas de código para proyectos Electron + Vite + React + TypeScript (stacks tipo TipTap/KaTeX/Mermaid/markdown-it/Turndown/exportación a PDF). Detecta bugs, código muerto, código innecesario o duplicado, oportunidades de reutilización y modularización, y brechas de seguridad (especialmente riesgos propios de Electron como nodeIntegration, contextIsolation, IPC sin validar, y XSS vía renderizado de Markdown/HTML). Usa esta skill siempre que el usuario pida "auditar", "revisar", "analizar" su proyecto o repositorio, busque bugs, código muerto, deuda técnica, oportunidades de refactor, o quiera un chequeo de seguridad de su app de escritorio. Aplica tanto si el usuario pasa el repo completo como si pasa archivos o módulos sueltos.
---

# Code Audit Pro

Auditoría de código exhaustiva y accionable para aplicaciones de escritorio construidas con Electron + Vite + React + TypeScript, con foco especial en stacks de tipo editor (TipTap, KaTeX, Mermaid, markdown-it/Turndown, exportación a PDF).

## Por qué esta skill existe

Una auditoría útil no es una lista genérica de "buenas prácticas". Es la lectura real y completa del código, entendiendo qué hace cada pieza, cómo se conecta con el resto, y detectando problemas concretos con evidencia (archivo + línea + por qué importa). El usuario prioriza profundidad sobre velocidad: prefiere que se lea todo el proyecto y se mapeen las dependencias entre módulos antes de dar un veredicto, en vez de un vistazo superficial.

## Proceso de auditoría

No saltes directo a buscar bugs. Sigue este orden — cada paso alimenta al siguiente.

### 1. Reconocimiento del proyecto

Antes de juzgar nada, entiende la forma del proyecto:

- Lee `package.json` completo: dependencias, scripts, versión de Electron/Vite/React.
- Lee `tsconfig.json` (¿`strict` activado? ¿paths raros?).
- Lee `vite.config.ts` y cualquier config de Electron (main/preload/renderer, `electron-builder`, etc.).
- Identifica los puntos de entrada: proceso principal (`main`), preload script, y el árbol de renderer/React.
- Mapea la estructura de carpetas (2-3 niveles) para tener un modelo mental antes de leer archivo por archivo.

Si tienes acceso a bash en el entorno del usuario, usa herramientas para acelerar el reconocimiento y no depender solo de lectura manual — ver `references/tools-and-commands.md` para los comandos exactos (`knip`, `madge`, `depcheck`, `npm audit`, `ts-prune`). Si no tienes bash, hazlo por lectura directa; es más lento pero igual de válido.

### 2. Mapeo de dependencias entre módulos

Antes de decidir qué es "código muerto" o "duplicado", necesitas el grafo de quién importa a quién. Sin esto, vas a marcar como muerto código que en realidad se usa dinámicamente, o vas a fallar en detectar duplicación entre módulos que no parecen relacionados a simple vista.

- Construye (mentalmente o con `madge`) el grafo de imports.
- Detecta dependencias circulares.
- Identifica módulos "isla" (nada los importa) como candidatos a código muerto — pero verifica que no se carguen dinámicamente (`import()`, registro por convención, IPC channels referenciados por string) antes de marcarlos.

### 3. Revisión por categoría

Lee cada archivo relevante con estas seis lentes. No te limites a buscar patrones con grep — lee la lógica real.

**Bugs y errores lógicos**
Condiciones mal invertidas, off-by-one, race conditions (especialmente en IPC async entre main/renderer), manejo de errores ausente o silencioso (`catch` vacíos), estados de React que pueden quedar inconsistentes, memory leaks (listeners de Electron o de DOM no removidos, especialmente en editores TipTap que se montan/desmontan).

**Código muerto**
Exports que nadie importa, funciones/componentes nunca renderizados, ramas de código inalcanzables, feature flags viejos que quedaron permanentemente en un solo estado, extensiones de TipTap importadas pero no registradas. Usa el grafo del paso 2 para confirmar antes de reportar.

**Código innecesario o sobre-ingeniería**
Abstracciones con un solo caso de uso, wrappers que no agregan valor sobre la librería que envuelven, configuración copiada de plantillas que no aplica a este proyecto, dependencias completas instaladas para usar una sola función (candidata a reemplazo por código propio o import puntual).

**Duplicación y oportunidades de reutilización**
Lógica repetida en distintos componentes que podría ser un hook o util compartido, funciones casi idénticas con pequeñas variaciones (candidatas a parametrizar), patrones de conversión repetidos (markdown-it/Turndown, exportación a PDF) que deberían vivir en un solo módulo. Señala explícitamente "esto se repite en X y Y, se podría extraer a Z".

**Modularización / código en bloques**
Componentes o archivos que mezclan demasiadas responsabilidades (UI + lógica de negocio + acceso a IPC en el mismo archivo), funciones largas que deberían dividirse en pasos con nombre, lógica de negocio atrapada dentro de componentes React que debería vivir en hooks o servicios testeables por separado.

**Seguridad**
Esta es la categoría donde Electron tiene riesgos particulares que no existen en una SPA normal — trátala con más rigor que las demás. Lee `references/electron-security.md` antes de evaluar esta categoría; cubre contextIsolation, nodeIntegration, validación de canales IPC, CSP, y los riesgos de XSS específicos de renderizar Markdown/HTML generado por el usuario (markdown-it, Turndown, TipTap, exportación a PDF).

Para pitfalls específicos del resto del stack (TipTap, KaTeX, Mermaid, markdown-it/Turndown, exportación a PDF) revisa `references/stack-specific-checks.md`.

### 4. Clasificación por severidad

Cada hallazgo se clasifica en una de estas cuatro categorías. Sé estricto: no todo es "crítico", y suavizar la severidad de un hallazgo real le quita utilidad al informe.

- **🔴 Crítico** — vulnerabilidad explotable, pérdida de datos, crash reproducible, o algo que compromete la seguridad del usuario final (ej: `nodeIntegration: true` en una ventana que carga contenido remoto o Markdown sin sanitizar).
- **🟠 Alto** — bug con impacto real en funcionalidad o UX, o riesgo de seguridad no trivial pero de menor alcance.
- **🟡 Medio** — deuda técnica que va a doler pronto: duplicación relevante, código muerto en rutas activas, falta de manejo de errores en operaciones importantes.
- **⚪ Bajo / Info** — mejoras de calidad, oportunidades de refactor, código muerto en rutas poco usadas, sugerencias de estilo con impacto real (no gustos personales).

## Formato del informe

El usuario quiere una **lista priorizada por severidad**, no un reporte por categorías. Agrupa todos los hallazgos (de cualquier categoría: bug, código muerto, seguridad, etc.) en un solo orden, de crítico a bajo. Usa esta plantilla:

```markdown
# Auditoría de código — [nombre del proyecto]
Fecha: [fecha] · Alcance: [repo completo / módulos: lista]

## Resumen ejecutivo
[3-5 líneas: cuántos hallazgos por severidad, y el riesgo más importante en una frase]

## 🔴 Crítico
### [Título corto del hallazgo]
- **Dónde:** `ruta/al/archivo.ts:línea`
- **Qué pasa:** [explicación concreta, sin relleno]
- **Por qué importa:** [impacto real]
- **Sugerencia:** [qué hacer, no solo "arreglar esto"]

## 🟠 Alto
[mismo formato]

## 🟡 Medio
[mismo formato]

## ⚪ Bajo / Info
[mismo formato, puede ser más breve por ítem]

## Código muerto detectado
[lista simple: archivo/export → por qué se considera muerto, con nivel de confianza si aplica]

## Oportunidades de reutilización
[lista simple: qué se repite, dónde, y a qué se podría extraer]
```

Si el alcance fue solo algunos archivos (no el repo completo), acláralo en el encabezado y menciona si detectaste algo que amerita revisar el resto del repo (ej: un patrón sospechoso que probablemente se repite en otros módulos que no se auditaron).

No inventes hallazgos para llenar categorías vacías — si una categoría no tiene nada relevante, dilo en una línea ("Sin hallazgos de seguridad en los archivos revisados") en vez de omitirla silenciosamente; eso le confirma al usuario que sí se revisó esa dimensión.

## Alcance: repo completo vs. archivos sueltos

El usuario a veces pasará el proyecto completo y otras veces archivos o módulos puntuales. En ambos casos aplica el mismo rigor:

- **Repo completo:** haz los 4 pasos completos, incluyendo el mapeo de dependencias global.
- **Archivos sueltos:** igual vale la pena entender cómo esos archivos se conectan con el resto si tienes acceso al repo (para no marcar como "muerto" algo que se usa desde afuera) — si no tienes ese acceso, dilo explícitamente como limitación del alcance en el informe, en vez de asumir.

## Notas finales

- Prioriza profundidad real sobre cobertura superficial: es mejor auditar bien 15 archivos clave que listar 60 hallazgos genéricos sacados de un linter.
- Cuando un hallazgo dependa de una herramienta que no corriste (por falta de acceso a bash, por ejemplo `npm audit` para CVEs de dependencias), dilo explícitamente en vez de omitirlo o inventarlo.
- Si detectas algo urgente de seguridad, menciónalo también en una línea al principio de tu respuesta, no solo enterrado en el informe.
