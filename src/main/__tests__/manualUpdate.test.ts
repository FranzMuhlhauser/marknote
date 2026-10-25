import { describe, it, expect } from 'vitest'
import { parseVersion, isNewerVersion, pickLinuxDownload, findManualUpdate, isAppImageRun, type GitHubRelease } from '../manualUpdate'

const release = (over: Partial<GitHubRelease> = {}): GitHubRelease => ({
  tag_name: 'v1.0.5',
  html_url: 'https://github.com/FranzMuhlhauser/marknote/releases/tag/v1.0.5',
  draft: false,
  prerelease: false,
  assets: [
    { name: 'Marknote-1.0.5-Setup.exe', browser_download_url: 'https://example/exe' },
    { name: 'marknote_1.0.5_amd64.deb', browser_download_url: 'https://example/deb' },
    { name: 'Marknote-1.0.5.AppImage', browser_download_url: 'https://example/appimage' }
  ],
  ...over
})

describe('parseVersion', () => {
  it('quita la v y separa por puntos', () => {
    expect(parseVersion('v1.0.4')).toEqual([1, 0, 4])
    expect(parseVersion('1.0.4')).toEqual([1, 0, 4])
  })

  it('ignora sufijos de pre-release', () => {
    expect(parseVersion('v1.2.3-beta.1')).toEqual([1, 2, 3])
  })

  it('no rompe con partes no numéricas', () => {
    expect(parseVersion('v1.x.4')).toEqual([1, 0, 4])
  })
})

describe('isNewerVersion', () => {
  it('detecta una versión más nueva', () => {
    expect(isNewerVersion('1.0.5', '1.0.4')).toBe(true)
    expect(isNewerVersion('v1.0.5', 'v1.0.4')).toBe(true)
  })

  it('la misma versión no es nueva', () => {
    expect(isNewerVersion('1.0.4', '1.0.4')).toBe(false)
    expect(isNewerVersion('v1.0.4', '1.0.4')).toBe(false)
  })

  it('una versión más vieja no es nueva', () => {
    expect(isNewerVersion('1.0.3', '1.0.4')).toBe(false)
  })

  it('compara numéricamente, no como texto', () => {
    // "1.0.10" < "1.0.9" si se compara como string: este es el caso que rompe.
    expect(isNewerVersion('1.0.10', '1.0.9')).toBe(true)
    expect(isNewerVersion('1.10.0', '1.9.9')).toBe(true)
  })

  it('trata 1.2 y 1.2.0 como iguales', () => {
    expect(isNewerVersion('1.2', '1.2.0')).toBe(false)
    expect(isNewerVersion('1.2.0', '1.2')).toBe(false)
  })
})

describe('pickLinuxDownload', () => {
  it('prefiere el .deb de amd64', () => {
    expect(pickLinuxDownload(release())).toBe('https://example/deb')
  })

  it('cae al AppImage si no hay .deb', () => {
    const r = release({ assets: [{ name: 'Marknote-1.0.5.AppImage', browser_download_url: 'https://example/appimage' }] })
    expect(pickLinuxDownload(r)).toBe('https://example/appimage')
  })

  it('cae a la página del release si no hay binarios Linux', () => {
    const r = release({ assets: [{ name: 'Marknote-1.0.5-Setup.exe', browser_download_url: 'https://example/exe' }] })
    expect(pickLinuxDownload(r)).toBe('https://github.com/FranzMuhlhauser/marknote/releases/tag/v1.0.5')
  })

  it('devuelve null si no hay assets ni html_url', () => {
    expect(pickLinuxDownload({ tag_name: 'v1.0.5' })).toBeNull()
  })
})

describe('findManualUpdate', () => {
  it('avisa con la versión y el enlace del .deb', () => {
    expect(findManualUpdate(release(), '1.0.4')).toEqual({ version: '1.0.5', url: 'https://example/deb' })
  })

  it('no avisa si ya está en la última versión', () => {
    expect(findManualUpdate(release(), '1.0.5')).toBeNull()
  })

  it('no avisa de una versión más vieja', () => {
    expect(findManualUpdate(release({ tag_name: 'v1.0.3' }), '1.0.4')).toBeNull()
  })

  it('ignora borradores y pre-releases', () => {
    expect(findManualUpdate(release({ draft: true }), '1.0.4')).toBeNull()
    expect(findManualUpdate(release({ prerelease: true }), '1.0.4')).toBeNull()
  })

  it('no avisa sin tag ni enlace de descarga', () => {
    expect(findManualUpdate(release({ tag_name: undefined }), '1.0.4')).toBeNull()
    expect(findManualUpdate(release({ assets: [], html_url: undefined }), '1.0.4')).toBeNull()
  })
})

describe('isAppImageRun', () => {
  it('detecta una ejecución real desde AppImage', () => {
    expect(isAppImageRun(
      { APPIMAGE: '/home/u/Marknote.AppImage', APPDIR: '/tmp/.mount_Markno1' },
      '/tmp/.mount_Markno1/marknote'
    )).toBe(true)
  })

  it('no se deja engañar por un APPIMAGE heredado de otro proceso', () => {
    // Caso real: una terminal dentro de otra app AppImage exporta APPIMAGE,
    // pero el ejecutable es el de la instalación .deb.
    expect(isAppImageRun(
      { APPIMAGE: '/home/u/OtraApp.AppImage', APPDIR: '/tmp/.mount_Freebu' },
      '/opt/Marknote/marknote'
    )).toBe(false)
  })

  it('sin APPIMAGE o sin APPDIR no es AppImage', () => {
    expect(isAppImageRun({}, '/opt/Marknote/marknote')).toBe(false)
    expect(isAppImageRun({ APPIMAGE: '/home/u/Marknote.AppImage' }, '/opt/Marknote/marknote')).toBe(false)
  })
})
