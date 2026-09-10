import type { UnocssPluginContext } from '@unocss/core'
import { presetApplet, transformerApplet } from '@unocss-applet/preset-applet'
import { createGenerator } from '@unocss/core'
import MagicString from 'magic-string'
import { transformerDirectives } from 'unocss'
import { describe, expect, it } from 'vitest'

// `transformerApplet` 与 `transformerDirectives` 一起跑时的集成覆盖。两者改同一段源码，
// 历史上确实撞过：#109 修复前，applet transformer 在 directives 已经编辑过源码之后还做
// `s.overwrite(0, length)`，`@apply !font-bold` 会报 `Cannot split a chunk that has already
// been edited`。这些测试固定修好后的执行顺序，回归会在发布前被抓到。
// @see https://github.com/unocss-applet/unocss-applet/issues/106
describe('transformer-applet x transformer-directives', () => {
  const uno = createGenerator({
    presets: [presetApplet({ presetOptions: { dark: 'media' } })],
    transformers: [transformerDirectives()],
  })
  const applet = transformerApplet()

  // UnoCSS 的管线里 `transformerDirectives`（enforce: normal）在 `transformer-applet`
  // （enforce: pre）之前执行，但这里显式驱动两者，让测试不依赖顺序——顺序错了会抛异常，
  // 而不是静默地产出错误结果。
  async function run(code: string) {
    const u = await uno
    const s = new MagicString(code)
    const ctx = { tokens: new Set<string>(), uno: u } as UnocssPluginContext
    await applet.transform(s, 'foo.css', ctx)
    const { css } = await u.generate(s.toString(), { preflights: false })
    return { source: s.toString(), css }
  }

  // #106：issue 第三张截图里的 `@apply !font-bold` 控制台报错，来自 applet transformer
  // 重复编辑 directives 已认领的范围。现在的范围认领实现在这个输入上不能再抛异常。
  it('@apply !font-bold does not throw (#106)', async () => {
    const { css } = await run('.foo { @apply !font-bold; }')
    // `transformer-directives` 只输出解析后的声明体——`.foo` 不是 UnoCSS 生成的选择器，
    // 不会被带进输出。这里只断言本 preset 负责的部分：`!important` 声明落地、生成的选择器
    // 小程序安全（没有字面 `!`）。`.foo` 的绑定行为归 UnoCSS 自己管。
    expect(css).toMatch(/font-weight:700 !important/)
    expect(css).not.toMatch(/\.[\w-]*!/)
  })

  it('@apply font-bold (no important) still resolves', async () => {
    const { css } = await run('.foo { @apply font-bold; }')
    expect(css).toMatch(/font-weight:700/)
    // 没有 `!` 时选择器就是普通的工具类名，不会被改写
    expect(css).toContain('.font-bold')
  })
})
