// Utilidades de lectura de archivos locales compartidas entre el menú slash,
// la paleta de comandos y el drag & drop del editor.

function readFile(file: File, asText: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    if (asText) reader.readAsText(file)
    else reader.readAsDataURL(file)
  })
}

export function readFileAsDataURL(file: File): Promise<string> {
  return readFile(file, false)
}

export function readFileAsText(file: File): Promise<string> {
  return readFile(file, true)
}

/** Abre el selector de archivos y resuelve la imagen elegida como data URL (null si se cancela). */
export function pickImageAsDataURL(accept = 'image/*'): Promise<string | null> {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      readFileAsDataURL(file).then(resolve, () => resolve(null))
    }
    input.click()
  })
}
