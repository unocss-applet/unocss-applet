# packages/transformer-hover

把 `hover:` 工具类从 `class` 搬到小程序原生的 `hover-class` / `hoverClass` 属性。小程序不支持 `:hover` 伪类，留在 `class` 里的 `hover:` 生成的样式会被静默丢掉。

## 要点

- 只搬**无其他变体限定**的 `hover:`：`hover:bg-red`、`!hover:bg-red`、`hover:bg-[url(http://x)]` 会搬；`dark:hover:`、`hover:dark:`、`hover:focus:`、`hover:peer-focus:` 不搬，因为 `hover-class` 表达不了这些条件。判定方式是看 `[...]` 之外有没有顶层 `:`。
- `hover-class` 只接受字符串，输出永远是单个空格拼接的字符串，不是数组。不输出空值：`hover-class="none"` 是关闭按压效果的保留值，输出空串有和框架默认值撞车的风险。
- 搬出去的 token 会重新走别名化并注册 shortcut，让运行时类名和生成的 CSS 选择器一致。不别名化时 `hover:bg-red/50` 搬出去是 `bg-red/50`，CSS 侧是 `.bg-red_a_50`，引用不到。
- 只在**小程序端**启用。H5 端 `:hover` 原生可用，启用反而失效，`examples/*/uno.config.ts` 里用 if/else 分支控制。
- 属性名默认值随文件类型变：Vue 用 `hover-class` / `class`，JSX 用 `hoverClass` / `className`，见 `src/types.ts`。

## 测试

```bash
cd ../.. && pnpm vitest run test/transformer-hover.test.ts
```

测试固定了搬移条件和「不搬」的清单。改判定逻辑时两边的用例都要看，只测「搬成功」会漏掉误搬。
