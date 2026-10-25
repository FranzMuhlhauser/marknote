import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  {
    ignores: ['out/**', 'dist-electron/**', 'node_modules/**', '**/*.d.ts']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // TipTap/ProseMirror tipa los contextos de extensión con `any`
      // (this.options, addAttributes, NodeView props); exigir tipos precisos
      // ahí obligaría a duplicar las definiciones internas de la librería.
      '@typescript-eslint/no-explicit-any': 'off',
      // Los catch sin variable son intencionales en varios handlers IPC.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }]
    }
  }
)
