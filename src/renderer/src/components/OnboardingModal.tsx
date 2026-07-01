import React from 'react'

interface OnboardingStep {
  title: string
  description: string
  icon: string
}

const steps: OnboardingStep[] = [
  {
    title: 'Bienvenido a Marknote',
    description: 'Un editor Markdown WYSIWYG minimalista y potente para escribir sin distracciones. Comencemos con un tour rápido.',
    icon: '📝'
  },
  {
    title: 'Editor WYSIWYG',
    description: 'Edita Markdown en tiempo real viendo el resultado formateado. Usa Ctrl+/ para ver la vista fuente o alterna con el botón en la toolbar.',
    icon: '✏️'
  },
  {
    title: 'Barra de Herramientas',
    description: 'Acceso rápido a formato (negrita, cursiva, títulos), inserción (imagen, tabla, código) y vistas (esquema, estadísticas, búsqueda).',
    icon: '🛠️'
  },
  {
    title: 'Explorador de Archivos',
    description: 'Abre una carpeta con F9. Gestiona archivos, renombra, duplica y organiza tus documentos. Haz clic derecho para opciones.',
    icon: '📁'
  },
  {
    title: 'Paleta de Comandos',
    description: 'Presiona Ctrl+Shift+P para acceder rápidamente a cualquier función. Escribe para filtrar, usa flechas para navegar.',
    icon: '⌨️'
  },
  {
    title: 'Atajos Útiles',
    description: 'Ctrl+F: Buscar | Ctrl+S: Guardar | F11: Pantalla completa | Ctrl+Z: Deshacer | Ctrl+Shift+P: Paleta de comandos',
    icon: '⚡'
  },
  {
    title: '¡Listo para comenzar!',
    description: 'Crea un documento nuevo, abre uno existente o importa una carpeta. Siempre puedes ver esta guía en Ayuda > Ver guía nuevamente.',
    icon: '🚀'
  }
]

interface OnboardingModalProps {
  onClose: () => void
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = React.useState(0)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    localStorage.setItem('marknote-onboarding-shown', 'true')
    onClose()
  }

  const step = steps[currentStep]

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-header">
          <button className="onboarding-close" onClick={handleClose} title="Cerrar">✕</button>
        </div>

        <div className="onboarding-content">
          <div className="onboarding-icon">{step.icon}</div>
          <h2 className="onboarding-title">{step.title}</h2>
          <p className="onboarding-description">{step.description}</p>
        </div>

        <div className="onboarding-progress">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot ${i === currentStep ? 'active' : ''}`}
              onClick={() => setCurrentStep(i)}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          <button
            className="onboarding-btn secondary"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            ← Anterior
          </button>
          <button
            className="onboarding-btn primary"
            onClick={handleNext}
          >
            {currentStep === steps.length - 1 ? 'Comenzar' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  )
}
