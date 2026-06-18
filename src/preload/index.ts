import { contextBridge, ipcRenderer } from 'electron'

const api = {
  openFile: () => ipcRenderer.invoke('dialog:open'),
  saveFile: (filePath?: string, content?: string) => ipcRenderer.invoke('dialog:save', { filePath, content }),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  listFiles: (folderPath: string) => ipcRenderer.invoke('folder:listFiles', folderPath),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content),
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  openUpdateUrl: (url: string) => ipcRenderer.invoke('update:open', url)
}

contextBridge.exposeInMainWorld('api', api)
