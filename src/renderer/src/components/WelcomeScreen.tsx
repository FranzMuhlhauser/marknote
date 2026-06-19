interface WelcomeScreenProps {
  onNew: () => void
  onOpen: () => void
  onOpenRecent: (path: string) => void
}

export function WelcomeScreen({ onNew, onOpen, onOpenRecent }: WelcomeScreenProps) {
  const recent = JSON.parse(localStorage.getItem('marknote-recent') || '[]') as string[]

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-icon">📝</div>
        <h1 className="welcome-title">Bienvenido a Marknote</h1>
        <p className="welcome-subtitle">Editor Markdown WYSIWYG</p>
        <div className="welcome-actions">
          <button className="welcome-btn primary" onClick={onNew}>Crear Documento</button>
          <button className="welcome-btn" onClick={onOpen}>Abrir Documento</button>
        </div>
        {recent.length > 0 && (
          <div className="welcome-recent">
            <h2 className="welcome-recent-title">Recientes</h2>
            <ul className="welcome-recent-list">
              {recent.map(path => {
                const name = path.split('\\').pop()?.split('/').pop() || path
                return (
                  <li key={path}>
                    <button className="welcome-recent-item" onClick={() => onOpenRecent(path)} title={path}>
                      {name}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        <div className="welcome-shortcuts">
          <h2 className="welcome-shortcuts-title">Atajos rápidos</h2>
          <div className="welcome-shortcuts-grid">
            <div className="shortcut-row"><kbd>Ctrl+N</kbd> Nuevo</div>
            <div className="shortcut-row"><kbd>Ctrl+O</kbd> Abrir</div>
            <div className="shortcut-row"><kbd>Ctrl+S</kbd> Guardar</div>
            <div className="shortcut-row"><kbd>Ctrl+Shift+P</kbd> Paleta de comandos</div>
            <div className="shortcut-row"><kbd>Ctrl+F</kbd> Buscar</div>
            <div className="shortcut-row"><kbd>F11</kbd> Pantalla completa</div>
          </div>
        </div>
      </div>
    </div>
  )
}
