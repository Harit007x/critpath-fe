import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // affectUI's components, kept as published so they can be replaced with newer copies (agent/affect)
  globalIgnores(['dist', 'src/components/agent/affect']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // shadcn/ui primitives and the context providers built on them intentionally
    // export variants, hooks and constants alongside their components. That is
    // upstream's file layout, so fast-refresh granularity is traded away here.
    files: [
      'src/components/ui/**/*.{ts,tsx}',
      'src/components/data-table/**/*.{ts,tsx}',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
