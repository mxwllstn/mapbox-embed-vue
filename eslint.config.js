import antfu from '@antfu/eslint-config'

export default antfu({
}, {
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
  },
})
