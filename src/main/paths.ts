import { normalize, relative, isAbsolute, dirname } from 'path'

// Validación de rutas de archivos (defensa en profundidad)
// El renderer solo puede operar sobre archivos autorizados:
//  - abiertos/guardados vía diálogo nativo,
//  - recibidos al iniciar (segunda instancia / asociación de archivos),
//  - listados desde el workspace abierto,
//  - o leídos con éxito previamente.
// Esto limita el daño si el renderer llegara a ejecutar código no confiable.
const authorizedPaths = new Set<string>()
let workspaceFolder: string | null = null

export function isAuthorized(p: string): boolean {
  return authorizedPaths.has(normalize(p))
}

export function isWithinWorkspace(p: string): boolean {
  if (!workspaceFolder) return false
  const rel = relative(workspaceFolder, p)
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)
}

export function isPathAllowed(p: string): boolean {
  return isAuthorized(p) || isWithinWorkspace(p)
}

export function isValidPathInput(p: unknown): p is string {
  return typeof p === 'string' && p.length > 0 && !p.includes('\0') && isAbsolute(p)
}

export function isMarkdownPath(p: string): boolean {
  return p.toLowerCase().endsWith('.md')
}

export function isSafeName(name: unknown): name is string {
  return (
    typeof name === 'string' &&
    name.trim() !== '' &&
    name !== '.' &&
    name !== '..' &&
    !name.includes('\\') &&
    !name.includes('/')
  )
}

export function authorizePath(p: string): void {
  if (isValidPathInput(p)) authorizedPaths.add(normalize(p))
}

export function setWorkspaceFolder(p: string): void {
  workspaceFolder = p
}

export function getWorkspaceFolder(): string | null {
  return workspaceFolder
}

export function assertFileAllowed(p: string): void {
  if (!isPathAllowed(p)) throw new Error('Acceso denegado: la ruta no está autorizada')
}

// Renombrar/mover dentro del mismo directorio de un archivo autorizado se
// permite aunque el destino aún no esté registrado (ej. favoritos abiertos).
export function isMoveAllowed(oldPath: string, newPath: string): boolean {
  if (isPathAllowed(newPath)) return true
  return isPathAllowed(oldPath) && normalize(dirname(oldPath)) === normalize(dirname(newPath))
}
