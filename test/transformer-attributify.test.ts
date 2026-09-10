import type { SourceCodeTransformer } from '@unocss/core'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import transformerAttributify from '@unocss-applet/transformer-attributify'
import { createGenerator } from '@unocss/core'
import { presetAttributify } from '@unocss/preset-attributify'
import { presetIcons } from '@unocss/preset-icons'
import { presetWind3 } from '@unocss/preset-wind3'
import MagicString from 'magic-string'
import { describe, expect, it } from 'vitest'

// `id` 是必填的——transformer 按 `.vue` 还是 `.jsx`/`.tsx` 分流，给个默认值会让 JSX
// 用例悄悄走 Vue 的路径（或反过来）。强制调用方传，测试意图更明确。
async function transform(code: string, transformer: SourceCodeTransformer, id: string) {
  const s = new MagicString(code)

  const uno = await createGenerator({
    presets: [
      presetWind3(),
      presetIcons({
        scale: 1.2,
        cdn: 'https://esm.sh/',
      }),
      presetAttributify(),
    ],
    transformers: [
      transformer,
    ],
  })
  await transformer.transform(s, id, { uno, tokens: new Set() } as any)
  return s.toString()
}

describe('transformer-attributify: tag-attribute separator', () => {
  // `<view` 与第一个属性之间是换行/制表符时，segOffset 必须按第一个空白定位；
  // 旧实现 `indexOf(' ')` 会返回 -1，所有下标错位到标签名上把标签改坏（与 hover 修复同源）
  it('newline between tag and first attribute does not corrupt the tag', async () => {
    const code = `<view\n  m-2 />`
    const result = await transform(code, transformerAttributify(), 'x.vue')
    expect(result).toContain('view')
    expect(result).toContain('m-2')
  })

  it('tab between tag and first attribute works', async () => {
    const code = `<view\tm-2 />`
    const result = await transform(code, transformerAttributify(), 'x.vue')
    expect(result).toContain('view')
    expect(result).toContain('m-2')
  })
})

describe('transformer-attributify', async () => {
  const content = await fs.readFile(
    path.resolve(__dirname, './fixtures/attributify.vue'),
  )

  it('basic', async () => {
    const transformer = transformerAttributify({ ignoreAttributes: ['block'] })
    const result = await transform(content.toString(), transformer, 'foo.vue')
    await expect(result).toMatchFileSnapshot('./fixtures/output/attributify.vue')
  })

  it('prefixed-only', async () => {
    const transformer = transformerAttributify({ prefixedOnly: true })
    const result = await transform(content.toString(), transformer, 'foo.vue')
    await expect(result).toMatchFileSnapshot('./fixtures/output/attributify-prefixed-only.vue')
  })
})

describe('transformer-attributify (jsx)', async () => {
  const content = await fs.readFile(
    path.resolve(__dirname, './fixtures/attributify.tsx'),
  )

  it('basic', async () => {
    const transformer = transformerAttributify({ ignoreAttributes: ['block'] })
    const result = await transform(content.toString(), transformer, 'foo.tsx')
    await expect(result).toMatchFileSnapshot('./fixtures/output/attributify.tsx')
  })

  it('prefixed-only', async () => {
    const transformer = transformerAttributify({ prefixedOnly: true })
    const result = await transform(content.toString(), transformer, 'foo.tsx')
    await expect(result).toMatchFileSnapshot('./fixtures/output/attributify-prefixed-only.tsx')
  })

  // 用户内容里的 `$`（className 表达式和静态 class 值）必须原样到达输出。
  // `String.prototype.replace(search, replacement)` 会解释 replacement 里的 `$$`/`$&`/`$1`/
  // `$<name>`；transformer 现在改用基于位置的切片，不存在模式解释的问题。快照也能抓到
  // 明显的破坏，但这些显式断言把回归点写明了，失败时能直接定位原因。
  describe('$ literal preservation', () => {
    it('preserves `$` in a dynamic className template-literal expression', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className={`a$`} m-2 />',
        transformer,
        'foo.tsx',
      )
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div className={`${`a$`} m-2`} />')
    })

    it('preserves `$&` in a dynamic className ternary expression', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className={x ? \'$&\' : y} m-2 />',
        transformer,
        'foo.tsx',
      )
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div className={`${x ? \'$&\' : y} m-2`} />')
    })

    it('preserves `$&` in a static className value when appending utilities', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className="$&" m-2 />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<div className="$& m-2" />')
    })
  })

  // 回归：旧的 `String.replace` 方案命中第一个子串，值碰巧和 class 字面量相同的其他属性
  // 会被误改。基于位置的编辑锚定到真实属性。Vue（`class`）和 JSX（`className`）共用追加
  // 逻辑，两边都验证。
  describe('class value collision with another attribute', () => {
    it('vue: appends to `class`, not to a sibling attribute with the same value', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div data-foo="text-red" class="text-red" mt-2 />',
        transformer,
        'foo.vue',
      )
      expect(result).toBe('<div data-foo="text-red" class="text-red mt-2" />')
    })

    it('jsx: appends to `className`, not to a sibling attribute with the same value', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div data-foo="text-red" className="text-red" mt-2 />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<div data-foo="text-red" className="text-red mt-2" />')
    })
  })

  // 回归：动态 `className={expr}` 的改写以前是拼出目标字符串再 `indexOf`——命中的可能是
  // 第一个子串，比如某个属性值里正好写着 `className={expr}`。改成位置锚定后修复。这是上面
  // 静态 class 撞车测试在动态路径上的镜像。
  describe('dynamic class value collision with another attribute', () => {
    it('jsx: rewrites the dynamic className attribute, not a sibling whose value contains it', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div data-x="className={c}" className={c} m-2 />',
        transformer,
        'foo.tsx',
      )
      // `data-x` 的字面值原样保留；真正被包一层的是 `className={c}`。
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div data-x="className={c}" className={`${c} m-2`} />')
    })
  })

  // 回归：删除无值属性以前用 `replace(` ${name}`)`，匹配标签里第一个 ` name`——包括其他
  // 属性名里的子串。基于位置的删除锚定到真实属性 token。
  describe('value-less attribute name collision', () => {
    it('vue: deletes only the consumed shorthand, not a sibling whose name contains it', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div ma data-ma="x" />',
        transformer,
        'foo.vue',
      )
      // `ma` 被消费进 `class`；`data-ma`（属性名里含 `ma`）不受影响。
      // 能做到这一点靠的是锚定属性 token 的按位置删除——旧的 `replace(` ${name}`)` 会
      // 命中 `data-ma` 里的 ` ma`。
      expect(result).toBe('<div data-ma="x" class="ma"/>')
    })
  })

  // 回归：`scanBracedExpression` 现在会跳过引号包裹的内容（字符串/模板字符串），字符串里的
  // `}` 不再把括号深度减没、截断表达式。
  describe('quoted `}` inside JSX expression containers', () => {
    it('does not mis-balance on a `}` inside a string literal', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className={obj[\'}\']} mt-2 />',
        transformer,
        'foo.tsx',
      )
      // 完整的 `{obj[\'}\'}` 表达式被保留，工具类追加在它后面。
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div className={`${obj[\'}\']} mt-2`} />')
    })
  })

  // 回归：空静态 `class=""` / `className=""` 以前会把 `?append?` 哨兵留在输出里，还会注入
  // 第二个 class 属性——因为空字符串被当作存在标记（`''` 是 falsy）。两个症状分开测，
  // 谁都不许回来。
  describe('empty static class value', () => {
    it('jsx: appends utilities into the existing empty className without a sentinel or duplicate', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className="" m-2 />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<div className="m-2" />')
    })

    it('vue: appends utilities into the existing empty class without a sentinel or duplicate', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div class="" m-2 />',
        transformer,
        'foo.vue',
      )
      expect(result).toBe('<div class="m-2" />')
    })

    it('leaves the empty class untouched when no utilities are collected', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className="" text="not-a-util" />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<div className="" text="not-a-util" />')
    })
  })

  // 回归：空白折叠以前只跟踪 `'` 和 `"` 引号，JSX `{...}` 表达式内的空白——包括本
  // transformer 自己为动态 className 生成的模板字符串——会被静默折叠（如 `a   b` -> `a b`）。
  describe('whitespace inside JSX expression containers is preserved', () => {
    it('preserves multiple spaces inside a template-literal className expression', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className={`a   b`} m-2 />',
        transformer,
        'foo.tsx',
      )
      // 内部的 `a   b`（3 个空格）必须原样保留；被折叠的只有属性删除留下的孤立空白。
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div className={`${`a   b`} m-2`} />')
    })

    it('preserves a leading space inside a template-literal className expression', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className={` a b`} m-2 />',
        transformer,
        'foo.tsx',
      )
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div className={`${` a b`} m-2`} />')
    })

    it('preserves multiple spaces inside a ternary string literal', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className={x ? \'a b\' : \'c  d\'} m-2 />',
        transformer,
        'foo.tsx',
      )
      // 三元表达式字符串字面量里 `c  d` 的双空格必须保留。
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div className={`${x ? \'a b\' : \'c  d\'} m-2`} />')
    })
  })

  // 已记录的局限：`elementRE` 的 `(?=.*>)` lookahead 把 JSX 表达式里的第一个 `>` 当成标签
  // 的收尾 `>`，元素只匹配到那个 `>` 为止然后被静默跳过——上面的工具类不会报错地丢掉。
  // 真实代码里的箭头函数（`onClick={() => fn()}`）和比较运算符（`disabled={a > b}`）都会
  // 踩到。这些测试锁定当前的「不处理」行为：以后改这个正则的人必须明确决定是保留还是修复。
  describe('attribute expression containing `>` is silently skipped', () => {
    it('arrow function prop drops the utility on the same element', async () => {
      const transformer = transformerAttributify()
      const src = '<div onClick={() => fn()} m-2 />'
      const result = await transform(src, transformer, 'foo.tsx')
      // 输出等于输入——`m-2` 没被收集，也没有注入 `className`。
      expect(result).toBe(src)
    })

    it('comparison operator in a prop drops the utility on the same element', async () => {
      const transformer = transformerAttributify()
      const src = '<div disabled={a > b} m-2 />'
      const result = await transform(src, transformer, 'foo.tsx')
      expect(result).toBe(src)
    })
  })

  // 快照 fixture 没覆盖的选项行为：`deleteAttributes: false` 要保留被消费的简写属性，
  // 同时照常注入拼好的 class。
  describe('deleteAttributes: false', () => {
    it('keeps shorthand attributes and still injects class', async () => {
      const transformer = transformerAttributify({ deleteAttributes: false })
      const result = await transform('<div m-2 text-red />', transformer, 'foo.tsx')
      expect(result).toBe('<div m-2 text-red className="m-2 text-red"/>')
    })
  })

  // 回归：动态 `className={expr}` 的 span 以前硬编码 `name.length + 1`，`=` 两侧有空格时
  // （`className = {c}`）会算短。替换在表达式中间就结束了，尾部字符（`c}`）落在模板字符串
  // 外面，产出非法 JSX。改用 `contentOffset` 锚定后两种情况都对。
  describe('spaces around `=` in dynamic className', () => {
    it('preserves the full expression when `=` has surrounding spaces', async () => {
      const transformer = transformerAttributify()
      const result = await transform('<div className = {c} m-2 />', transformer, 'foo.tsx')
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output, not an interpolated template
      expect(result).toBe('<div className={`${c} m-2`} />')
    })
  })

  // 回归：JSX 展开 `{...{ a: flex }}` 以前切 token 时丢了开头的 `{`，展开对象里的标识符
  // `flex`（恰好是合法工具类）被当成工具类消费并从对象里删掉——运行时代码被静默改坏。
  // transformer 现在在属性循环里逐 token 识别 `{`，扫描完整的括号容器并把这段 span 标记为
  // 已消费，内部 token 一律跳过。展开可以出现在属性列表的任何位置，不只是第一个——见下面的
  // `mid-tag spread attributes`。
  describe('spread attributes with utility-named inner identifiers', () => {
    it('does not consume or delete a utility-named key from the spread object', async () => {
      const transformer = transformerAttributify()
      const result = await transform('<div {...{ a: flex }} text-red />', transformer, 'foo.tsx')
      // `flex` 留在展开对象里；只收集了 `text-red`。
      expect(result).toBe('<div {...{ a: flex }} className="text-red"/>')
    })

    it('does not consume or delete multiple utility-named keys', async () => {
      const transformer = transformerAttributify()
      const result = await transform('<div {...{ flex: 1, block: 2 }} text-red />', transformer, 'foo.tsx')
      expect(result).toBe('<div {...{ flex: 1, block: 2 }} className="text-red"/>')
    })

    it('unspaced identifier spread is preserved', async () => {
      const transformer = transformerAttributify()
      const result = await transform('<div {...props} text-red />', transformer, 'foo.tsx')
      expect(result).toBe('<div {...props} className="text-red"/>')
    })
  })

  // 回归（P0）：展开的预扫描以前只在展开是第一个属性时触发，写在标签后面的展开
  // （`<Comp className="x" {...rest} />`）会漏掉，开头的 `{` 丢失。内部 token 随后被当作
  // 零散 token 消费成工具类、从展开对象里删掉——`<div {...{ a: flex }} text-red />` 会产出
  // `{ a: , b: }`。展开写在标签中部很常见（比如跟在静态 className 后面），不修会静默破坏
  // 运行时代码。逐 token 检测现在支持任意位置的展开。
  describe('mid-tag spread attributes', () => {
    it('does not corrupt a spread after a static className (single utility-named value)', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className="x" {...{ a: flex }} text-red />',
        transformer,
        'foo.tsx',
      )
      // `flex` 留在展开对象里；`text-red` 追加到静态 className 上。
      expect(result).toBe('<div className="x text-red" {...{ a: flex }} />')
    })

    it('does not corrupt multiple utility-named values in a mid-tag spread', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className="x" {...{ a: flex, b: block }} text-red />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<div className="x text-red" {...{ a: flex, b: block }} />')
    })

    it('does not consume the spread identifier when mid-tag and unspaced', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className="x" {...rest} m-2 />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<div className="x m-2" {...rest} />')
    })

    it('collects outer utilities when a value-less shorthand precedes the spread', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div first {...rest} m-2 />',
        transformer,
        'foo.tsx',
      )
      // `first` 不是工具类所以保留；`m-2` 被收集并注入为 className。`rest` 原样不动。
      expect(result).toBe('<div first {...rest} className="m-2"/>')
    })

    it('handles multiple spreads across the attribute list', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div {...a} {...b} text-red />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<div {...a} {...b} className="text-red"/>')
    })

    it('handles a quoted `}` inside a mid-tag spread object literal', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className="x" {...{ a: "}" }} text-red />',
        transformer,
        'foo.tsx',
      )
      // 字符串字面量里的 `}` 不能把括号深度减没。
      expect(result).toBe('<div className="x text-red" {...{ a: "}" }} />')
    })
  })

  // 回归：无值属性名和标签名相同、且它是唯一属性时，`attrSeg`（`"flex "`）是 `<flex ` 的
  // 子串，`indexOf(attrSeg)` 命中标签名，删除编辑把标签开头也吃掉
  // （`<flex flex />` -> `< flex className="flex"/>`）。偏移现在从第一个空白（标签名/属性
  // 分隔符）推导，不再用 `indexOf(attrSeg)`。
  describe('tag name equals value-less attribute name', () => {
    it('vue: does not corrupt the tag name when the only attribute shares its name', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<flex flex />',
        transformer,
        'foo.vue',
      )
      expect(result).toBe('<flex class="flex"/>')
    })

    it('jsx: does not corrupt the tag name when the only attribute shares its name', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<flex flex />',
        transformer,
        'foo.tsx',
      )
      expect(result).toBe('<flex className="flex"/>')
    })
  })

  // 上面 `quoted } inside JSX expression containers` 测试的加强版：那个用例内部没有空白，
  // `\S+` 能整段捕获 `{...}`，根本走不到 `scanBracedExpression`（和 `skipQuoted`）。这个
  // 变体内部带空白，`\S+` 被截断、走进括号扫描器——正是 `skipQuoted` 起作用的路径。
  describe('quoted `}` inside a whitespace-bearing JSX expression container', () => {
    it('does not mis-balance on a `}` inside a string literal within a ternary', async () => {
      const transformer = transformerAttributify()
      const result = await transform(
        '<div className={x ? \'}\' : y} mt-2 />',
        transformer,
        'foo.tsx',
      )
      // eslint-disable-next-line no-template-curly-in-string -- literal expected output
      expect(result).toBe('<div className={`${x ? \'}\' : y} mt-2`} />')
    })
  })
})
