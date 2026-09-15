import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import storybook from 'eslint-plugin-storybook'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['.*'],
              message: 'Relative imports are not allowed. Use the "@/" (src) or "@doc/" (doc) alias instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['.*', '@/app/*', '@/infra/*'],
              message: 'domain must not depend on app or infra. Keep domain free of framework and I/O concerns.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/infra/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['.*', '@/app/*'],
              message: 'infra must not depend on app. infra may depend on domain.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['.*', '@/infra/*'],
              message: 'app must not depend on infra directly. Depend on domain abstractions instead; infra implementations are wired in at the composition root (App.tsx).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/comp/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['.*', '@/infra/*', '@/app/*', '@/domain/*'],
              message: 'comp must not depend on domain, app or infra.',
            },
          ],
        },
      ],
    },
  },
  ...storybook.configs['flat/recommended'],
])
