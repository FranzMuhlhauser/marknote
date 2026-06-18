/// <reference types="vite/client" />

interface FileAPI {
  openFile: () => Promise<{ filePath: string; content: string } | null>
  saveFile: (filePath?: string, content?: string) => Promise<string | null>
  readFile: (filePath: string) => Promise<string>
  writeFile: (filePath: string, content: string) => Promise<void>
}

declare global {
  interface Window {
    api: FileAPI
    katex: typeof import('katex')
    mermaid: typeof import('mermaid')
  }
}

export {}
