/// <reference types="vite/client" />

interface FileAPI {
  openFile: () => Promise<{ filePath: string; content: string } | null>
  saveFile: (filePath?: string, content?: string) => Promise<string | null>
  openFolder: () => Promise<string | null>
  listFiles: (folderPath: string) => Promise<{ name: string; path: string }[]>
  readFile: (filePath: string) => Promise<string>
  writeFile: (filePath: string, content: string) => Promise<void>
  checkUpdate: () => Promise<{ tag: string; url: string } | null>
  openUpdateUrl: (url: string) => Promise<void>
}

declare global {
  interface Window {
    api: FileAPI
    katex: typeof import('katex')
    mermaid: typeof import('mermaid')
  }
}

export {}
