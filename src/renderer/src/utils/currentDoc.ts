// Directorio del documento activo. Las rutas relativas de imágenes y videos
// del .md se resuelven contra su propia carpeta (no contra el workspace), así
// que los componentes de medios lo consultan al pedir el data URL por IPC.
let currentDocDir: string | null = null

export function setCurrentDocDir(dir: string | null): void {
  currentDocDir = dir
}

export function getCurrentDocDir(): string | null {
  return currentDocDir
}

// dirname() tolerante a separadores Windows y POSIX para rutas del renderer.
export function dirOfPath(p: string): string {
  const i = Math.max(p.lastIndexOf('\\'), p.lastIndexOf('/'))
  return i > 0 ? p.slice(0, i) : p
}
