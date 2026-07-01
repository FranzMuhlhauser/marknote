import { useState, useEffect } from 'react'
import { THEMES, type ThemeId, type CustomTheme } from '../utils/themes'
import { getCustomWords, addCustomWord, removeCustomWord } from '../utils/customDictionary'

interface SettingsProps {
  theme: ThemeId
  fontSize: number
  onThemeChange: (theme: ThemeId) => void
  onFontSizeChange: (size: number) => void
  onClose: () => void
}

export function Settings({ theme, fontSize, onThemeChange, onFontSizeChange, onClose }: SettingsProps) {
  const [customWords, setCustomWords] = useState<string[]>(() => getCustomWords())
  const [newWord, setNewWord] = useState('')

  useEffect(() => {
    setCustomWords(getCustomWords())
  }, [])

  const handleAddWord = async () => {
    const word = newWord.trim()
    if (!word) return
    const updated = addCustomWord(word)
    setCustomWords(updated)
    setNewWord('')
    await window.api.addCustomWord(word)
  }

  const handleRemoveWord = async (word: string) => {
    const updated = removeCustomWord(word)
    setCustomWords(updated)
    await window.api.removeCustomWord(word)
  }

  const [showCustomTheme, setShowCustomTheme] = useState(false)
  const [customTheme, setCustomTheme] = useState<CustomTheme>(() => {
    const saved = localStorage.getItem('marknote-custom-theme')
    return saved ? JSON.parse(saved) : {
      name: 'Personalizado',
      bg: '#fafafa',
      text: '#1a1a1a',
      border: '#e0e0e0',
      accent: '#4f6ef7',
      codeBg: '#f0f0f0'
    }
  })

  const applyCustomTheme = () => {
    const root = document.documentElement
    root.style.setProperty('--bg', customTheme.bg)
    root.style.setProperty('--text', customTheme.text)
    root.style.setProperty('--border', customTheme.border)
    root.style.setProperty('--accent', customTheme.accent)
    root.style.setProperty('--code-bg', customTheme.codeBg)
    root.style.setProperty('--hover', customTheme.bg)
    root.style.setProperty('--sidebar-bg', customTheme.bg)
    root.style.setProperty('--toolbar-bg', customTheme.bg)
    root.style.setProperty('--titlebar-bg', customTheme.bg)
    root.style.setAttribute('data-theme', 'custom')
  }

  const saveCustomTheme = () => {
    localStorage.setItem('marknote-custom-theme', JSON.stringify(customTheme))
    localStorage.setItem('marknote-theme', 'custom')
    applyCustomTheme()
    onThemeChange('custom' as ThemeId)
    setShowCustomTheme(false)
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Configuración</h2>
          <button className="toolbar-btn" onClick={onClose}>✕</button>
        </div>
        <div className="settings-body">
          <section className="settings-section">
            <h3>Apariencia</h3>
            <label className="settings-label">Tema</label>
            <div className="settings-themes">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  className={`settings-theme-btn ${theme === t.id ? 'active' : ''}`}
                  onClick={() => { 
                    document.documentElement.style.removeProperty('--bg')
                    document.documentElement.style.removeProperty('--text')
                    document.documentElement.style.removeProperty('--border')
                    document.documentElement.style.removeProperty('--accent')
                    document.documentElement.style.removeProperty('--code-bg')
                    document.documentElement.style.removeProperty('--hover')
                    document.documentElement.style.removeProperty('--sidebar-bg')
                    document.documentElement.style.removeProperty('--toolbar-bg')
                    document.documentElement.style.removeProperty('--titlebar-bg')
                    onThemeChange(t.id) 
                  }}
                >
                  {t.label}
                </button>
              ))}
              <button
                className={`settings-theme-btn ${theme === 'custom' ? 'active' : ''}`}
                onClick={() => {
                  const saved = localStorage.getItem('marknote-custom-theme')
                  if (saved) {
                    const ct = JSON.parse(saved) as CustomTheme
                    setCustomTheme(ct)
                    applyCustomTheme()
                    onThemeChange('custom' as ThemeId)
                  }
                  setShowCustomTheme(true)
                }}
              >
                Personalizado
              </button>
            </div>
          </section>

          {showCustomTheme && (
            <section className="settings-section">
              <h3>Personalizar Tema</h3>
              <div className="custom-theme-grid">
                <label>
                  <span className="settings-label">Nombre</span>
                  <input className="settings-input" value={customTheme.name} onChange={e => setCustomTheme(p => ({ ...p, name: e.target.value }))} />
                </label>
                <label>
                  <span className="settings-label">Fondo</span>
                  <input className="settings-input" type="color" value={customTheme.bg} onChange={e => setCustomTheme(p => ({ ...p, bg: e.target.value }))} />
                </label>
                <label>
                  <span className="settings-label">Texto</span>
                  <input className="settings-input" type="color" value={customTheme.text} onChange={e => setCustomTheme(p => ({ ...p, text: e.target.value }))} />
                </label>
                <label>
                  <span className="settings-label">Borde</span>
                  <input className="settings-input" type="color" value={customTheme.border} onChange={e => setCustomTheme(p => ({ ...p, border: e.target.value }))} />
                </label>
                <label>
                  <span className="settings-label">Acento</span>
                  <input className="settings-input" type="color" value={customTheme.accent} onChange={e => setCustomTheme(p => ({ ...p, accent: e.target.value }))} />
                </label>
                <label>
                  <span className="settings-label">Fondo código</span>
                  <input className="settings-input" type="color" value={customTheme.codeBg} onChange={e => setCustomTheme(p => ({ ...p, codeBg: e.target.value }))} />
                </label>
              </div>
              <div className="settings-actions">
                <button className="settings-action-btn primary" onClick={saveCustomTheme}>Guardar tema</button>
                <button className="settings-action-btn" onClick={() => { applyCustomTheme(); setShowCustomTheme(false) }}>Vista previa</button>
                <button className="settings-action-btn" onClick={() => setShowCustomTheme(false)}>Cancelar</button>
              </div>
            </section>
          )}

          <section className="settings-section">
            <h3>Editor</h3>
            <label className="settings-label">Tamaño de fuente: {fontSize}px</label>
            <input
              type="range"
              min={14}
              max={22}
              value={fontSize}
              onChange={e => onFontSizeChange(Number(e.target.value))}
              className="settings-range"
            />
          </section>

          <section className="settings-section">
            <h3>Corrección ortográfica</h3>
            <p className="settings-desc">Palabras que no se marcarán como error ortográfico.</p>
            <div className="dictionary-add">
              <input
                className="settings-input dictionary-input"
                placeholder="Ej: Marknote"
                value={newWord}
                onChange={e => setNewWord(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddWord() }}
              />
              <button className="settings-action-btn primary" onClick={handleAddWord} disabled={!newWord.trim()}>Agregar</button>
            </div>
            {customWords.length > 0 && (
              <div className="dictionary-list">
                {customWords.map(word => (
                  <div key={word} className="dictionary-word">
                    <span>{word}</span>
                    <button className="dictionary-remove" onClick={() => handleRemoveWord(word)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="settings-section">
            <h3>Plugins</h3>
            <div className="plugins-list">
              <div className="plugin-item">
                <div className="plugin-info">
                  <span className="plugin-name">KaTeX (Matemáticas)</span>
                  <span className="plugin-desc">Renderizado de fórmulas LaTeX</span>
                </div>
                <span className="plugin-status active">Activo</span>
              </div>
              <div className="plugin-item">
                <div className="plugin-info">
                  <span className="plugin-name">Mermaid (Diagramas)</span>
                  <span className="plugin-desc">Diagramas y gráficos con Mermaid</span>
                </div>
                <span className="plugin-status active">Activo</span>
              </div>
              <div className="plugin-item">
                <div className="plugin-info">
                  <span className="plugin-name">Syntax Highlight</span>
                  <span className="plugin-desc">Resaltado de sintaxis en bloques de código</span>
                </div>
                <span className="plugin-status active">Activo</span>
              </div>
              <div className="plugin-item">
                <div className="plugin-info">
                  <span className="plugin-name">Tablas</span>
                  <span className="plugin-desc">Soporte de tablas con menú contextual</span>
                </div>
                <span className="plugin-status active">Activo</span>
              </div>
              <div className="plugin-item">
                <div className="plugin-info">
                  <span className="plugin-name">Exportar HTML</span>
                  <span className="plugin-desc">Exportación a HTML</span>
                </div>
                <span className="plugin-status active">Activo</span>
              </div>
              <div className="plugin-item">
                <div className="plugin-info">
                  <span className="plugin-name">Exportar PDF</span>
                  <span className="plugin-desc">Exportación a PDF vía html2canvas + jsPDF</span>
                </div>
                <span className="plugin-status active">Activo</span>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h3>Atajos</h3>
            <div className="settings-shortcuts">
              <div><kbd>Ctrl+N</kbd> Nuevo</div>
              <div><kbd>Ctrl+O</kbd> Abrir</div>
              <div><kbd>Ctrl+S</kbd> Guardar</div>
              <div><kbd>Ctrl+Shift+S</kbd> Guardar como</div>
              <div><kbd>Ctrl+Shift+O</kbd> Abrir carpeta</div>
              <div><kbd>Ctrl+W</kbd> Cerrar pestaña</div>
              <div><kbd>Ctrl+Tab</kbd> Siguiente pestaña</div>
              <div><kbd>Ctrl+Z</kbd> Deshacer</div>
              <div><kbd>Ctrl+Y</kbd> Rehacer</div>
              <div><kbd>Ctrl+F</kbd> Buscar</div>
              <div><kbd>Ctrl+H</kbd> Buscar y reemplazar</div>
              <div><kbd>Ctrl+Shift+M</kbd> Vista fuente</div>
              <div><kbd>F9</kbd> Explorador de archivos</div>
              <div><kbd>F11</kbd> Pantalla completa</div>
              <div><kbd>Ctrl+Shift+P</kbd> Paleta de comandos</div>
              <div><kbd>Escape</kbd> Cerrar diálogos</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
