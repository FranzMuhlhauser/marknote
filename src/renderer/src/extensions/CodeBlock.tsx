import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react'
import { useCallback, useState } from 'react'

const LANGUAGES = [
  { display: 'Plain Text', value: null },
  { display: 'JavaScript', value: 'javascript' },
  { display: 'TypeScript', value: 'typescript' },
  { display: 'Python', value: 'python' },
  { display: 'Java', value: 'java' },
  { display: 'C', value: 'c' },
  { display: 'C++', value: 'cpp' },
  { display: 'C#', value: 'csharp' },
  { display: 'PHP', value: 'php' },
  { display: 'Ruby', value: 'ruby' },
  { display: 'Go', value: 'go' },
  { display: 'Rust', value: 'rust' },
  { display: 'SQL', value: 'sql' },
  { display: 'HTML', value: 'html' },
  { display: 'CSS', value: 'css' },
  { display: 'JSON', value: 'json' },
  { display: 'YAML', value: 'yaml' },
  { display: 'Bash', value: 'bash' },
]

function getDisplayName(lang: string | null): string {
  const found = lang ? LANGUAGES.find(l => l.value === lang) : null
  return found ? found.display : lang || 'Plain Text'
}

export const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent)
  }
})

function CodeBlockComponent({ node, updateAttributes, extension }: any) {
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showLines, setShowLines] = useState(true)

  const currentLang = node.attrs.language || null

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(node.textContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [node.textContent])

  const handleLangChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateAttributes({ language: e.target.value || null })
  }, [updateAttributes])

  const lines = node.textContent.split('\n')

  return (
    <NodeViewWrapper className={`code-block-wrapper ${collapsed ? 'collapsed' : ''}`}>
      <div className="code-block-header">
        <div className="code-block-lang-area">
          <select
            className="code-block-lang-select"
            value={currentLang || ''}
            onChange={handleLangChange}
            title="Cambiar lenguaje"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.display} value={lang.value || ''}>
                {lang.display}
              </option>
            ))}
          </select>
        </div>
        <div className="code-block-actions">
          <button
            className="code-block-btn"
            onClick={() => setShowLines(s => !s)}
            data-active={showLines}
            title={showLines ? 'Ocultar números de línea' : 'Mostrar números de línea'}
          >
            {'#'}
          </button>
          <button className="code-block-btn" onClick={handleCopy} title="Copiar código">
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
          <button className="code-block-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expandir' : 'Colapsar'}>
            {collapsed ? '▸' : '▾'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="code-block-body">
          {showLines && (
            <div className="code-block-lines" aria-hidden="true">
              {lines.map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
          )}
          <pre><NodeViewContent as="code" /></pre>
        </div>
      )}
    </NodeViewWrapper>
  )
}
