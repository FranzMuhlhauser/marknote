import { describe, it, expect } from 'vitest'
import { getExtensions } from '../index'

// El corrector ortográfico marcaba en rojo el contenido de código (SQL,
// funciones…) cuando el diccionario español está activo. El atributo se
// aplica en dos sitios: la marca `code` (TipTap la renderiza en el DOM) y el
// NodeView propio de los bloques, que ignora HTMLAttributes y por eso necesita
// spellCheck={false} en el componente React.

function starterKitChild(name: string) {
  const extensions = getExtensions() as any[]
  const starterKit = extensions.find(e => e.name === 'starterKit')
  expect(starterKit, 'StarterKit debe estar en la lista de extensiones').toBeTruthy()
  const children = starterKit.config.addExtensions.call({
    options: starterKit.options,
    name: 'starterKit',
    parent: null
  }) as any[]
  return children.find(e => e.name === name)
}

describe('código excluido del corrector ortográfico', () => {
  it('la marca code lleva spellcheck="false"', () => {
    const code = starterKitChild('code')
    expect(code).toBeTruthy()
    expect(code.options.HTMLAttributes.spellcheck).toBe('false')
    // Comprobación del render real: [tag, attrs, 0]
    const rendered = code.config.renderHTML.call({ options: code.options }, { HTMLAttributes: {} })
    expect(rendered[0]).toBe('code')
    expect(rendered[1].spellcheck).toBe('false')
  })

  it('el bloque de código lleva spellcheck="false"', () => {
    const extensions = getExtensions() as any[]
    const codeBlock = extensions.find(e => e.name === 'codeBlock')
    expect(codeBlock).toBeTruthy()
    expect(codeBlock.options.HTMLAttributes.spellcheck).toBe('false')

    // El renderHTML vive en la clase base (CodeBlockLowlight extendido por el
    // NodeView); se busca subiendo por la cadena de `parent`.
    let renderer: any = codeBlock
    while (renderer && typeof renderer.config?.renderHTML !== 'function') {
      renderer = renderer.parent
    }
    expect(renderer, 'debe existir un renderHTML en la cadena').toBeTruthy()
    const rendered = renderer.config.renderHTML.call(
      { options: codeBlock.options },
      { node: { attrs: { language: 'sql' } }, HTMLAttributes: {} }
    )
    expect(rendered[0]).toBe('pre')
    expect(rendered[1].spellcheck).toBe('false')
  })
})
