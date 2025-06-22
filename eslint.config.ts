import type { TypedFlatConfigItem } from '@antfu/eslint-config'
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    typescript: true,
    formatters: {
      css: true,
    },
  },
  {
    rules: {
      'node/prefer-global/process': 'off',
      'no-console': 'off',
      'ts/no-use-before-define': 'off',
      'unused-imports/no-unused-vars': ['error', {
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      }],
      'vue/block-order': ['error', {
        order: [['script', 'template'], 'style'],
      }],
      'curly': ['error', 'all'],
      'style/brace-style': ['error', '1tbs', { allowSingleLine: false }],
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
) as TypedFlatConfigItem
