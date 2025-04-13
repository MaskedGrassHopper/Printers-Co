import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({
  baseDirectory: __dirname,
})

export default [
  js.configs.recommended,
  ...compat.config({
    extends: [
      'next/core-web-vitals',
      'plugin:@typescript-eslint/recommended',
    ],
    plugins: ['@typescript-eslint'],
    rules: {
      // Performance-focused rules
      'react/no-unused-prop-types': 'error',
      'react/no-array-index-key': 'error',
      'react/jsx-no-bind': ['error', {
        allowArrowFunctions: true,
        allowFunctions: false,
        allowBind: false,
      }],
      // Prevent unnecessary re-renders
      'react/jsx-no-constructed-context-values': 'error',
      // Enforce proper code splitting
      'import/no-cycle': 'error',
      // Enforce proper async/await usage
      '@typescript-eslint/no-floating-promises': 'error',
      // Prevent memory leaks
      'react-hooks/exhaustive-deps': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  }),
]
