import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { useCallback, useState } from 'react'

export const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent)
  }
})

function CodeBlockComponent({ node, updateAttributes, extension, contentDOM }: any) {
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editingLang, setEditingLang] = useState(false)
  const [langInput, setLangInput] = useState(node.attrs.language || '')

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(node.textContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [node.textContent])

  const handleLangChange = useCallback(() => {
    updateAttributes({ language: langInput || null })
    setEditingLang(false)
  }, [langInput, updateAttributes])

  return (
    <div className={`code-block-wrapper ${collapsed ? 'collapsed' : ''}`}>
      <div className="code-block-header">
        <div className="code-block-lang-area">
          {editingLang ? (
            <input
              className="code-block-lang-input"
              value={langInput}
              onChange={e => setLangInput(e.target.value)}
              onBlur={handleLangChange}
              onKeyDown={e => { if (e.key === 'Enter') handleLangChange() }}
              autoFocus
            />
          ) : (
            <span
              className="code-block-lang"
              onClick={() => { setLangInput(node.attrs.language || ''); setEditingLang(true) }}
              title="Click to change language"
            >
              {node.attrs.language || 'text'}
            </span>
          )}
        </div>
        <div className="code-block-actions">
          <button className="code-block-btn" onClick={handleCopy} title="Copy code">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button className="code-block-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? '▸' : '▾'}
          </button>
        </div>
      </div>
      {!collapsed && <pre><code ref={contentDOM} /></pre>}
    </div>
  )
}
