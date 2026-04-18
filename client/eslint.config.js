import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        process: 'readonly',
        __dirname: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
    },
    rules: {
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['warn', {
        vars: 'all',
        args: 'none',
        ignoreRestSiblings: true,
        caughtErrors: 'none',
        varsIgnorePattern: '^(React|use[A-Z].*|is[A-Z].*|set[A-Z].*|handle[A-Z].*|[A-Z].*|t|api|user|settings|navigate|components)$',
      }],
      'no-dupe-keys': 'error',
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      'react-refresh/only-export-components': ['warn', {
        allowExportNames: ['useAuth', 'useConfig', 'useLanguage', 'useMessage', 'useModal'],
      }],
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
])
