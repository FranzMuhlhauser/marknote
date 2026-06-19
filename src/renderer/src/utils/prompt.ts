/**
 * Muestra un diálogo modal de prompt compatible con Electron.
 * Reemplaza window.prompt() que no está disponible en Electron moderno.
 */
export function showPrompt(title: string, defaultValue = ''): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'image-alt-input-overlay'
    overlay.style.display = 'flex'

    const box = document.createElement('div')
    box.className = 'image-alt-input-box'

    const label = document.createElement('label')
    label.className = 'image-alt-label'
    label.textContent = title

    const input = document.createElement('input')
    input.className = 'image-alt-input'
    input.type = 'text'
    input.value = defaultValue
    input.autofocus = true

    const actions = document.createElement('div')
    actions.className = 'image-alt-actions'

    const okBtn = document.createElement('button')
    okBtn.className = 'toolbar-btn'
    okBtn.textContent = 'Aceptar'

    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'toolbar-btn'
    cancelBtn.textContent = 'Cancelar'

    actions.appendChild(okBtn)
    actions.appendChild(cancelBtn)
    box.appendChild(label)
    box.appendChild(input)
    box.appendChild(actions)
    overlay.appendChild(box)
    document.body.appendChild(overlay)

    input.focus()
    input.select()

    const cleanup = () => {
      document.body.removeChild(overlay)
    }

    const submit = () => {
      cleanup()
      resolve(input.value)
    }

    const cancel = () => {
      cleanup()
      resolve(null)
    }

    okBtn.onclick = submit
    cancelBtn.onclick = cancel
    input.onkeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') submit()
      if (e.key === 'Escape') cancel()
    }
    overlay.onclick = cancel
    box.onclick = (e) => e.stopPropagation()
  })
}
