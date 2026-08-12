import { app, BrowserWindow, ipcMain, dialog, Menu, session } from 'electron'
import { join, basename, extname, isAbsolute, resolve } from 'path'
import { readFile, writeFile, readdir, mkdir, rename, copyFile, unlink } from 'fs/promises'
import { constants as fsConstants } from 'fs'
import { autoUpdater } from 'electron-updater'
import { authorizePath, assertFileAllowed, getWorkspaceFolder, isMarkdownPath, isMoveAllowed, isSafeName, isValidPathInput, setWorkspaceFolder } from './paths'

let mainWindow: BrowserWindow | null = null
let startupFilePath: string | null = null

function send(channel: string, ...args: any[]) {
  mainWindow?.webContents.send(channel, ...args)
}

function dispatchOpenFile(filePath: string) {
  startupFilePath = filePath
  authorizePath(filePath)
  if (!mainWindow) return

  const sendFile = () => send('file:open', filePath)
  if (mainWindow.webContents.isLoadingMainFrame()) {
    mainWindow.webContents.once('did-finish-load', sendFile)
  } else {
    sendFile()
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    titleBarStyle: 'hiddenInset',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      spellcheck: true
    }
  })

  mainWindow.webContents.on('console-message', (_event, level, message) => {
    const tag = ['verbose', 'info', 'warn', 'error'][level] || 'log'
    console.log(`[renderer:${tag}] ${message}`)
  })

  session.defaultSession.setSpellCheckerLanguages(['es'])

  // CSP estricta solo en producción: el dev server de Vite requiere scripts
  // inline (react-refresh) y websockets de HMR que esta política bloquearía.
  if (!process.env.ELECTRON_RENDERER_URL) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' file: data: blob: https:; font-src 'self' data:; connect-src 'self'; media-src 'self' file: data: blob: https:; frame-src 'self' https:"
          ]
        }
      })
    })
  }

  mainWindow.webContents.on('context-menu', (event, params) => {
    event.preventDefault()

    const items: Electron.MenuItemConstructorOptions[] = []

    if (params.misspelledWord) {
      for (const suggestion of params.dictionarySuggestions.slice(0, 5)) {
        items.push({
          label: suggestion,
          click: () => {
            mainWindow?.webContents.send('spellcheck:replace-word', suggestion, params.misspelledWord)
          }
        })
      }

      if (params.dictionarySuggestions.length > 0) {
        items.push({ type: 'separator' })
      }

      items.push({
        label: 'Agregar al diccionario',
        click: () => {
          mainWindow?.webContents.send('spellcheck:add-word', params.misspelledWord)
          session.defaultSession.addWordToSpellCheckerDictionary(params.misspelledWord)
        }
      })

      items.push({
        label: 'Ignorar palabra',
        click: () => {
          session.defaultSession.addWordToSpellCheckerDictionary(params.misspelledWord)
        }
      })

      items.push({ type: 'separator' })
    }

    items.push({
      label: 'Cortar',
      role: 'cut',
      enabled: params.editFlags.canCut
    })
    items.push({
      label: 'Copiar',
      role: 'copy',
      enabled: params.editFlags.canCopy
    })
    items.push({
      label: 'Pegar',
      role: 'paste',
      enabled: params.editFlags.canPaste
    })
    items.push({ type: 'separator' })
    items.push({
      label: 'Seleccionar todo',
      role: 'selectAll',
      enabled: params.editFlags.canSelectAll
    })

    const menu = Menu.buildFromTemplate(items)
    menu.popup({ window: mainWindow ?? undefined })
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

autoUpdater.on('checking-for-update', () => send('update:status', 'checking'))
autoUpdater.on('update-available', (info) => send('update:status', 'available', { version: info.version }))
autoUpdater.on('update-not-available', () => send('update:status', 'not-available'))
autoUpdater.on('download-progress', (p) => send('update:status', 'downloading', { percent: p.percent }))
autoUpdater.on('update-downloaded', (info) => send('update:status', 'downloaded', { version: info.version }))
autoUpdater.on('error', () => { /* silent in dev */ })

ipcMain.handle('dialog:open', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    filters: [{ name: 'Markdown', extensions: ['md'] }],
    properties: ['openFile']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const content = await readFile(result.filePaths[0], 'utf-8')
  authorizePath(result.filePaths[0])
  return { filePath: result.filePaths[0], content }
})

ipcMain.handle('dialog:openCsv', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    filters: [{ name: 'CSV/TSV', extensions: ['csv', 'tsv', 'txt'] }],
    properties: ['openFile']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const content = await readFile(result.filePaths[0], 'utf-8')
  authorizePath(result.filePaths[0])
  return { filePath: result.filePaths[0], content }
})

ipcMain.handle('dialog:save', async (_event, { filePath, content }: { filePath?: string; content: string }) => {
  let path = filePath
  if (!path) {
    const result = await dialog.showSaveDialog(mainWindow!, {
      filters: [{ name: 'Markdown', extensions: ['md'] }],
      defaultPath: 'untitled.md'
    })
    if (result.canceled || !result.filePath) return null
    path = result.filePath
  }
  // Un fallo de escritura se devuelve como resultado (no se lanza) para que
  // el renderer pueda informarlo y no marcar el documento como guardado.
  try {
    assertFileAllowed(path)
    await writeFile(path, content, 'utf-8')
    authorizePath(path)
    return { ok: true, path }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Error al guardar el archivo' }
  }
})

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  setWorkspaceFolder(result.filePaths[0])
  authorizePath(result.filePaths[0])
  return result.filePaths[0]
})

async function listMdFiles(dir: string, baseDir: string): Promise<{ name: string; path: string }[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: { name: string; path: string }[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...await listMdFiles(fullPath, baseDir))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push({ name: fullPath.replace(baseDir + '\\', ''), path: fullPath })
    }
  }
  return files.sort((a, b) => a.name.localeCompare(b.name))
}

ipcMain.handle('folder:listFiles', async (_event, folderPath: string) => {
  if (!isValidPathInput(folderPath)) return []
  const files = await listMdFiles(folderPath, folderPath)
  for (const f of files) authorizePath(f.path)
  return files
})

ipcMain.handle('file:read', async (_event, filePath: string) => {
  if (!isValidPathInput(filePath)) throw new Error('Ruta de archivo no válida')
  const content = await readFile(filePath, 'utf-8')
  // Solo los .md se autorizan para operaciones destructivas posteriores;
  // acota la superficie de escalada lectura → borrado a archivos del dominio.
  if (isMarkdownPath(filePath)) authorizePath(filePath)
  return content
})

// Lee una imagen local y la devuelve como data URL para poder incrustarla en
// el editor. Resuelve rutas relativas contra el workspace abierto y rutas
// absolutas de Windows (C:/...) o file://. Devuelve null si no es imagen o
// no existe — el renderer muestra la imagen rota como en cualquier editor.
ipcMain.handle('file:readImage', async (_event, filePath: unknown) => {
  if (typeof filePath !== 'string' || !filePath.trim()) return null
  // Normaliza file:///C:/... y file://C:/... a C:/... (rutas absolutas Windows)
  let p = filePath.trim().replace(/^file:\/\/\/?/, '')
  if (!isAbsolute(p)) {
    const wf = getWorkspaceFolder()
    if (!wf) return null
    p = resolve(wf, p)
  }
  if (!/^[^\x00]+$/.test(p)) return null
  const ext = extname(p).toLowerCase()
  if (!['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'].includes(ext)) return null
  try {
    const data = await readFile(p)
    const mime = ext === '.svg' ? 'image/svg+xml' : `image/${ext.slice(1)}`
    return `data:${mime};base64,${data.toString('base64')}`
  } catch {
    return null
  }
})

ipcMain.handle('file:write', async (_event, filePath: string, content: string) => {
  try {
    assertFileAllowed(filePath)
    await writeFile(filePath, content, 'utf-8')
    authorizePath(filePath)
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Error al guardar el archivo' }
  }
})

ipcMain.handle('update:startDownload', () => { autoUpdater.downloadUpdate() })
ipcMain.handle('update:install', () => { autoUpdater.quitAndInstall() })

ipcMain.handle('window:toggleFullscreen', () => {
  if (!mainWindow) return
  mainWindow.setFullScreen(!mainWindow.isFullScreen())
})

ipcMain.handle('file:createFolder', async (_event, parentPath: string, name: string) => {
  assertFileAllowed(parentPath)
  if (!isSafeName(name)) throw new Error('Nombre de carpeta no válido')
  await mkdir(join(parentPath, name), { recursive: true })
  authorizePath(join(parentPath, name))
})

ipcMain.handle('file:rename', async (_event, oldPath: string, newPath: string) => {
  if (!isMoveAllowed(oldPath, newPath)) throw new Error('Acceso denegado')
  if (!isSafeName(basename(newPath))) throw new Error('Nombre de archivo no válido')
  await rename(oldPath, newPath)
  authorizePath(newPath)
})

ipcMain.handle('file:duplicate', async (_event, filePath: string) => {
  assertFileAllowed(filePath)
  const ext = extname(filePath)
  const base = filePath.slice(0, -ext.length)
  let newPath = `${base} (copia)${ext}`
  for (let counter = 1; counter <= 100; counter++) {
    try {
      // COPYFILE_EXCL: falla con EEXIST si el destino ya existe (no sobrescribe).
      await copyFile(filePath, newPath, fsConstants.COPYFILE_EXCL)
      authorizePath(newPath)
      return newPath
    } catch (err: any) {
      // Solo "ya existe" es esperado: se prueba el siguiente nombre.
      // Cualquier otro error (ENOENT, EACCES, EPERM...) se propaga y termina.
      if (err?.code === 'EEXIST') {
        newPath = `${base} (copia ${counter + 1})${ext}`
        continue
      }
      throw err
    }
  }
  throw new Error('No se pudo generar un nombre único para la copia')
})

ipcMain.handle('file:delete', async (_event, filePath: string) => {
  assertFileAllowed(filePath)
  await unlink(filePath)
})

ipcMain.handle('file:move', async (_event, oldPath: string, newPath: string) => {
  if (!isMoveAllowed(oldPath, newPath)) throw new Error('Acceso denegado')
  if (!isSafeName(basename(newPath))) throw new Error('Nombre de archivo no válido')
  await rename(oldPath, newPath)
  authorizePath(newPath)
})

ipcMain.handle('app:quit', () => {
  app.quit()
})

ipcMain.handle('app:getStartupFile', () => {
  const filePath = startupFilePath
  startupFilePath = null
  return filePath
})

ipcMain.handle('spellcheck:addWord', (_event, word: string) => {
  session.defaultSession.addWordToSpellCheckerDictionary(word)
})

ipcMain.handle('spellcheck:removeWord', (_event, word: string) => {
  session.defaultSession.removeWordFromSpellCheckerDictionary(word)
})

ipcMain.handle('spellcheck:addWords', (_event, words: string[]) => {
  for (const word of words) {
    session.defaultSession.addWordToSpellCheckerDictionary(word)
  }
})

// Autoriza al inicio las rutas .md que el usuario ya conoce (favoritos,
// recientes, papelera) para no romper eliminar/renombrar sin abrir el archivo.
// No amplía la superficie de ataque: un renderer comprometido ya puede
// autorizar cualquier .md existente leyéndolo (file:read autoriza .md).
ipcMain.handle('paths:seed', (_event, paths: unknown) => {
  if (!Array.isArray(paths)) return
  for (const p of paths) {
    if (typeof p === 'string' && isValidPathInput(p) && isMarkdownPath(p)) {
      authorizePath(p)
    }
  }
})

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const mdFile = argv.find(a => /\.md$/i.test(a))
    if (mdFile && mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      dispatchOpenFile(mdFile)
    }
  })
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()

  const pendingFile = process.argv.find(a => /\.md$/i.test(a))
  if (pendingFile) {
    dispatchOpenFile(pendingFile)
  }

  try { autoUpdater.checkForUpdates() } catch { /* silent */ }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('open-file', (_event, filePath) => {
  dispatchOpenFile(filePath)
})
