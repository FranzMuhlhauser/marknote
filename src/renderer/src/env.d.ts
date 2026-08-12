/// <reference types="vite/client" />

interface SaveResult {
  ok: boolean
  path?: string
  error?: string
}

interface FileAPI {
  openFile: () => Promise<{ filePath: string; content: string } | null>
  openCsvFile: () => Promise<{ filePath: string; content: string } | null>
  saveFile: (filePath?: string, content?: string) => Promise<SaveResult | null>
  openFolder: () => Promise<string | null>
  listFiles: (folderPath: string) => Promise<{ name: string; path: string }[]>
  readFile: (filePath: string) => Promise<string>
  readImage: (filePath: string) => Promise<string | null>
  writeFile: (filePath: string, content: string) => Promise<SaveResult>
  onUpdateStatus: (callback: (status: string, payload?: any) => void) => void
  startDownloadUpdate: () => Promise<void>
  installUpdate: () => Promise<void>
  toggleFullscreen: () => Promise<void>
  quit: () => Promise<void>
  createFolder: (parentPath: string, name: string) => Promise<void>
  rename: (oldPath: string, newPath: string) => Promise<void>
  duplicate: (filePath: string) => Promise<string>
  deleteFile: (filePath: string) => Promise<void>
  moveFile: (oldPath: string, newPath: string) => Promise<void>
  getStartupFile: () => Promise<string | null>
  seedPaths: (paths: string[]) => Promise<void>
  addCustomWord: (word: string) => Promise<void>
  removeCustomWord: (word: string) => Promise<void>
  addCustomWords: (words: string[]) => Promise<void>
  onSpellcheckReplaceWord: (callback: (replacement: string, word: string) => void) => void
  onSpellcheckAddWord: (callback: (word: string) => void) => void
}

declare global {
  interface Window {
    api: FileAPI
    katex: typeof import('katex')
    mermaid: typeof import('mermaid')
  }
}

export {}
