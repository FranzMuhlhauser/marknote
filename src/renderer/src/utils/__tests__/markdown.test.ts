import { describe, it, expect } from 'vitest'
import { mdToHtml, htmlToMd } from '../markdown'

// Estos tests cubren los dos bugs reales que llegaron a producción:
//  1. código inline dentro de task items que se corrompía al guardar
//     (`DROP` -> \`DROP\` -> más barras en cada guardado), y
//  2. el corrector ortográfico marcando el contenido de <code>.
// La ida y vuelta md -> html -> md debe ser estable: si el ciclo cambia el
// texto, abrir y guardar corrompe el archivo del usuario.

const roundTrip = (md: string) => htmlToMd(mdToHtml(md))

describe('mdToHtml', () => {
  it('renderiza el código inline como <code>', () => {
    // El atributo spellcheck="false" lo añade la marca `code` de TipTap al
    // montar el documento en el editor (ver extensions/spellcheck.test.ts),
    // no markdown-it, que aquí sólo genera el HTML de entrada.
    const html = mdToHtml('Resumen (`COUNT`).')
    expect(html).toContain('<code>COUNT</code>')
  })

  it('renderiza código inline dentro de task items (sin backticks crudos)', () => {
    const html = mdToHtml('- [ ] Día 2: Creación (`CREATE TABLE`, `DROP`).')
    expect(html).toContain('<code>CREATE TABLE</code>')
    expect(html).toContain('<code>DROP</code>')
    // Un backtick suelto dentro del HTML significa que quedó markdown crudo
    // dentro del bloque HTML de la lista, que es el origen de la corrupción.
    expect(html).not.toContain('`')
  })

  it('mantiene intactos los bloques de código cercados', () => {
    const html = mdToHtml('```sql\nSELECT COUNT(*) FROM t;\n```')
    expect(html).toContain('<pre')
    expect(html).toContain('language-sql')
    expect(html).toContain('SELECT COUNT(*) FROM t;')
  })

  it('convierte listas de tareas en taskList con checkbox', () => {
    const html = mdToHtml('- [x] Hecho\n- [ ] Pendiente')
    expect(html).toContain('data-type="taskList"')
    expect(html).toContain('data-checked="true"')
    expect(html).toContain('data-checked="false"')
  })

  it('sanea HTML potencialmente malicioso', () => {
    const html = mdToHtml('<img src=x onerror="alert(1)">')
    expect(html).not.toContain('onerror')
  })
})

describe('htmlToMd', () => {
  it('escapa los backticks que no son código', () => {
    expect(htmlToMd('<p>texto con ` suelto</p>')).toContain('\\`')
  })

  it('produce código inline desde <code>', () => {
    expect(htmlToMd('<p>usa <code>DROP</code></p>')).toContain('`DROP`')
  })
})

describe('ida y vuelta md -> html -> md', () => {
  const cases: Array<[string, string]> = [
    ['párrafo con código', 'Resumen (`COUNT`, `SUM`).'],
    ['task item con código', '- [ ] Día 2: creación (`CREATE TABLE`, `DROP`, `ALTER`).'],
    ['task item sin código', '- [ ] Día 1: conceptos básicos.'],
    ['lista de tareas marcada', '- [x] Hecho\n- [ ] Pendiente'],
    ['bloque de código', '```sql\nSELECT 1;\n```'],
    ['formato mixto', '# Título\n\nTexto con **negrita**, *cursiva* y `código`.\n\n- [ ] Tarea con `code`.'],
    ['tabla', '| A | B |\n|---|---|\n| 1 | 2 |'],
  ]

  for (const [name, md] of cases) {
    it(`es estable en un ciclo (${name})`, () => {
      const once = roundTrip(md)
      const twice = roundTrip(once)
      // Turndown recorta el \n final; se normaliza para comparar el contenido.
      expect(twice.trim()).toBe(once.trim())
    })
  }

  it('no acumula barras invertidas en task items con código', () => {
    const original = '- [ ] Día 2: creación (`CREATE TABLE`, `DROP`).'
    const first = roundTrip(original)
    const second = roundTrip(first)
    const third = roundTrip(second)

    // El bug hacía crecer las barras en cada guardado; el número de
    // backticks (y de barras) debe quedarse igual.
    const count = (s: string) => (s.match(/`/g) || []).length
    expect(count(first)).toBe(count(original))
    expect(count(second)).toBe(count(original))
    expect(count(third)).toBe(count(original))
    expect(third).toContain('`DROP`')
    expect(third).not.toContain('\\')
  })
})
