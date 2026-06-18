import { contextBridge, ipcRenderer } from 'electron'

const api = {
  openFile: () => ipcRenderer.invoke('dialog:open'),
  saveFile: (filePath?: string, content?: string) => ipcRenderer.invoke('dialog:save', { filePath, content }),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content)
}

contextBridge.exposeInMainWorld('api', api)
