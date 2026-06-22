export interface KnowledgeTopic {
  id: string
  title: string
  category: 'basico' | 'intermedio' | 'avanzado'
  summary: string
  syntax: string[]
  details: string
  example: {
    input: string
    rendered: string
  }
  tips: string[]
  related: string[]
}

export type TopicCategory = 'basico' | 'intermedio' | 'avanzado'

export const CATEGORY_LABELS: Record<TopicCategory, string> = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado'
}

export const TOPICS: KnowledgeTopic[] = [
  {
    id: 'headings',
    title: 'Encabezados',
    category: 'basico',
    summary: 'Los encabezados organizan el documento por niveles jerárquicos, desde el más importante (H1) hasta el más específico (H6).',
    syntax: ['# Título (H1)', '## Subtítulo (H2)', '### Sección (H3)', '#### Subsección (H4)', '##### Detalle (H5)', '###### Nota (H6)'],
    details: 'Usa el símbolo # seguido de un espacio al inicio de la línea. Cuantos más #, menor es el nivel. El H1 es el título principal del documento y conviene usarlo una sola vez.',
    example: {
      input: '# Mi Documento\n## Introducción\n### Contexto\n#### Antecedentes',
      rendered: 'Cuatro niveles de encabezado, cada uno más pequeño que el anterior.'
    },
    tips: ['Usa H1 una sola vez por documento', 'No saltes niveles (ej. H2 → H4)', 'Mantén los títulos cortos y descriptivos'],
    related: ['bold-italic']
  },
  {
    id: 'bold-italic',
    title: 'Negrita y Cursiva',
    category: 'basico',
    summary: 'La negrita resalta texto importante; la cursiva enfatiza palabras o frases.',
    syntax: ['**negrita**', '*cursiva*', '***negrita y cursiva***'],
    details: 'Envuelve el texto entre dos asteriscos (**) para negrita, o uno (*) para cursiva. También puedes usar guión bajo (_) pero el asterisco es más común y visible.',
    example: {
      input: 'Esto es **importante** y esto es *enfático*.',
      rendered: '"importante" se ve en negrita, "enfático" se ve inclinado.'
    },
    tips: ['No abuses de la negrita — pierde efectividad', 'La cursiva se usa para títulos de obras o énfasis suave'],
    related: ['headings']
  },
  {
    id: 'lists',
    title: 'Listas',
    category: 'basico',
    summary: 'Las listas ordenan información en viñetas (no ordenadas) o numeradas (ordenadas).',
    syntax: ['- Elemento', '* Elemento', '1. Primer paso', '2. Segundo paso'],
    details: 'Para listas no ordenadas, usa -, + o * al inicio de la línea. Para listas ordenadas, usa un número seguido de punto. Puedes anidar listas indentando con 2 espacios.',
    example: {
      input: '- Manzanas\n- Peras\n  - Pera conferencia\n  - Pera asiática\n- Uvas',
      rendered: 'Lista con dos elementos principales, uno con sub-elementos indentados.'
    },
    tips: ['Mezclar - y * en un mismo documento funciona pero es inconsistente', 'Las listas numeradas empiezan desde 1 aunque escribas 1. en todas'],
    related: ['checklists', 'bold-italic']
  },
  {
    id: 'checklists',
    title: 'Checklists',
    category: 'basico',
    summary: 'Las listas de tareas (checklists) permiten marcar elementos como completados o pendientes.',
    syntax: ['- [ ] Tarea pendiente', '- [x] Tarea completada'],
    details: 'Combina la sintaxis de lista (-) con corchetes [ ] para indicar pendiente, o [x] para completado. El espacio entre [ y ] es obligatorio.',
    example: {
      input: '- [x] Comprar pan\n- [ ] Escribir informe\n- [ ] Llamar al médico',
      rendered: 'Tres tareas: una marcada como hecha, dos pendientes con casilla vacía.'
    },
    tips: ['Muy útil para reuniones y seguimiento', 'Puedes combinarlas con @menciones si usas texto plano'],
    related: ['lists']
  },
  {
    id: 'blockquotes',
    title: 'Citas',
    category: 'basico',
    summary: 'Las citas (blockquotes) resaltan texto引用ado o notas importantes.',
    syntax: ['> Texto citado', '> Párrafo 1\n> Párrafo 2', '>> Cita anidada'],
    details: 'Antepón > al inicio de cada línea que quieras citar. Puedes anidar citas usando >>. Algunos editores permiten dejar > solo al inicio del párrafo.',
    example: {
      input: '> La mejor manera de predecir el futuro es crearlo.\n> — Peter Drucker',
      rendered: 'Una frase célebre con su autor, presentada como cita destacada.'
    },
    tips: ['Úsalas para destacar definiciones o referencias', 'Combinadas con negrita pueden crear "cajas de aviso"'],
    related: ['bold-italic']
  },
  {
    id: 'code-blocks',
    title: 'Bloques de Código',
    category: 'intermedio',
    summary: 'Los bloques de código muestran fragmentos de código con formato monospace y resaltado de sintaxis.',
    syntax: ['```lenguaje', 'código', '```', '`código en línea`'],
    details: 'Usa tres backticks ``` seguidos del lenguaje para crear un bloque. Para código dentro de un párrafo, usa un solo backtick `. El resaltado de sintaxis mejora la legibilidad.',
    example: {
      input: '```javascript\nfunction hola() {\n  console.log("Mundo");\n}\n```',
      rendered: 'Un bloque de código JavaScript con resaltado de sintaxis.'
    },
    tips: ['Siempre especifica el lenguaje para activar el resaltado', 'Para código muy largo, considera dividirlo en secciones'],
    related: ['tables']
  },
  {
    id: 'tables',
    title: 'Tablas',
    category: 'intermedio',
    summary: 'Las tablas organizan datos en filas y columnas de forma estructurada.',
    syntax: ['| Col1 | Col2 | Col3 |', '|------|------|------|', '| A    | B    | C    |'],
    details: 'Usa tuberías (|) para separar columnas. La segunda línea define la alineación: --- izquierda, :---: centrado, ---: derecha. Los guiones deben ser al menos 3.',
    example: {
      input: '| Producto | Precio | Stock |\n|----------|:-----:|------:|\n| Manzana  | $1.20 |   150 |\n| Pera     | $1.50 |    80 |',
      rendered: 'Una tabla de 3 columnas con precio centrado y stock alineado a la derecha.'
    },
    tips: ['Alinea las tuberías visualmente en el código fuente para mejor legibilidad', 'Evita tablas muy anchas — se ven mal en pantallas pequeñas'],
    related: ['code-blocks']
  },
  {
    id: 'images',
    title: 'Imágenes',
    category: 'intermedio',
    summary: 'Las imágenes se insertan con sintaxis similar a los enlaces pero con ! al inicio.',
    syntax: ['![Texto alternativo](url-de-la-imagen)', '![Texto alt](ruta/local.png "Título")'],
    details: 'El texto alternativo es obligatorio y se muestra si la imagen no carga. El título (entre comillas) es opcional y aparece al pasar el mouse.',
    example: {
      input: '![Logo Markdown](https://markdown-here.com/img/icon256.png "Markdown")',
      rendered: 'Una imagen con texto alternativo "Logo Markdown" y título "Markdown" en tooltip.'
    },
    tips: ['Siempre usa texto alternativo descriptivo (accesibilidad)', 'Prefiere rutas relativas para imágenes locales'],
    related: ['links']
  },
  {
    id: 'links',
    title: 'Enlaces',
    category: 'intermedio',
    summary: 'Los enlaces conectan tu documento con URLs externas o referencias internas.',
    syntax: ['[texto visible](url)', '[texto](url "Título")', '<url-directa>'],
    details: 'El texto entre corchetes se muestra como link. La URL entre paréntesis es el destino. El título opcional aparece como tooltip. Los enlaces directos con <> son útiles para URLs cortas.',
    example: {
      input: '[Marknote](https://marknote.app "Editor Markdown")',
      rendered: 'Un enlace clickeable que dice "Marknote" y al pasar el mouse muestra "Editor Markdown".'
    },
    tips: ['Usa títulos descriptivos para mejor UX', 'Los enlaces a secciones internas requieren anclas HTML'],
    related: ['images']
  },
  {
    id: 'mermaid',
    title: 'Diagramas Mermaid',
    category: 'avanzado',
    summary: 'Mermaid permite crear diagramas y gráficos usando texto plano dentro del documento.',
    syntax: ['```mermaid', 'graph TD;', '  A-->B;', '  A-->C;', '```'],
    details: 'Mermaid es un lenguaje de diagramas basado en texto. Soporta diagramas de flujo, secuencia, Gantt, clases, git, y más. Se escribe dentro de un bloque de código con lenguaje "mermaid".',
    example: {
      input: '```mermaid\ngraph LR\n  Inicio --> Proceso\n  Proceso --> Fin\n```',
      rendered: 'Un diagrama de flujo simple con tres nodos conectados por flechas.'
    },
    tips: ['Empieza con diagramas simples', 'Mermaid es sensible a indentación y espacios', 'Usa comentarios %% para documentar el diagrama'],
    related: ['code-blocks']
  },
  {
    id: 'math',
    title: 'Matemáticas (LaTeX)',
    category: 'avanzado',
    summary: 'Escribe fórmulas matemáticas usando notación LaTeX, tanto en línea como en bloque.',
    syntax: ['$fórmula en línea$', '$$fórmula en bloque$$'],
    details: 'Las expresiones en línea se delimitan con $ simple. Las expresiones en bloque usan $$ doble. Soporta álgebra, cálculo, matrices, símbolos griegos y más.',
    example: {
      input: '$$E = mc^2$$',
      rendered: 'La famosa ecuación de Einstein, renderizada como fórmula matemática.'
    },
    tips: ['Usa $$ para fórmulas importantes que merecen su propia línea', 'Existen editores visuales de LaTeX si no recuerdas la sintaxis'],
    related: ['code-blocks']
  },
  {
    id: 'videos',
    title: 'Videos',
    category: 'avanzado',
    summary: 'Inserta videos desde YouTube o archivos locales directamente en el documento.',
    syntax: ['```video\nurl-del-video\n```', 'O embed directo desde YouTube'],
    details: 'Marknote permite insertar videos de YouTube (por URL) o archivos de video locales. El video se renderiza como un reproductor embebido dentro del documento.',
    example: {
      input: '```video\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ\n```',
      rendered: 'Un reproductor de video embebido en el documento.'
    },
    tips: ['Usa URLs completas de YouTube, no acortadas', 'Los videos locales deben estar en el mismo directorio del documento'],
    related: ['images', 'links']
  }
]
