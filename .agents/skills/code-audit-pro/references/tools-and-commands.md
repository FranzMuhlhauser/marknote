# Herramientas y comandos (solo si tienes acceso a bash en el proyecto del usuario)

Estos comandos no reemplazan la lectura del código — la complementan y aceleran el paso de reconocimiento y el mapeo de dependencias. Si no tienes acceso a bash en el entorno donde estás trabajando, sáltate esta sección y dilo explícitamente en el informe ("no se corrieron herramientas automáticas de análisis, esta auditoría se basó en lectura directa").

Usa `npx` para no requerir instalación global, y siempre revisa que el comando exista antes de asumir que corrió bien (algunos proyectos no tienen `npm`/`node` en el PATH del entorno sandbox).

## Código muerto y exports sin usar

```bash
npx knip
```
Detecta exports, archivos y dependencias no usadas en todo el proyecto. Es la herramienta más completa para este propósito en proyectos TS/React.

Alternativa más simple si `knip` no corre bien en el proyecto:
```bash
npx ts-prune
```

## Dependencias circulares y grafo de imports

```bash
npx madge --circular --extensions ts,tsx src/
npx madge --image /tmp/dep-graph.png src/    # si necesitas visualizarlo
```

## Dependencias no usadas o faltantes en package.json

```bash
npx depcheck
```

## Vulnerabilidades conocidas en dependencias

```bash
npm audit --omit=dev
```
Prioriza reportar solo severidad `high` y `critical` como hallazgos de seguridad — el resto puede mencionarse como nota informativa, no como hallazgo priorizado.

## Lint y code smells

Si el proyecto ya tiene ESLint configurado, correrlo aporta señal rápida:
```bash
npx eslint . --ext .ts,.tsx
```
No repitas en el informe cada warning de estilo del linter uno por uno — agrúpalos ("N advertencias de ESLint sobre X, ver salida completa") y enfoca el informe en lo que el linter no puede ver (lógica, seguridad, arquitectura).

## Duplicación de código

```bash
npx jscpd src/ --min-lines 5 --min-tokens 50
```
Útil para encontrar duplicación literal. La duplicación *conceptual* (misma idea, distinta implementación) no la detecta esto — esa la encuentras leyendo, no con herramientas.

## Cómo combinar esto con la lectura manual

1. Corre `knip`, `madge --circular` y `depcheck` primero — te dan un mapa inicial de candidatos a código muerto y acoplamiento antes de leer línea por línea.
2. Usa esos resultados como lista de verificación durante la lectura manual, no como veredicto final — siempre confirma con el contexto real antes de reportar algo como código muerto (puede usarse dinámicamente, por convención de nombre, o desde un canal IPC referenciado por string).
3. Corre `npm audit` y `jscpd` en paralelo mientras lees el código, y suma esos resultados al informe final.
