import type { SourceCodeTransformer } from '@unocss/core'
import transformerHover from '@unocss-applet/transformer-hover'
import { createGenerator } from '@unocss/core'
import { presetWind3 } from '@unocss/preset-wind3'
import MagicString from 'magic-string'
import { describe, expect, it } from 'vitest'

// `id` 是必填的——transformer 按 `.vue` 还是 `.jsx`/`.tsx` 分流，选对应的原生属性名
// （Vue 用 `hover-class`，JSX 用 `hoverClass`）。给个默认值会让 JSX 用例悄悄走 Vue 的路径。
async function transform(code: string, transformer: SourceCodeTransformer, id: string) {
  const s = new MagicString(code)

  const uno = await createGenerator({
    presets: [presetWind3()],
    transformers: [transformer],
  })
  await transformer.transform(s, id, { uno, tokens: new Set() } as any)
  return s.toString()
}

describe('transformer-hover (vue)', () => {
  it('issue #19 example 1: moves hover: utilities from class to hover-class', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:bg-red hover:text-xl"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div hover-class="bg-red text-xl"/>')
  })

  it('issue #19 example 2: merges with an existing static hover-class', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:bg-red" hover-class="text-xl"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div hover-class="text-xl bg-red"/>')
  })

  it('issue #19 example 3: wraps an existing dynamic :hover-class in a template literal', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:bg-red" :hover-class="bool ? \'text-xl\' : \'text-sm\'"/>',
      transformer,
      'foo.vue',
    )
    // eslint-disable-next-line no-template-curly-in-string -- literal expected output
    expect(result).toBe('<div :hover-class="`${bool ? \'text-xl\' : \'text-sm\'} bg-red`"/>')
  })

  it('preserves non-hover utilities in class', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="p-2 hover:bg-red text-white"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div class="p-2 text-white" hover-class="bg-red"/>')
  })

  it('leaves stacked variants (dark:hover:) in class untouched', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="dark:hover:bg-red hover:text-xl"/>',
      transformer,
      'foo.vue',
    )
    // dark:hover: 留在原地；只有独立的 hover: 才会被搬走。
    expect(result).toBe('<div class="dark:hover:bg-red" hover-class="text-xl"/>')
  })

  it('skips non-utility hover: tokens (leaves them in class)', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:notarealutility hover:bg-red"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div class="hover:notarealutility" hover-class="bg-red"/>')
  })

  it('does not emit hover-class when there is nothing to move', async () => {
    const transformer = transformerHover()
    const result = await transform('<div class="p-2 text-white"/>', transformer, 'foo.vue')
    expect(result).toBe('<div class="p-2 text-white"/>')
  })

  it('does not process dynamic :class bindings', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div :class="x ? \'hover:bg-red\' : \'\'"/>',
      transformer,
      'foo.vue',
    )
    // 动态 class 表达式没法静态解析，原样保留（文档里写明的局限）。
    expect(result).toBe('<div :class="x ? \'hover:bg-red\' : \'\'"/>')
  })

  it('removes the class attribute entirely when it becomes empty', async () => {
    const transformer = transformerHover()
    const result = await transform('<div class="hover:bg-red"/>', transformer, 'foo.vue')
    expect(result).toBe('<div hover-class="bg-red"/>')
  })

  // 回归：空文件不能崩（MagicString 拒绝零长度 overwrite）。
  it('handles an empty file without throwing', async () => {
    const transformer = transformerHover()
    const result = await transform('', transformer, 'foo.vue')
    expect(result).toBe('')
  })

  // 回归：没有可处理元素的文件原样保留（不做多余的 overwrite）。
  it('leaves a file with no hover: utilities unchanged', async () => {
    const transformer = transformerHover()
    const result = await transform('<div class="p-2">hello</div>', transformer, 'foo.vue')
    expect(result).toBe('<div class="p-2">hello</div>')
  })

  // 回归：Vue 动态绑定的表达式里若包含另一种引号，要保留原始引号字符，
  // 包一层模板字符串时才不会和它撞车、弄坏标记。
  it('preserves the original quote of a dynamic :hover-class binding', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:bg-red" :hover-class=\'cond ? "a" : "b"\'/>',
      transformer,
      'foo.vue',
    )
    // eslint-disable-next-line no-template-curly-in-string -- literal expected output
    expect(result).toBe('<div :hover-class=\'`${cond ? "a" : "b"} bg-red`\'/>')
  })

  // 回归：无值的 `hover-class` 简写要改写成带值的形式，而不是重复一份。
  it('rewrites a value-less hover-class shorthand instead of duplicating it', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:bg-red" hover-class/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div hover-class="bg-red"/>')
  })

  // 回归：标签名和第一个属性之间是 tab 或换行时不能把源码弄坏
  // （偏移用 `search(/\s/)` 算，不是 `indexOf(' ')`）。
  it('handles a tab between tag name and first attribute', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div\tclass="hover:bg-red"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div hover-class="bg-red"/>')
  })

  it('handles a newline between tag name and first attribute', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div\nclass="hover:bg-red"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div hover-class="bg-red"/>')
  })

  // 回归：搬移 token 时开头的 `!` important 修饰符要保留——在别名里体现为 `_a_`
  // （`!` 属于不支持字符，与 postprocess 的选择器别名化同一套规则，CSS 侧生成 `._a_bg-red`）
  it('preserves a leading important modifier (!hover:bg-red)', async () => {
    const transformer = transformerHover()
    const result = await transform('<div class="!hover:bg-red"/>', transformer, 'foo.vue')
    expect(result).toBe('<div hover-class="_a_bg-red"/>')
  })

  // 基本校验：arbitrary value 里的 `:` 在 `[...]` 内部（不是变体分隔符）时，token 照常搬移；
  // 别名化后与 postprocess 的选择器形式一致（`bg-[url(http://x.png)]` → `bg-_a_url_a_...`）
  it('moves arbitrary-value hover: bodies (colon inside [...])', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:bg-[url(http://x.png)]"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div hover-class="bg-_a_url_a_http_a__a__a_x_a_png_a__a_"/>')
  })

  // 回归：`hover:` 后面跟伪类/伪元素/peer 变体时不搬——`hover-class` 表达不了
  // focus/active/peer 的条件，搬过去修饰符就丢了。这些会编译成单个复合选择器（没有空白、
  // 没有 `@media`），按选择器形状判断会漏掉；靠「顶层冒号」启发式才能识别。
  it.each([
    'hover:focus:bg-red',
    'hover:active:bg-red',
    'hover:disabled:bg-red',
    'hover:checked:bg-red',
    'hover:first:bg-red',
    'hover:before:bg-red',
    'hover:peer-focus:bg-red',
    'hover:hover:bg-red',
    'hover:dark:bg-red',
    'hover:md:bg-red',
  ])('leaves %s in class (variant qualifier not expressible in hover-class)', async (tok) => {
    const transformer = transformerHover()
    const result = await transform(
      `<div class="${tok}"/>`,
      transformer,
      'foo.vue',
    )
    expect(result).toBe(`<div class="${tok}"/>`)
  })

  // 回归：多个 `class` 属性（畸形但能容忍）——每个 class 属性里的 `hover:` token 都要
  // 清掉，不能只处理最后一个。不按位置逐个编辑的话，前面的 class 属性会留下搬走 token
  // 的旧副本。这个用例里两个 class 属性都被清空、整体删除。
  it('strips hover: tokens from all class attributes when multiple exist', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="hover:bg-red" class="hover:text-xl"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div hover-class="bg-red text-xl"/>')
  })

  it('strips hover: tokens from multiple class attrs with mixed content', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div class="p-2 hover:bg-red" class="m-4 hover:text-xl"/>',
      transformer,
      'foo.vue',
    )
    expect(result).toBe('<div class="p-2" class="m-4" hover-class="bg-red text-xl"/>')
  })

  // 回归：双重 important（`!hover:!bg-red`）是非法写法；transformer 必须原样保留，
  // 而不是换成一个同样非法的 token（`!!bg-red`）。
  it('leaves an invalid doubly-important !hover:!bg-red token in place', async () => {
    const transformer = transformerHover()
    const result = await transform('<div class="!hover:!bg-red"/>', transformer, 'foo.vue')
    expect(result).toBe('<div class="!hover:!bg-red"/>')
  })
})

describe('transformer-hover (jsx)', () => {
  it('uses hoverClass and className on JSX, moves hover: utilities', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div className="hover:bg-red hover:text-xl"/>',
      transformer,
      'foo.tsx',
    )
    expect(result).toBe('<div hoverClass="bg-red text-xl"/>')
  })

  it('merges with an existing static hoverClass', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div className="hover:bg-red" hoverClass="text-xl"/>',
      transformer,
      'foo.tsx',
    )
    expect(result).toBe('<div hoverClass="text-xl bg-red"/>')
  })

  it('wraps an existing dynamic hoverClass={expr} in a template literal', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div className="hover:bg-red" hoverClass={cond ? \'text-xl\' : \'text-sm\'}/>',
      transformer,
      'foo.tsx',
    )
    // eslint-disable-next-line no-template-curly-in-string -- literal expected output
    expect(result).toBe('<div hoverClass={`${cond ? \'text-xl\' : \'text-sm\'} bg-red`}/>')
  })

  it('preserves non-hover utilities in className', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div className="p-2 hover:bg-red"/>',
      transformer,
      'foo.tsx',
    )
    expect(result).toBe('<div className="p-2" hoverClass="bg-red"/>')
  })

  it('does not process dynamic className={expr} bindings', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div className={x ? \'hover:bg-red\' : \'\'}/>',
      transformer,
      'foo.tsx',
    )
    expect(result).toBe('<div className={x ? \'hover:bg-red\' : \'\'}/>')
  })

  // 回归：无值的 hoverClass 简写改写成带值的形式。
  it('rewrites a value-less hoverClass shorthand instead of duplicating it', async () => {
    const transformer = transformerHover()
    const result = await transform(
      '<div className="hover:bg-red" hoverClass/>',
      transformer,
      'foo.tsx',
    )
    expect(result).toBe('<div hoverClass="bg-red"/>')
  })
})

describe('transformer-hover: alias closed loop with presetApplet postprocess', () => {
  // hover-class 的值是运行时类名，而 postprocess 生成的 CSS 选择器是别名化形式。
  // 搬移的 token 必须也别名化，两侧才能对上（按压态样式静默失效的回归防护）。
  // 注意本文件的上文 transform() 用的是 presetWind3（不带 applet postprocess），
  // 所以这里直接用 presetApplet 走完整管线断言源码与 CSS 一致
  it('hover-class alias matches generated CSS selector', async () => {
    const { presetApplet } = await import('@unocss-applet/preset-applet')
    const uno = await createGenerator({ presets: [presetApplet()], transformers: [transformerHover()] })
    const s = new MagicString('<div class="hover:bg-red/50"/>')
    for (const t of uno.config.transformers ?? [])
      await t.transform(s, 'foo.vue', { uno, tokens: new Set() } as any)
    expect(s.toString()).toBe('<div hover-class="bg-red_a_50"/>')
    const { css } = await uno.generate(s.toString(), { preflights: false })
    expect(css).toContain('.bg-red_a_50{')
  })
})
