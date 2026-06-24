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
  moveFile: (oldPath: string, newPath: string) => ipcRenderer.invoke('file:move', oldPath, newPath),
  onOpenFile: (callback: (filePath: string) => void) => {
    ipcRenderer.on('file:open', (_event, filePath) => callback(filePath))
  },
  getStartupFile: () => ipcRenderer.invoke('app:getStartupFile'),
  addCustomWord: (word: string) => ipcRenderer.invoke('spellcheck:addWord', word),
  removeCustomWord: (word: string) => ipcRenderer.invoke('spellcheck:removeWord', word),
  addCustomWords: (words: string[]) => ipcRenderer.invoke('spellcheck:addWords', words),
  onSpellcheckReplaceWord: (callback: (replacement: string, word: string) => void) => {
    ipcRenderer.on('spellcheck:replace-word', (_event, replacement, word) => callback(replacement, word))
  },
  onSpellcheckAddWord: (callback: (word: string) => void) => {
    ipcRenderer.on('spellcheck:add-word', (_event, word) => callback(word))
  }
}

contextBridge.exposeInMainWorld('api', api)
