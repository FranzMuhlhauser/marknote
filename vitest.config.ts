import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // markdown.ts usa DOMPurify, que necesita un DOM real para sanitizar.
    environment: 'jsdom',
    include: ['src/**/*.test.ts']
  }
})
