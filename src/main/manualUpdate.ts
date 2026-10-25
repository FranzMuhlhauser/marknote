// Detección de versiones nuevas para instalaciones que NO pueden
// autoactualizarse: en Linux, electron-updater solo sabe reemplazar AppImages
// (necesita la variable APPIMAGE), así que un Marknote instalado desde el
// .deb nunca se entera de que hay una versión nueva.
//
// Este módulo consulta la API de GitHub y devuelve la versión publicada más el
// enlace de descarga directa del .deb. No actualiza nada por su cuenta: solo
// permite avisar al usuario y darle un enlace.
//
// Sin imports de electron a propósito, para poder probarlo con Vitest.

export interface ReleaseAsset {
  name: string
  browser_download_url: string
}

export interface GitHubRelease {
  tag_name?: string
  html_url?: string
  draft?: boolean
  prerelease?: boolean
  assets?: ReleaseAsset[]
}

export interface ManualUpdate {
  version: string
  url: string
}

/**
 * true si esta instancia concreta se está ejecutando como AppImage.
 *
 * No basta con mirar `APPIMAGE`: cualquier proceso hijo de un AppImage hereda
 * esa variable (por ejemplo, si lanzas Marknote desde la terminal de otra app
 * empaquetada así), y entonces un Marknote instalado por .deb creería poder
 * autoactualizarse. La comprobación fiable es que el ejecutable real viva
 * dentro del punto de montaje (`APPDIR`) que expone el runtime del AppImage.
 */
export function isAppImageRun(env: NodeJS.ProcessEnv, execPath: string): boolean {
  if (!env.APPIMAGE || !env.APPDIR) return false
  return execPath.startsWith(env.APPDIR)
}

/** "v1.0.4" -> [1, 0, 4]; ignora sufijos como "-beta.1". */
export function parseVersion(version: string): number[] {
  return version
    .trim()
    .replace(/^v/i, '')
    .split('-')[0]
    .split('.')
    .map(part => {
      const n = Number.parseInt(part, 10)
      return Number.isFinite(n) ? n : 0
    })
}

/**
 * true si `candidate` es estrictamente más nueva que `current`.
 * Compara componente a componente y rellena con 0 ("1.2" == "1.2.0").
 */
export function isNewerVersion(candidate: string, current: string): boolean {
  const a = parseVersion(candidate)
  const b = parseVersion(current)
  const length = Math.max(a.length, b.length)
  for (let i = 0; i < length; i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x !== y) return x > y
  }
  return false
}

/**
 * Elige el archivo a descargar. Para un Marknote instalado por .deb el
 * candidato natural es el .deb de amd64; si esa release no lo trae (por
 * ejemplo una release antigua o solo Windows), se cae al AppImage y, en
 * último caso, a la página del release.
 */
export function pickLinuxDownload(release: GitHubRelease): string | null {
  const assets = release.assets ?? []
  const deb = assets.find(a => a.name.toLowerCase().endsWith('_amd64.deb'))
  if (deb) return deb.browser_download_url
  const appImage = assets.find(a => a.name.toLowerCase().endsWith('.appimage'))
  if (appImage) return appImage.browser_download_url
  return release.html_url ?? null
}

/**
 * Devuelve la actualización disponible, o null si no hay nada más nuevo
 * (o si la release es un borrador / pre-release).
 */
export function findManualUpdate(release: GitHubRelease, currentVersion: string): ManualUpdate | null {
  if (release.draft || release.prerelease) return null
  const tag = release.tag_name
  if (!tag) return null
  if (!isNewerVersion(tag, currentVersion)) return null
  const url = pickLinuxDownload(release)
  if (!url) return null
  return { version: tag.replace(/^v/i, ''), url }
}
