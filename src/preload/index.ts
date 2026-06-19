import { contextBridge, ipcRenderer } from 'electron'

const api = {
  openFile: () => ipcRenderer.invoke('dialog:open'),
  saveFile: (filePath?: string, content?: string) => ipcRenderer.invoke('dialog:save', { filePath, content }),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  listFiles: (folderPath: string) => ipcRenderer.invoke('folder:listFiles', folderPath),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content),
  onUpdateStatus: (callback: (status: string, payload?: any) => void) => {
    ipcRenderer.on('update:status', (_event, status, payload) => callback(status, payload))
  },
  startDownloadUpdate: () => ipcRenderer.invoke('update:startDownload'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  quit: () => ipcRenderer.invoke('app:quit'),
  createFolder: (parentPath: string, name: string) => ipcRenderer.invoke('file:createFolder', parentPath, name),
  rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('file:rename', oldPath, newPath),
  duplicate: (filePath: string) => ipcRenderer.invoke('file:duplicate', filePath),
  deleteFile: (filePath: string) => ipcRenderer.invoke('file:delete', filePath),
  moveFile: (oldPath: string, newPath: string) => ipcRenderer.invoke('file:move', oldPath, newPath)
}

contextBridge.exposeInMainWorld('api', api)
