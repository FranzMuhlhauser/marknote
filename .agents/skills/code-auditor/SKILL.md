---
name: code-auditor
description: Sistema de auditoría web premium de 3 fases: análisis cualitativo profundo, checklist de validación y puntuación ejecutiva final. Cobertura completa de SEO, AEO, GEO, performance, accesibilidad, seguridad, UX y CRO. Basado en el SISTEMA DE AUDITORÍA WEB PREMIUM y el Manual de Buenas Prácticas para Desarrollo de Software por IA (v3).
---

# Code Auditor — Sistema de Auditoría Web Premium

Auditoría web completa mediante flujo secuencial de 3 fases. Cada fase tiene instrucciones, roles y formato de salida XML definidos.

## Cuándo Usar

- "auditar el código"
- "analizar calidad del código"
- "revisar el proyecto"
- "verificar problemas"
- "encontrar deuda técnica"
- "auditoría de seguridad"
- "revisión de rendimiento"
- "check de pre-lanzamiento"
- "puntuar el proyecto"
- "score del sitio"

## Filosofía

- **Menos es Más**: Reducir complejidad, no cantidad de código. Cada hallazgo debe justificar su existencia.
- **Respeto al Proyecto**: Comprender antes de actuar. El proyecto existente es la fuente de verdad.
- **Evolución Gradual**: Cambios pequeños, comprensibles y reversibles. Prefiere la menor modificación posible.
- **Proporcionalidad**: El proceso aplicado debe ser proporcional al tamaño, riesgo e impacto del cambio.
- **Documentación como Producto**: Parte integral del trabajo, no un adorno.

## Nivel de Proceso

La auditoría completa es nivel 🔴 **COMPLETO** (afecta arquitectura, múltiples módulos, ambigüedad real de enfoque). Se aplica el proceso completo definido en las fases.

Si el usuario pide solo un área específica (ej. solo seguridad, solo performance), se clasifica como 🟡 **ESTÁNDAR** y se ejecuta únicamente la fase relevante con las categorías aplicables.

## Sistema de Evidencia

Todo hallazgo se clasifica explícitamente:

- 🟢 **Hecho confirmado** — evidencia directa del código, documentación o test.
- 🟡 **Inferencia probable** — evidencia fuerte pero incompleta.
- 🔴 **Hipótesis** — sin evidencia suficiente, declarada como tal.
- 🔵 **Opinión técnica** — juicio basado en experiencia general, no en evidencia del proyecto.
- ⚪ **Preferencia técnica** — varias soluciones igualmente válidas, elección subjetiva.

## Gestión de Incertidumbre

- Nunca inventar arquitectura, comportamiento o datos no verificables.
- Distinguir explícitamente lo que se sabe de lo que se asume.
- Si la incertidumbre no es bloqueante, elegir el supuesto más razonable, declararlo en una línea, y continuar.

---

# FLUJO SECUENCIAL OBLIGATORIO

```
FASE 1: ANÁLISIS CUALITATIVO PROFUNDO
↓ Identifica QUÉ está mal y POR QUÉ
↓
FASE 2: CHECKLIST DE VALIDACIÓN
↓ Verifica que las correcciones se aplicaron
↓
FASE 3: PUNTUACIÓN EJECUTIVA FINAL
↓ Genera score final ponderado
```

**Regla crítica**: No avanzar a la siguiente fase hasta completar la actual. Si la Fase 2 detecta errores bloqueantes 🚫, volver a Fase 1.

---

# FASE 1: ANÁLISIS CUALITATIVO PROFUNDO

## Rol
Lead Engineer + QA + SEO Técnico + UX/UI Auditor

## Objetivo
Identificar problemas estructurales, deuda técnica crítica y oportunidades de mejora en código pre-lanzamiento.

## Instrucciones Críticas
1. Evaluar el código tal como está
2. Detectar: hardcodeos, console.logs, variables expuestas, errores de sintaxis, componentes no reutilizables
3. Cada hallazgo debe incluir: problema técnico → impacto → solución concreta → prioridad
4. Si una práctica es aceptable en desarrollo pero no en producción, indicarlo claramente
5. Clasificar cada hallazgo con el Sistema de Evidencia (🟢🟡🔴🔵⚪)

## Áreas de Análisis (12 categorías)

### 1. ESTRUCTURA & ARQUITECTURA DEL CÓDIGO
- Organización de carpetas, modularidad, reutilización
- Separación de concerns, nombres claros, comentarios en lógica compleja

### 2. SEO TÉCNICO (IMPLEMENTACIÓN EN CÓDIGO)
- Title, meta description, canonical, hreflang, sitemap/robots
- Schema.org inyectado correctamente, metadatos dinámicos

### 3. AEO (ANSWER ENGINE OPTIMIZATION)
- FAQs estructuradas, párrafos concisos (<60 palabras)
- Markup FAQ/HowTo/Q&A, estructura de respuesta directa

### 4. GEO (GENERATIVE ENGINE OPTIMIZATION)
- Claridad semántica, densidad de conocimiento
- Interconexión temática, autoridad técnica en markup

### 5. PERFORMANCE & BUILD
- Peso de assets, minificación, tree-shaking, code splitting
- LCP, CLS, INP a nivel de implementación

### 6. OPTIMIZACIÓN DE IMÁGENES & MEDIOS
- Formatos modernos (WebP/AVIF), srcset/sizes, lazy loading
- Dimensiones explícitas, aspect-ratio, compresión

### 7. RESPONSIVIDAD & UX EN CÓDIGO
- Viewport correcto, media queries lógicas, diseño fluido
- Tap targets >48px, navegación móvil, sin overflow

### 8. EXPERIENCIA DE USUARIO (IMPLEMENTACIÓN)
- Estados de carga, manejo de errores, transiciones suaves
- Jerarquía visual, CTAs claros, feedback visual

### 9. ACCESIBILIDAD (WCAG 2.2 AA)
- Contraste ≥4.5:1, alt descriptivo, labels en formularios
- Focus visible, navegación por teclado, ARIA roles correctos

### 10. SEGURIDAD & PRE-PRODUCCIÓN
- HTTPS forzado, headers de seguridad (CSP, X-Frame-Options)
- Sanitización de inputs, sin console.log, sin API keys hardcodeadas

### 11. METADATOS SOCIALES & PREVISUALIZACIÓN
- Open Graph, Twitter Cards, favicon multiformato
- Fallback de imagen, meta charset/viewport

### 12. CRO & ENTREGA AL CLIENTE
- Tracking listo (GA4, Meta Pixel), formularios optimizados
- Elementos de confianza, documentación de mano

## Formato de Salida (XML)

```xml
<Errores_Criticos>
• [Prioridad] Problema: descripción técnica | Impacto: [Lanzamiento/SEO/UX/Seguridad] | Solución: acción concreta | Evidencia: [🟢/🟡/🔴/🔵/⚪]
</Errores_Criticos>
<Oportunidades_Mejora>
• [Prioridad] Optimización: descripción | Beneficio: [Rendimiento/Conversión/Mantenibilidad] | Implementación: paso a paso | Evidencia: [🟢/🟡/🔴/🔵/⚪]
</Oportunidades_Mejora>
<Analisis_AEO>
Probabilidad Featured Snippets: [Alta/Media/Baja] - Justificación: [1 línea técnica]
Schemas implementados: [lista] | Schemas faltantes críticos: [lista]
</Analisis_AEO>
<Analisis_GEO>
Claridad semántica: [X/10] - (justificación técnica)
Probabilidad de citación por IA: [Alta/Media/Baja] - Factores clave: [lista breve]
</Analisis_GEO>
<Puntaje_Fase1>
Estructura Código: X/10 - (justificación)
SEO Técnico: X/10 - (justificación)
AEO: X/10 - (justificación)
GEO: X/10 - (justificación)
Performance/Build: X/10 - (justificación)
UX/Responsividad: X/10 - (justificación)
Accesibilidad: X/10 - (justificación)
Seguridad: X/10 - (justificación)
CRO/Entrega: X/10 - (justificación)
</Puntaje_Fase1>
<Checklist_PreLanzamiento>
✅/❌ Eliminar console.log, debuggers y comentarios de desarrollo
✅/❌ Validar variables de entorno y secrets management
✅/❌ Confirmar minificación, tree-shaking y code splitting activos
✅/❌ Verificar metadatos SEO/OG dinámicos por ruta
✅/❌ Probar contraste, focus states y navegación por teclado
✅/❌ Confirmar tracking (GA4/Píxeles) y eventos de conversión
✅/❌ Generar sitemap.xml y robots.txt para producción
✅/❌ Documentar estructura, mantenimiento y escalabilidad
</Checklist_PreLanzamiento>
<Notas_Entrega>
- Estado actual: [resumen en 1 línea]
- Riesgos conocidos: [lista breve]
- Recomendaciones: [2-3 puntos técnicos]
</Notas_Entrega>
```

---

# FASE 2: CHECKLIST DE VALIDACIÓN

## Rol
Lead QA Engineer + Auditor de Entrega Premium

## Objetivo
Validar que las correcciones de la Fase 1 se aplicaron correctamente mediante un checklist granular de 15 puntos.

## Instrucciones de Ejecución
1. Evaluar el código tal como está
2. Para cada uno de los 15 puntos, indicar: ✅ (cumple), ❌ (falta/grave), ⚠️ (parcial/mejorable)
3. Añadir puntuación X/10 y 1 línea de justificación técnica
4. Clasificar hallazgos por impacto: Bloqueante 🚫 | Alto ⚠️ | Medio 🟡 | Bajo ℹ️

## Checklist de Validación (15 puntos)

1. **ESTRUCTURA Y HTML**: Etiquetas semánticas, jerarquía H1-H6, único H1, DOM limpio
2. **SEO BÁSICO**: Title único (<60 chars), meta description (<155), keywords en H1/H2, alt en imágenes
3. **SEO TÉCNICO**: sitemap.xml, robots.txt, canonicals, Schema.org, breadcrumbs
4. **AEO**: Formato pregunta-respuesta, FAQs, FAQ/HowTo Schema
5. **GEO**: Claridad semántica, densidad informativa, interconexión temática
6. **PERFORMANCE WEB**: Minificación CSS/JS, tree-shaking, code splitting
7. **CORE WEB VITALS**: LCP <2.5s, CLS <0.1, INP <200ms
8. **OPTIMIZACIÓN DE IMÁGENES**: WebP/AVIF, compresión, srcset, lazy loading, dimensiones explícitas
9. **RESPONSIVE DESIGN**: Viewport, media queries lógicas, tap targets >48px, sin overflow
10. **EXPERIENCIA DE USUARIO (UX)**: Navegación clara, jerarquía visual, CTAs visibles
11. **ACCESIBILIDAD (WCAG 2.2 AA)**: Contraste ≥4.5:1, alt descriptivo, navegación por teclado, ARIA
12. **SEGURIDAD WEB**: HTTPS, headers de seguridad, sanitización, sin secrets expuestos
13. **REDES SOCIALES**: Open Graph, Twitter Cards, favicon multiformato
14. **ANALÍTICA Y TRACKING**: GA4, Search Console, eventos de conversión configurados
15. **CONVERSIÓN (CRO) & ENTREGA**: CTAs estratégicos, formularios mínimos, docs de mantenimiento

## Formato de Salida (XML)

```xml
<Checklist_15_Puntos>
<Item numero="1" estado="✅/❌/⚠️" nota="X/10" justificacion="1 línea técnica"/>
<Item numero="2" estado="✅/❌/⚠️" nota="X/10" justificacion="1 línea técnica"/>
...
<Item numero="15" estado="✅/❌/⚠️" nota="X/10" justificacion="1 línea técnica"/>
</Checklist_15_Puntos>
<Errores_Bloqueantes>
• [🚫] Problema: descripción técnica | Impacto: [Lanzamiento/SEO/Seguridad] | Solución: acción concreta
</Errores_Bloqueantes>
<Optimizaciones_PreLanzamiento>
• [Alto/Medio/Bajo] Optimización: descripción | Beneficio: [Rendimiento/Conversión/Mantenibilidad] | Implementación: paso a paso
</Optimizaciones_PreLanzamiento>
<Notas_Entrega>
- Estado actual: [resumen técnico en 1 línea]
- Riesgos post-lanzamiento: [lista breve]
- Recomendaciones de mantenimiento: [2-3 puntos técnicos]
</Notas_Entrega>
```

---

# FASE 3: PUNTUACIÓN EJECUTIVA FINAL

## Rol
Sistema de Evaluación Final

## Objetivo
Generar puntuación ejecutiva ponderada para reporte al cliente y decisión de entrega.

## Instrucciones de Ejecución
1. Evaluar cada categoría estrictamente de 0 a 10
2. Para cada puntaje, añadir 1 línea de justificación técnica
3. Si una categoría no aplica, indicar "N/A - Justificación breve"
4. Aplicar ponderación definida. Resultado final /100
5. Determinar estado de entrega según umbral técnico

## Categorías de Evaluación (10 categorías ponderadas)

1. **SEO Técnico (15%)**: Indexabilidad, metadatos, estructura, Schema, rastreo
2. **AEO (10%)**: Formato pregunta-respuesta, FAQs, markup directo, probabilidad de Featured Snippet
3. **GEO (10%)**: Claridad semántica, densidad de conocimiento, autoridad temática, citabilidad por LLMs
4. **Performance & Build (15%)**: Minificación, tree-shaking, code splitting, eliminación de dead code, caché
5. **Core Web Vitals (10%)**: LCP <2.5s, CLS <0.1, INP <200ms, priorización de carga crítica
6. **Optimización de Medios (5%)**: WebP/AVIF, compresión, srcset, lazy loading, dimensiones explícitas
7. **Responsive & UX Móvil (10%)**: Viewport, breakpoints lógicos, tap targets >48px, sin overflow, fluidez
8. **Experiencia de Usuario (UX) (5%)**: Jerarquía visual, navegación intuitiva, feedback de estados, fricción cero
9. **Accesibilidad (10%)**: Contraste ≥4.5:1, focus visible, ARIA correcto, navegación por teclado
10. **Seguridad & Pre-Producción (10%)**: HTTPS, headers (CSP, X-Frame, Referrer), sanitización, sin secrets/console.log

## Metodología de Puntuación

- **9-10**: Implementación óptima. Lista para producción sin ajustes
- **7-8**: Correcta, pero requiere optimizaciones menores pre-despliegue
- **5-6**: Deficiente en varios puntos. Riesgo de retrabajo
- **3-4**: Problemas estructurales que afectan SEO, rendimiento o seguridad
- **0-2**: Crítico. Bloquea entrega o expone vulnerabilidades

## Umbral de Entrega

- 🟢 **≥ 90/100**: APROBADO para entrega premium. Sin bloqueantes
- 🟡 **75-89/100**: CONDICIONAL. Requiere ajustes menores documentados
- 🔴 **< 75/100**: NO APROBADO. Correcciones técnicas obligatorias

## Formato de Salida (XML)

```xml
<Puntuacion_Final>
<Categoria nombre="SEO Tecnico" nota="X/10" justificacion="1 línea técnica"/>
<Categoria nombre="AEO" nota="X/10" justificacion="1 línea técnica"/>
<Categoria nombre="GEO" nota="X/10" justificacion="1 línea técnica"/>
<Categoria nombre="Performance Build" nota="X/10" justificacion="1 línea técnica"/>
<Categoria nombre="Core Web Vitals" nota="X/10" justificacion="1 línea técnica"/>
<Categoria nombre="Optimizacion Medios" nota="X/10" justificacion="1 línea técnica"/>
<Categoria nombre="Responsive UX Movil" nota="X/10" justificacion="1 línea técnica"/>
<Categoria nombre="UX General" nota="X/10" justificacion="1 línea técnica"/>
<Categoria nombre="Accesibilidad" nota="X/10" justificacion="1 línea técnica"/>
<Categoria nombre="Seguridad" nota="X/10" justificacion="1 línea técnica"/>
<Puntaje_Ponderado>XX/100</Puntaje_Ponderado>
<Estado_Entrega>🟢 APROBADO | 🟡 CONDICIONAL | 🔴 NO APROBADO</Estado_Entrega>
</Puntuacion_Final>
```

---

# REGLAS DE USO

## Cuándo ejecutar cada fase

**Fase 1 (Análisis profundo):**
- Primera auditoría de un proyecto
- Cuando se identifica deuda técnica significativa
- Cuando hay cambios arquitectónicos mayores

**Fase 2 (Checklist):**
- Después de aplicar las correcciones de la Fase 1
- Como validación pre-entrega rápida

**Fase 3 (Puntuación):**
- Únicamente cuando las Fases 1 y 2 están aprobadas
- Para generar el reporte final al cliente

## Consolidación de resultados

- **Fase 1** → Lista de problemas priorizados (entrada para correcciones)
- **Fase 2** → Evidencia de que los problemas fueron resueltos
- **Fase 3** → Score final que refleja el estado del proyecto

Si la Fase 2 detecta errores bloqueantes 🚫, **no se avanza a la Fase 3**. Primero se corrigen y se re-ejecuta la Fase 2.

## Restricciones generales

- Devolver ÚNICAMENTE el XML especificado en cada fase
- No incluir introducciones, saludos, conclusiones genéricas
- Si falta información, marcar "N/A - Requiere: [dato]" y asignar 0/10 temporalmente
- Usar lenguaje técnico preciso, evitar ambigüedades
- Si un ítem no aplica al stack, indicar "N/A" con explicación técnica
- Clasificar evidencia de cada hallazgo (🟢🟡🔴🔵⚪)
- No ampliar el alcance más allá de lo pedido sin autorización

---

# ENFOQUE DE EJECUCIÓN

## Herramientas

- **Task (Explore agent)**: Exploración profunda del codebase (modo thorough)
- **Grep**: Búsqueda de patrones (console.log, secrets, hardcoded values, etc.)
- **Glob**: Encontrar archivos por tipo/patrón
- **Read**: Análisis detallado de archivos críticos
- **Bash**: Ejecutar linters, herramientas de cobertura, build tools

## Flujo de Exploración

1. **Estructura general**: Explorar directorios, package.json, config files
2. **Patrones de código**: Buscar anti-patrones comunes (console.log, hardcoded secrets, etc.)
3. **Archivos críticos**: Leer componentes principales, layouts, configuraciones
4. **Análisis SEO**: Verificar meta tags, Schema.org, sitemap, robots.txt
5. **Seguridad**: Buscar vulnerabilidades OWASP, secrets management
6. **Performance**: Analizar bundling, lazy loading, optimization
7. **Sintetizar**: Consolidar hallazgos en formato XML de la fase correspondiente

## Clasificación de Hallazgos

Cada hallazgo se clasifica por:
- **Categoría**: Una de las 12 áreas de análisis (Fase 1) o 15 puntos (Fase 2)
- **Prioridad**: Crítica / Alta / Media / Baja
- **Impacto**: Lanzamiento / SEO / UX / Seguridad / Rendimiento / Conversión / Mantenibilidad
- **Evidencia**: 🟢 Hecho / 🟡 Inferencia / 🔴 Hipótesis / 🔵 Opinión / ⚪ Preferencia

## Proporcionalidad

- Auditoría completa → 3 fases secuenciales
- Auditoría de un área específica → Solo las categorías aplicables
- Revisión rápida → Solo Fase 1 con categorías seleccionadas

---

# INTEGRACIÓN

- **code-audit**: Para análisis genérico de código (no web-specific)
- **feature-planning**: Planificar reducción de deuda técnica identificada
- **test-fixing**: Abordar gaps de testing identificados
- **project-bootstrapper**: Configurar herramientas de calidad

## Configuración

Puede enfocarse en áreas específicas:
- Auditoría solo de seguridad
- Auditoría solo de performance
- Auditoría solo de testing
- Revisión rápida de arquitectura
- Auditoría solo de SEO/AEO/GEO
