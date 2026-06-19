const tips = [
  'Presiona Ctrl+B para mostrar u ocultar el explorador.',
  'Ctrl+Shift+P abre la paleta de comandos.',
  'Ctrl+F para buscar y reemplazar texto.',
  'Usa / en el editor para acceder a comandos rápidos.',
  'F11 alterna el modo pantalla completa.',
]

interface WelcomeScreenProps {
  onNew: () => void
  onOpen: () => void
}

export function WelcomeScreen({ onNew, onOpen }: WelcomeScreenProps) {
  const tip = tips[Math.floor(Math.random() * tips.length)]

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-icon">📝</div>
        <h1 className="welcome-title">Bienvenido a Marknote</h1>
        <p className="welcome-subtitle">Editor Markdown WYSIWYG para escribir sin distracciones.</p>
        <div className="welcome-actions">
          <button className="welcome-btn primary" onClick={onNew}>Crear Documento</button>
          <button className="welcome-btn" onClick={onOpen}>Abrir Documento</button>
        </div>
        <p className="welcome-description">
          Escribe, organiza y exporta tus notas en Markdown con una experiencia rápida y minimalista.
        </p>
        <div className="welcome-tip">
          <span className="welcome-tip-label">Tip:</span> {tip}
        </div>
      </div>
    </div>
  )
}
