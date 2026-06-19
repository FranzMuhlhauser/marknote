import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron'
import { join, dirname, basename, extname } from 'path'
import { readFile, writeFile, readdir, mkdir, rename, copyFile, unlink } from 'fs/promises'
import { autoUpdater } from 'electron-updater'

let mainWindow: BrowserWindow | null = null

function send(channel: string, ...args: any[]) {
  mainWindow?.webContents.send(channel, ...args)
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
      sandbox: false
    }
  })

  mainWindow.webContents.on('console-message', (_event, level, message) => {
    const tag = ['verbose', 'info', 'warn', 'error'][level] || 'log'
    console.log(`[renderer:${tag}] ${message}`)
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
  return { filePath: result.filePaths[0], content }
})

ipcMain.handle('dialog:save', async (_event, { filePath, content }: { filePath?: string; content: string }) => {
  const path = filePath ?? (await dialog.showSaveDialog(mainWindow!, {
    filters: [{ name: 'Markdown', extensions: ['md'] }],
    defaultPath: 'untitled.md'
  })).filePath
  if (!path) return null
  await writeFile(path, content, 'utf-8')
  return path
})

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null
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
  return await listMdFiles(folderPath, folderPath)
})

ipcMain.handle('file:read', async (_event, filePath: string) => {
  return await readFile(filePath, 'utf-8')
})

ipcMain.handle('file:write', async (_event, filePath: string, content: string) => {
  await writeFile(filePath, content, 'utf-8')
})

ipcMain.handle('update:startDownload', () => { autoUpdater.downloadUpdate() })
ipcMain.handle('update:install', () => { autoUpdater.quitAndInstall() })

ipcMain.handle('window:toggleFullscreen', () => {
  if (!mainWindow) return
  mainWindow.setFullScreen(!mainWindow.isFullScreen())
})

ipcMain.handle('file:createFolder', async (_event, parentPath: string, name: string) => {
  await mkdir(join(parentPath, name), { recursive: true })
})

ipcMain.handle('file:rename', async (_event, oldPath: string, newPath: string) => {
  await rename(oldPath, newPath)
})

ipcMain.handle('file:duplicate', async (_event, filePath: string) => {
  const ext = extname(filePath)
  const base = filePath.slice(0, -ext.length)
  let newPath = `${base} (copia)${ext}`
  let counter = 1
  while (true) {
    try {
      await copyFile(filePath, newPath)
      return newPath
    } catch {
      counter++
      newPath = `${base} (copia ${counter})${ext}`
    }
  }
})

ipcMain.handle('file:delete', async (_event, filePath: string) => {
  await unlink(filePath)
})

ipcMain.handle('file:move', async (_event, oldPath: string, newPath: string) => {
  await rename(oldPath, newPath)
})

ipcMain.handle('app:quit', () => {
  app.quit()
})

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  console.warn('Another instance is running, forwarding arguments...')
} else {
  app.on('second-instance', (_event, argv) => {
    const mdFile = argv.find(a => /\.md$/i.test(a))
    if (mdFile && mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      send('file:open', mdFile)
    }
  })
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()

  const pendingFile = process.argv.find(a => /\.md$/i.test(a))
  if (pendingFile && mainWindow) {
    mainWindow.webContents.on('did-finish-load', () => {
      send('file:open', pendingFile)
    })
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
  send('file:open', filePath)
})
