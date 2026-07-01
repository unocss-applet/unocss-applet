import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  unocss: true,
}, {
  files: ['pnpm-workspace.yaml'],
  rules: {
    'pnpm/yaml-enforce-settings': 'off',
    // taro3/taro4 catalogs intentionally pin different Taro majors for the two examples
    'pnpm/yaml-no-duplicate-catalog-item': 'off',
  },
})
