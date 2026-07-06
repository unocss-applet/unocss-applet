import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  unocss: true,
  // test/fixtures are transformer input/output text samples, not compilable app code —
  // they intentionally contain attributify pseudo-attributes (e.g. `text="red"`) that are
  // invalid as real JSX/HTML. Excluded from lint (and tsconfig exclude) for the same reason.
  ignores: ['**node_modules/**', '**/dist/**', 'examples/**', 'test/fixtures/**'],
}, {
  files: ['pnpm-workspace.yaml'],
  rules: {
    'pnpm/yaml-enforce-settings': 'off',
    // taro3/taro4 catalogs intentionally pin different Taro majors for the two examples
    'pnpm/yaml-no-duplicate-catalog-item': 'off',
  },
})
