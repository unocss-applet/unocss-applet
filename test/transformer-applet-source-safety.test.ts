import type { UnocssPluginContext, UserConfig } from '@unocss/core'
import { presetApplet, transformerApplet } from '@unocss-applet/preset-applet'
import transformerHover from '@unocss-applet/transformer-hover'
import { createGenerator } from '@unocss/core'
import MagicString from 'magic-string'
import { describe, expect, it } from 'vitest'

/**
 * #114 回归测试：`transformerApplet` 只能改写处在类名位置的工具类 token（class 属性、
 * class 字符串字面量），绝不能碰可执行的 JS/TS——尤其是数组下标，因为 `m[1]`/`p[1]`/`w[1]`
 * 本身就是真实的 UnoCSS bracket utility，会和 `m[1] = 2` 这类日常代码撞车。
 *
 * 修复方案是先解析代码（.vue 用 Vue 模板编译器，.js/.ts/.jsx/.tsx 用 oxc），只在持有
 * 类名的 span 内改写；解析不了的文件类型回退为旧行为——整文件正则改写。若文件已被
 * 前面的 pre transformer（hover/attributify）改过，则基于当前内容重新解析匹配，最后
 * 一次整文件 overwrite 回写。断言故意用
 * `toBe` 加手写的期望字符串，而不是快照：快照一旦被随手 `vitest -u` 覆盖，就会把错误
 * 输出固化成“正确答案”。
 */

// 每次调用都新建一个 generator —— transformer 会把别名注册进 `uno.config.shortcuts`，
// 多个用例共用一个实例的话，别名会互相串
async function transform(
  code: string,
  id = 'src/foo.ts',
  unoConfig: UserConfig = {},
  presetOptions = {},
) {
  const uno = await createGenerator({ ...unoConfig, presets: [presetApplet(presetOptions)] })
  const s = new MagicString(code)
  await transformerApplet().transform(s, id, {
    tokens: new Set<string>(),
    uno,
  } as UnocssPluginContext)
  return s.toString()
}

describe('transformer-applet: JS/TS code must survive (#114)', () => {
  it('plain array subscript on a long variable name', async () => {
    const code = 'const arr = [1, 2]; export default arr[1]'
    expect(await transform(code)).toBe(code)
  })

  // `m[1]` 本身就是 UnoCSS 工具类（margin: 1），最基础的撞车场景
  it('subscript on `m` — collides with the margin utility', async () => {
    const code = 'const m = new Map(); m[1] = 2'
    expect(await transform(code)).toBe(code)
  })

  it('subscripts on `w` and `p` — collide with width/padding', async () => {
    const code = 'const w = [], p = []; w[1] = 1; p[1] = 2'
    expect(await transform(code)).toBe(code)
  })

  it('subscript inside nullish coalescing / optional chaining', async () => {
    const code = 'const b = m?.[1] ?? p[0]'
    expect(await transform(code)).toBe(code)
  })

  it('subscript with a dynamic key', async () => {
    // 单字母数组配运行时下标——真实代码里最常见的形态（`m[key]` → `m_a_key_a_`）
    const code = 'const v = m[key]; const u = p[state.open]'
    expect(await transform(code)).toBe(code)
  })

  it('member access plus subscript', async () => {
    const code = 'const v = state.list[0]; const g = grid[i][j]'
    expect(await transform(code)).toBe(code)
  })

  it('array destructuring and object defaults', async () => {
    const code = 'const [first, second] = list; const { x = arr[0] } = obj'
    expect(await transform(code)).toBe(code)
  })

  it('computed assignment with dynamic keys', async () => {
    // eslint-disable-next-line no-template-curly-in-string -- literal `${i}` is code under test
    const code = 'map[key] = value; obj[`k${i}`] = items[i]'
    expect(await transform(code)).toBe(code)
  })

  it('ts generics and type annotations', async () => {
    const code = 'const a = useState<string[]>([]); type T = Record<string, Item[]>; const r = ref<Item[]>([])'
    expect(await transform(code)).toBe(code)
  })

  it('subscripts inside a ternary', async () => {
    const code = 'const v = cond ? arr[0] : arr[1]'
    expect(await transform(code)).toBe(code)
  })

  it('subscripts inside a data template literal (non-class usage)', async () => {
    // eslint-disable-next-line no-template-curly-in-string -- literal `${list[0]}` is fixture data
    const code = 'const url = `https://x.com/${list[0]}/${list[1]}`'
    expect(await transform(code)).toBe(code)
  })

  it('regex literals that contain utility-looking text', async () => {
    const code = 'const re = /^w-\\[\\d+rpx\\]$/; const ok = re.test(cls)'
    expect(await transform(code)).toBe(code)
    const code2 = 'const re2 = /p-2\\.5|text-\\[13px\\]/g'
    expect(await transform(code2)).toBe(code2)
  })

  it('short variable names inside callbacks stay readable', async () => {
    // eslint-disable-next-line no-template-curly-in-string -- literal `${i}` is fixture data
    const code = 'const label = items.map((m, i) => `${i}:${m}`).join()'
    expect(await transform(code)).toBe(code)
  })

  it('data subscripts and real template classes in one file: only the class is aliased', async () => {
    const code = [
      '<template><view class="p-2.5">total: {{ p[0] + p[1] }}</view></template>',
      '<script setup lang="ts">',
      'const p = [1, 2]',
      'p[0] = 10',
      '</script>',
    ].join('\n')
    expect(await transform(code, 'src/counter.vue')).toBe(
      [
        '<template><view class="p-2_a_5">total: {{ p[0] + p[1] }}</view></template>',
        '<script setup lang="ts">',
        'const p = [1, 2]',
        'p[0] = 10',
        '</script>',
      ].join('\n'),
    )
  })

  it('shared .ts module: class-map literals aliased, data subscripts untouched', async () => {
    const code = [
      'export const m = [1, 5, 15, 30]',
      'export const defaultStep = m[1]',
      'export const btnClass = \'text-[28rpx] p-2.5\'',
      'export const btnClassByType = { primary: \'bg-[#07c160] text-white\', warn: \'bg-[#fa515c]\' }',
    ].join('\n')
    expect(await transform(code, 'src/styles.ts')).toBe(
      [
        'export const m = [1, 5, 15, 30]',
        'export const defaultStep = m[1]',
        'export const btnClass = \'text-_a_28rpx_a_ p-2_a_5\'',
        'export const btnClassByType = { primary: \'bg-_a__a_07c160_a_ text-white\', warn: \'bg-_a__a_fa515c_a_\' }',
      ].join('\n'),
    )
  })

  it('wind4: subscript on `m` survives as well', async () => {
    const code = 'const m = new Map(); m[1] = 2'
    expect(await transform(code, 'src/foo.ts', {}, { preset: 'wind4' })).toBe(code)
  })
})

describe('transformer-applet: class contexts must still be aliased', () => {
  it('static class attribute: decimals, variants, brackets, important', async () => {
    expect(await transform('<view class="p-2.5 dark:bg-[#fff] w-[200rpx] !font-bold" />', 'src/foo.vue'))
      .toBe('<view class="p-2_a_5 dark_a_bg-_a__a_fff_a_ w-_a_200rpx_a_ _a_font-bold" />')
  })

  it('dynamic array binding: string literals inside :class="[...]"', async () => {
    expect(await transform('<view :class="[\'p-2.5\', cond ? \'m-2\' : \'mt-2.5\']" />', 'src/foo.vue'))
      .toBe('<view :class="[\'p-2_a_5\', cond ? \'m-2\' : \'mt-2_a_5\']" />')
  })

  it('object binding: keys inside :class="{ ... }"', async () => {
    expect(await transform('<view :class="{ \'p-2.5\': active, \'m-2.5\': !active }" />', 'src/foo.vue'))
      .toBe('<view :class="{ \'p-2_a_5\': active, \'m-2_a_5\': !active }" />')
  })

  it('ternary string class in template', async () => {
    expect(await transform('<text :class="todo.done ? \'text-[#999]\' : \'text-[#333]\'">{{ todo.text }}</text>', 'src/foo.vue'))
      .toBe('<text :class="todo.done ? \'text-_a__a_999_a_\' : \'text-_a__a_333_a_\'">{{ todo.text }}</text>')
  })

  it('concatenated class expression', async () => {
    expect(await transform('<view :class="\'p-2.5 \' + cls" />', 'src/foo.vue'))
      .toBe('<view :class="\'p-2_a_5 \' + cls" />')
  })

  it('template interpolation next to a real class: only the class changes', async () => {
    expect(await transform('<view class="p-2.5">{{ arr[1] }}</view>', 'src/foo.vue'))
      .toBe('<view class="p-2_a_5">{{ arr[1] }}</view>')
  })

  it('vue SFC <style> block is not rewritten', async () => {
    const code = '<template><view class="p-2.5" /></template>\n<style scoped>\n.p-2\\.5 { color: red; }\n</style>'
    expect(await transform(code, 'src/foo.vue')).toBe(
      '<template><view class="p-2_a_5" /></template>\n<style scoped>\n.p-2\\.5 { color: red; }\n</style>',
    )
  })

  it('user-defined shortcuts pass through (no unsupported chars to alias)', async () => {
    const code = '<view class="btn flex-center" />'
    expect(await transform(code, 'src/foo.vue', {
      shortcuts: {
        'btn': 'p-2.5 bg-[#07c160]',
        'flex-center': 'flex items-center justify-center',
      },
    })).toBe(code)
  })
})

describe('transformer-applet: taro (React) daily patterns', () => {
  it('static className and ternary string classes in tsx', async () => {
    const code = '<View className="p-2.5"><Text className={count > 0 ? \'text-[#f00]\' : \'text-[#0f0]\'}>{count}</Text></View>'
    expect(await transform(code, 'src/foo.tsx'))
      .toBe('<View className="p-2_a_5"><Text className={count > 0 ? \'text-_a__a_f00_a_\' : \'text-_a__a_0f0_a_\'}>{count}</Text></View>')
  })

  it('classNames() helper: literals and object keys aliased', async () => {
    const code = '<View className={classNames(\'p-2.5\', { \'mt-2.5\': cond })} />'
    expect(await transform(code, 'src/foo.tsx'))
      .toBe('<View className={classNames(\'p-2_a_5\', { \'mt-2_a_5\': cond })} />')
  })

  it('template literal className', async () => {
    // eslint-disable-next-line no-template-curly-in-string -- literal `${cls}` is fixture data
    const code = '<View className={`p-2.5 ${cls}`} />'
    // eslint-disable-next-line no-template-curly-in-string -- literal `${cls}` is fixture data
    expect(await transform(code, 'src/foo.tsx')).toBe('<View className={`p-2_a_5 ${cls}`} />')
  })

  it('array access in component body stays untouched', async () => {
    const code = 'function Page() {\n  const steps = [1, 2, 3]\n  const step = steps[1]\n  return <View className="p-2.5">{step}</View>\n}'
    expect(await transform(code, 'src/foo.tsx'))
      .toBe('function Page() {\n  const steps = [1, 2, 3]\n  const step = steps[1]\n  return <View className="p-2_a_5">{step}</View>\n}')
  })
})

describe('transformer-applet: UnoCSS capability boundary', () => {
  it('css variables: bg-$primary', async () => {
    expect(await transform('<view class="bg-$primary text-$color" />', 'src/foo.vue'))
      .toBe('<view class="bg-_a_primary text-_a_color" />')
  })

  it('arbitrary content with quotes and colon: content-[\'a:b\']', async () => {
    expect(await transform(`<view class="content-['a:b']" />`, 'src/foo.vue'))
      .toBe(`<view class="content-_a__a_a_a_b_a__a_" />`)
  })

  it('calc() with % and +: w-[calc(100%-200rpx)] h-[calc(100%+10px)]', async () => {
    expect(await transform('<view class="w-[calc(100%-200rpx)] h-[calc(100%+10px)]" />', 'src/foo.vue'))
      .toBe('<view class="w-_a_calc_a_100_a_-200rpx_a__a_ h-_a_calc_a_100_a__a_10px_a__a_" />')
  })

  it('stacked variants and responsive breakpoints', async () => {
    expect(await transform('<view class="dark:hover:bg-red/50 md:text-sm" />', 'src/foo.vue'))
      .toBe('<view class="dark_a_hover_a_bg-red_a_50 md_a_text-sm" />')
  })

  // 含 `=` 的 URL、important 的各种写法、负值工具类不在这里重复测——
  // `transformer-applet.test.ts` 的 `basic`、`aliases every important spelling (#106)`
  // 以及下面的 css round-trip 已经盖住了。

  it('cjk inside an arbitrary value is aliased and encoded to char codes', async () => {
    expect(await transform(`<view class="content-['你好']" />`, 'src/foo.vue'))
      .toBe(`<view class="content-_a__a_2032022909_a__a_" />`)
  })

  // 含 `=` 的过滤器（括号里的 `=` 不算）现在会照常别名化这个 token，与 preset 的
  // postprocess 选择器改写两边闭环。
  it('group-data-[state=open]:font-bold is aliased on the source side too', async () => {
    expect(await transform('<view class="group-data-[state=open]:font-bold" />', 'src/foo.vue'))
      .toBe('<view class="group-data-_a_state_a_open_a__a_font-bold" />')
  })

  it('wind4: bracket utilities are aliased the same way', async () => {
    expect(await transform('<view class="w-[200rpx] p-2.5" />', 'src/foo.vue', {}, { preset: 'wind4' }))
      .toBe('<view class="w-_a_200rpx_a_ p-2_a_5" />')
  })
})

describe('transformer-applet: css round-trip', () => {
  it('aliased source resolves to the same CSS as the original classes', async () => {
    const uno = await createGenerator({ presets: [presetApplet()] })
    const code = '<view class="w-[200rpx] p-2.5 bg-[#07c160] dark:hover:bg-red/50 !font-bold -ml-1.5" />'
    const cssBefore = (await uno.generate(code, { preflights: false })).css

    const s = new MagicString(code)
    await transformerApplet().transform(s, 'src/foo.vue', {
      tokens: new Set<string>(),
      uno,
    } as UnocssPluginContext)
    const cssAfter = (await uno.generate(s.toString(), { preflights: false })).css

    expect(cssAfter).toBe(cssBefore)
    expect(cssBefore).toContain('.w-_a_200rpx_a_')
    expect(cssBefore).toContain('.-ml-1_a_5')
    expect(cssBefore).toContain('!important')
  })
})

describe('transformer-applet: known tradeoffs', () => {
  // 没有类型信息就没法区分「字符串字面量」和「类名字符串」，而文档推荐的动态类写法
  // （`:class="'p-2.5 ' + cls"`、公共 .ts 里的类名映射表）依赖字面量被改写。所以像
  // obj['p-2.5'] 这样的数据 key 也会被改写。这里用测试固定下来，改坏会失败。
  it('a data-key string literal holding a utility is aliased as well', async () => {
    expect(await transform('const v = obj[\'p-2.5\']', 'src/foo.ts'))
      .toBe('const v = obj[\'p-2_a_5\']')
  })

  // AST 路径在改写前先解析代码，行注释会被识别成注释而原样保留——旧版无状态正则的
  // 局限对 .vue/.js/.ts 文件不再存在。
  it('utilities inside a `//` line comment are left alone', async () => {
    const code = '// use p-2.5 here\nconst x = 1'
    expect(await transform(code)).toBe(code)
  })
})

// ---------------------------------------------------------------------------
// 完整组件 fixture：日常的 uni-app（vue）和 taro（react）写法
// ---------------------------------------------------------------------------

const counterScript = `<script setup lang="ts">
import { computed, ref } from 'vue'

// 步进器的分钟档位；\`m\` 是真实代码里常见的短变量名
const m = [1, 5, 15, 30]
const step = ref(m[1])
const minutes = ref(30)
const history = ref<number[]>([])

function increment() {
  minutes.value += step.value
  history.value.push(minutes.value)
}

function decrement() {
  const last = history.value[history.value.length - 1] ?? 0
  minutes.value = Math.max(0, minutes.value - step.value)
}

const label = computed(() => \`\${minutes.value}min (+\${m[1]})\`)
</script>
`

const counterTemplate = `<template>
  <view class="p-4 flex items-center">
    <button class="w-[80rpx] p-2.5 text-[32rpx]" @click="decrement">-</button>
    <text class="mx-4 w-[120rpx] text-center text-[40rpx] font-bold">{{ minutes }}{{ label }}</text>
    <button class="w-[80rpx] p-2.5 text-[32rpx] !font-bold" @click="increment">+</button>
  </view>
</template>
`

const counterTemplateAliased = `<template>
  <view class="p-4 flex items-center">
    <button class="w-_a_80rpx_a_ p-2_a_5 text-_a_32rpx_a_" @click="decrement">-</button>
    <text class="mx-4 w-_a_120rpx_a_ text-center text-_a_40rpx_a_ font-bold">{{ minutes }}{{ label }}</text>
    <button class="w-_a_80rpx_a_ p-2_a_5 text-_a_32rpx_a_ _a_font-bold" @click="increment">+</button>
  </view>
</template>
`

describe('transformer-applet: uni-app counter component', () => {
  // script 里出现了两次 `m[1]`——真实代码里和 margin 工具类撞车的场景
  it('aliases template classes only, script stays verbatim', async () => {
    const code = counterTemplate + counterScript
    expect(await transform(code, 'src/counter.vue')).toBe(counterTemplateAliased + counterScript)
  })
})

const todoScript = `<script setup lang="ts">
import { computed, ref } from 'vue'

interface Todo { text: string, done: boolean }

const todos = ref<Todo[]>([
  { text: 'review #114 tests', done: true },
  { text: 'fix transformerApplet', done: false },
])

// 星期几的文案；\`w\` 是真实代码里常见的短变量名
const w = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const today = 1

function toggle(i: number) {
  todos.value[i].done = !todos.value[i].done
}

const remaining = computed(() => todos.value.filter(t => !t.done).length)
</script>
`

const todoTemplate = `<template>
  <view class="p-4">
    <view
      v-for="(todo, i) in todos"
      :key="i"
      class="flex items-center mt-2 p-2.5 rounded-lg"
      :class="{ 'bg-[#f7f7f7]': todo.done }"
      @click="toggle(i)"
    >
      <view class="mr-2 w-[36rpx] h-[36rpx] border rounded-full" :class="todo.done ? 'bg-[#07c160]' : 'bg-transparent'" />
      <text :class="todo.done ? 'text-[#999] line-through' : 'text-[#333]'">{{ i + 1 }}. {{ todo.text }}</text>
    </view>
    <text class="mt-4 text-[24rpx] text-[#999]">{{ remaining }} left · {{ w[today] }}</text>
  </view>
</template>
`

const todoTemplateAliased = `<template>
  <view class="p-4">
    <view
      v-for="(todo, i) in todos"
      :key="i"
      class="flex items-center mt-2 p-2_a_5 rounded-lg"
      :class="{ 'bg-_a__a_f7f7f7_a_': todo.done }"
      @click="toggle(i)"
    >
      <view class="mr-2 w-_a_36rpx_a_ h-_a_36rpx_a_ border rounded-full" :class="todo.done ? 'bg-_a__a_07c160_a_' : 'bg-transparent'" />
      <text :class="todo.done ? 'text-_a__a_999_a_ line-through' : 'text-_a__a_333_a_'">{{ i + 1 }}. {{ todo.text }}</text>
    </view>
    <text class="mt-4 text-_a_24rpx_a_ text-_a__a_999_a_">{{ remaining }} left · {{ w[today] }}</text>
  </view>
</template>
`

describe('transformer-applet: uni-app todo list component', () => {
  // 模板里的 `w[today]` 会和 width bracket utility 撞车；script 里的 `todos.value[i]`
  // 也必须原样保留
  it('aliases template classes only, script stays verbatim', async () => {
    const code = todoTemplate + todoScript
    expect(await transform(code, 'src/todo.vue')).toBe(todoTemplateAliased + todoScript)
  })
})

const optionsApiTemplate = `<template>
  <view class="p-2.5">
    <view :class="iconCls">step: {{ m[1] }}</view>
    <button @click="reset">reset</button>
  </view>
</template>
`

const optionsApiTemplateAliased = `<template>
  <view class="p-2_a_5">
    <view :class="iconCls">step: {{ m[1] }}</view>
    <button @click="reset">reset</button>
  </view>
</template>
`

const optionsApiScript = `<script>
export default {
  data() {
    return {
      iconCls: 'w-[36rpx] h-[36rpx] rounded-full',
      m: [1, 5, 15, 30],
    }
  },
  computed: {
    step() {
      return this.m[1]
    },
  },
  methods: {
    reset() {
      const last = this.m[this.m.length - 1]
      this.iconCls = last > 15 ? 'bg-[#07c160]' : 'bg-[#fa515c]'
    },
  },
}
</script>
`

// options API 把类名字符串存在 data()/methods 里——这些字面量必须照常改写，同时所有
// 下标（`{{ m[1] }}`、`this.m[1]`）都必须原样保留。本文件其他 fixture 都用
// <script setup>，只有这个用普通 <script> 的写法，修复也必须放过这种形态。
const optionsApiScriptAliased = `<script>
export default {
  data() {
    return {
      iconCls: 'w-_a_36rpx_a_ h-_a_36rpx_a_ rounded-full',
      m: [1, 5, 15, 30],
    }
  },
  computed: {
    step() {
      return this.m[1]
    },
  },
  methods: {
    reset() {
      const last = this.m[this.m.length - 1]
      this.iconCls = last > 15 ? 'bg-_a__a_07c160_a_' : 'bg-_a__a_fa515c_a_'
    },
  },
}
</script>
`

describe('transformer-applet: uni-app options-API component', () => {
  it('aliases class strings in data()/methods, keeps subscripts', async () => {
    const code = optionsApiTemplate + optionsApiScript
    expect(await transform(code, 'src/marker.vue'))
      .toBe(optionsApiTemplateAliased + optionsApiScriptAliased)
  })
})

// <wxs> 在同一个 .vue 文件里内嵌可执行 JS——正是 #114 撞车的形态；修复必须原样保留
// 它的内容，同时外围模板照常改写。
const wxsModule = `<wxs module="utils">
var m = [1, 2, 3]
function fmt(n) {
  return m[1] + n
}
module.exports = { fmt: fmt }
</wxs>
`

describe('transformer-applet: uni-app wxs module', () => {
  it('subscripts inside a wxs module survive, template class still aliases', async () => {
    const code = `<template><view class="p-2.5">{{ utils.fmt(1) }}</view></template>\n${wxsModule}`
    const expected = `<template><view class="p-2_a_5">{{ utils.fmt(1) }}</view></template>\n${wxsModule}`
    expect(await transform(code, 'src/foo.vue')).toBe(expected)
  })
})

const tabsTemplate = `<template>
  <view class="p-4">
    <view class="flex rounded-lg border border-[#eee]">
      <view
        v-for="(tab, i) in tabs"
        :key="tab.key"
        class="flex-1 py-2 text-center text-[28rpx]"
        :class="i === active ? 'text-[#07c160] font-bold' : 'text-[#999]'"
        @click="select(i)"
      >{{ tab.label }}</view>
    </view>
    <view class="mt-4" :class="tabs[active].cls" @click="reset()">{{ tabs[active].label }}</view>
  </view>
</template>
`

const tabsTemplateAliased = `<template>
  <view class="p-4">
    <view class="flex rounded-lg border border-_a__a_eee_a_">
      <view
        v-for="(tab, i) in tabs"
        :key="tab.key"
        class="flex-1 py-2 text-center text-_a_28rpx_a_"
        :class="i === active ? 'text-_a__a_07c160_a_ font-bold' : 'text-_a__a_999_a_'"
        @click="select(i)"
      >{{ tab.label }}</view>
    </view>
    <view class="mt-4" :class="tabs[active].cls" @click="reset()">{{ tabs[active].label }}</view>
  </view>
</template>
`

const tabsScript = `<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Tab { key: string, label: string, cls: string }

// composable：短变量名数组 + 下标——正是 #114 在 use* 函数里的形态
function useTabState(initial: number) {
  const m = [0, 1, 2]
  const active = ref(m[initial] ?? 0)

  function reset() {
    active.value = m[1]
  }

  return { m, active, reset }
}

const props = withDefaults(defineProps<{ initial?: number }>(), { initial: 1 })
const emit = defineEmits<{ change: [key: string] }>()

// 数据驱动的类名字符串——字面量必须改写，运行时的 class 才能和 wxss 对上
const tabs: Tab[] = [
  { key: 'all', label: 'all', cls: 'bg-[#f7f7f7] text-[#999]' },
  { key: 'active', label: 'active', cls: 'bg-[#07c160] text-white font-bold' },
  { key: 'done', label: 'done', cls: 'bg-[#fa515c] text-white' },
]

const { active, reset } = useTabState(props.initial)

const current = computed(() => tabs[active.value])

watch(active, (i) => {
  emit('change', tabs[i].key)
})

function select(i: number) {
  active.value = i
}
</script>
`

const tabsScriptAliased = `<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Tab { key: string, label: string, cls: string }

// composable：短变量名数组 + 下标——正是 #114 在 use* 函数里的形态
function useTabState(initial: number) {
  const m = [0, 1, 2]
  const active = ref(m[initial] ?? 0)

  function reset() {
    active.value = m[1]
  }

  return { m, active, reset }
}

const props = withDefaults(defineProps<{ initial?: number }>(), { initial: 1 })
const emit = defineEmits<{ change: [key: string] }>()

// 数据驱动的类名字符串——字面量必须改写，运行时的 class 才能和 wxss 对上
const tabs: Tab[] = [
  { key: 'all', label: 'all', cls: 'bg-_a__a_f7f7f7_a_ text-_a__a_999_a_' },
  { key: 'active', label: 'active', cls: 'bg-_a__a_07c160_a_ text-white font-bold' },
  { key: 'done', label: 'done', cls: 'bg-_a__a_fa515c_a_ text-white' },
]

const { active, reset } = useTabState(props.initial)

const current = computed(() => tabs[active.value])

watch(active, (i) => {
  emit('change', tabs[i].key)
})

function select(i: number) {
  active.value = i
}
</script>
`

describe('transformer-applet: uni-app composition-API tabs component', () => {
  // counter/todo fixture 之外的 <script setup> 形态：composable 里持有短变量名数组
  // （useTabState 里的 \`m[1]\`）、defineProps/defineEmits/watch、普通对象里放数据驱动的类名字符串
  it('aliases data-driven class strings, composable subscripts survive', async () => {
    const code = tabsTemplate + tabsScript
    expect(await transform(code, 'src/tabs.vue')).toBe(tabsTemplateAliased + tabsScriptAliased)
  })
})

const taroCounterScriptAndJsx = `import { useState } from 'react'
import { Button, Text, View } from '@tarojs/components'

function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = useState(initial)
  const steps = [1, 2, 3]
  const step = steps[1]

  return (
    <View className="p-2.5 flex items-center">
      <Button className="w-[80rpx] text-[32rpx]" onClick={() => setCount(count - step)}>-</Button>
      <Text className="mx-4 w-[120rpx] text-center text-[40rpx] font-bold">{count}</Text>
      <Button className="w-[80rpx] text-[32rpx] !font-bold" onClick={() => setCount(count + step)}>+</Button>
    </View>
  )
}

export default Counter
`

const taroCounterExpected = `import { useState } from 'react'
import { Button, Text, View } from '@tarojs/components'

function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = useState(initial)
  const steps = [1, 2, 3]
  const step = steps[1]

  return (
    <View className="p-2_a_5 flex items-center">
      <Button className="w-_a_80rpx_a_ text-_a_32rpx_a_" onClick={() => setCount(count - step)}>-</Button>
      <Text className="mx-4 w-_a_120rpx_a_ text-center text-_a_40rpx_a_ font-bold">{count}</Text>
      <Button className="w-_a_80rpx_a_ text-_a_32rpx_a_ _a_font-bold" onClick={() => setCount(count + step)}>+</Button>
    </View>
  )
}

export default Counter
`

describe('transformer-applet: taro counter component', () => {
  // 日常的 taro react 写法：组件体里的 `steps[1]` 原样保留，className 字面量照常改写
  it('aliases className literals only, script stays verbatim', async () => {
    expect(await transform(taroCounterScriptAndJsx, 'src/counter.tsx')).toBe(taroCounterExpected)
  })
})

const priceListCode = `import { useCallback, useEffect, useMemo, useState } from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

interface Item { id: number, name: string, price: number, cls: string }

// 自定义 hook：短名字的数组 + 下标——use* 函数里的典型 #114 场景
function usePrices() {
  const p = [199, 299, 399]
  return { base: p[1], top: p[2] }
}

function PriceList({ tag = 'hot' }: { tag?: string }) {
  const { base, top } = usePrices()
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: 'A', price: base, cls: 'text-[24rpx] text-[#999]' },
    { id: 2, name: 'B', price: top, cls: 'text-[28rpx] font-bold' },
  ])

  const total = useMemo(() => items.reduce((sum, item, i) => sum + items[i].price, 0), [items])

  const checkout = useCallback(() => {
    Taro.showToast({ title: \`total \${total}\` })
  }, [total])

  useEffect(() => {
    if (tag === 'hot')
      Taro.setNavigationBarTitle({ title: 'hot list' })
  }, [tag])

  return (
    <View className="p-2.5">
      {items.map((item, i) => (
        <View key={item.id} className="flex items-center mt-2" onClick={checkout}>
          <Text className={item.price > base ? 'text-[#fa515c] font-bold' : 'text-[#999]'}>
            {item.name} {items[i].price}
          </Text>
          <Text className={\`ml-2 w-[120rpx] \${item.cls}\`}>{tag}</Text>
        </View>
      ))}
    </View>
  )
}

export default PriceList
`

const priceListExpected = `import { useCallback, useEffect, useMemo, useState } from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'

interface Item { id: number, name: string, price: number, cls: string }

// 自定义 hook：短名字的数组 + 下标——use* 函数里的典型 #114 场景
function usePrices() {
  const p = [199, 299, 399]
  return { base: p[1], top: p[2] }
}

function PriceList({ tag = 'hot' }: { tag?: string }) {
  const { base, top } = usePrices()
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: 'A', price: base, cls: 'text-_a_24rpx_a_ text-_a__a_999_a_' },
    { id: 2, name: 'B', price: top, cls: 'text-_a_28rpx_a_ font-bold' },
  ])

  const total = useMemo(() => items.reduce((sum, item, i) => sum + items[i].price, 0), [items])

  const checkout = useCallback(() => {
    Taro.showToast({ title: \`total \${total}\` })
  }, [total])

  useEffect(() => {
    if (tag === 'hot')
      Taro.setNavigationBarTitle({ title: 'hot list' })
  }, [tag])

  return (
    <View className="p-2_a_5">
      {items.map((item, i) => (
        <View key={item.id} className="flex items-center mt-2" onClick={checkout}>
          <Text className={item.price > base ? 'text-_a__a_fa515c_a_ font-bold' : 'text-_a__a_999_a_'}>
            {item.name} {items[i].price}
          </Text>
          <Text className={\`ml-2 w-_a_120rpx_a_ \${item.cls}\`}>{tag}</Text>
        </View>
      ))}
    </View>
  )
}

export default PriceList
`

describe('transformer-applet: taro react price-list component', () => {
  // counter fixture 之外的日常 react hooks 形态：custom hook 持有短变量名数组
  // （usePrices 里的 \`p[1]\`/\`p[2]\`）、useMemo/useCallback/useEffect、.map 列表渲染、
  // 模板字符串 className、useState 里放类名字符串
  it('aliases className/state literals only, hook subscripts survive', async () => {
    expect(await transform(priceListCode, 'src/price-list.tsx')).toBe(priceListExpected)
  })
})

describe('transformer-applet: parse-failure and non-class attributes', () => {
  // 静态属性值里 `p-2.5` 是真实工具类，但 placeholder 是给用户看的文案，
  // 改写成 `p-2_a_5` 会直接破坏界面；只有 class/className 里的值才该被改写
  it('static non-class attribute values are never touched', async () => {
    const code = `<input placeholder="剩余 p-2.5 米" aria-label="py-3.5 视图" /><view class="p-2.5" />`
    expect(await transform(code, 'x.vue')).toBe(
      '<input placeholder="剩余 p-2.5 米" aria-label="py-3.5 视图" /><view class="p-2_a_5" />',
    )
  })

  // 已知类型的文件解析失败时跳过改写：回退整文件正则会把 `m[1] = 2` 改坏（#114 原始场景），
  // 漏一个工具类比损坏脚本轻
  it('syntax-error .ts file is left untouched instead of regex fallback', async () => {
    const code = `const m = []\nm[1] = 2\nconst cls = 'p-2.5'\nfunction ( { broken`
    expect(await transform(code, 'foo.ts')).toBe(code)
  })

  // .vue 同理：模板解析失败不能回退到整文件正则（那会碰到 <script> 里的代码）
  it('syntax-error .vue file is left untouched', async () => {
    const code = `<view :class="'p-2.5'"><view</view>\n<script setup>\nconst m = []; m[1] = 2\n</script>`
    expect(await transform(code, 'x.vue')).toBe(code)
  })

  // 表达式片段解析失败时跳过该片段，不把整个片段标成可改写
  it('unparseable :class expression fragment is skipped, not fully rewritten', async () => {
    // `(const x = 'p-2.5')` 是语法错误 → 该片段被跳过
    const code = `<view :class="const x = 'p-2.5'"></view><view class="p-2.5"></view>`
    expect(await transform(code, 'x.vue')).toBe(
      `<view :class="const x = 'p-2.5'"></view><view class="p-2_a_5"></view>`,
    )
  })
})

describe('transformer-applet: directives and interpolation are runtime code', () => {
  // `@click` 实参是运行时代码：改写 `copy('p-2.5')` 的实参会改变剪贴板内容
  it('@click handler string arguments survive', async () => {
    const code = `<view @click="copy('p-2.5')" />`
    expect(await transform(code, 'x.vue')).toBe(code)
  })

  // 插值里的字符串是展示/运行时求值：改写会改变用户可见输出
  it('interpolation string literals survive', async () => {
    const code = `<text>{{ format('bg-red/50') }}</text>`
    expect(await transform(code, 'x.vue')).toBe(code)
  })

  // :class 是类名位置，字符串字面量仍要改写（动态类写法依赖此行为）
  it(':class string literals are still aliased', async () => {
    expect(await transform(`<view :class="'p-2.5 ' + cls" />`, 'x.vue'))
      .toBe(`<view :class="'p-2_a_5 ' + cls" />`)
  })
})

describe('transformer-applet: coexists with transformerHover on one MagicString', () => {
  // 真实执行顺序是 hover(enforce pre，先注册) -> applet；hover 有变化时会整文件
  // overwrite 一次，之后 applet 不能再基于 s.original 的偏移做 slice/overwrite（在已
  // 编辑区间 slice 会抛错，吞掉的话整页工具类静默漏改）。applet 改为基于当前内容
  // 重新解析匹配，最后同样一次整文件 overwrite 回写。
  it('hover-only: token moved into hover-class, no crash', async () => {
    const uno = await createGenerator({ presets: [presetApplet()], transformers: [transformerHover()] })
    const s = new MagicString(`<view class="hover:bg-red/50" />`)
    const ctx = { tokens: new Set(), uno } as UnocssPluginContext
    for (const t of uno.config.transformers ?? [])
      await t.transform(s, 'x.vue', ctx)
    expect(s.toString()).toBe(`<view hover-class="bg-red_a_50"/>`)
  })

  // Finding 1 的核心场景：hover 改写过的文件里还有别的需要别名化的工具类，
  // applet 必须继续处理（之前基于 s.original 匹配会静默全部跳过）
  it('hover + remaining utility: both are handled', async () => {
    const uno = await createGenerator({ presets: [presetApplet()], transformers: [transformerHover()] })
    const s = new MagicString(`<view class="hover:bg-red p-2.5" />`)
    const ctx = { tokens: new Set(), uno } as UnocssPluginContext
    for (const t of uno.config.transformers ?? [])
      await t.transform(s, 'x.vue', ctx)
    expect(s.toString()).toBe(`<view class="p-2_a_5" hover-class="bg-red"/>`)
  })

  // 没有不支持字符时 hover 照常搬移、applet 无事可做，确认无回归
  it('hover-only without unsupported chars: no applet edits', async () => {
    const uno = await createGenerator({ presets: [presetApplet()], transformers: [transformerHover()] })
    const s = new MagicString(`<view class="hover:bg-red-500" />`)
    const ctx = { tokens: new Set(), uno } as UnocssPluginContext
    for (const t of uno.config.transformers ?? [])
      await t.transform(s, 'x.vue', ctx)
    expect(s.toString()).toBe(`<view hover-class="bg-red-500"/>`)
  })
})

describe('transformer-applet: hand-written hover-class is a class-name position', () => {
  // 用户不经 transformerHover、直接手写 hover-class="p-2.5" 的场景：
  // 这个属性值是类名位置，必须与 postprocess 的选择器别名一致
  it('hand-written hover-class value is aliased', async () => {
    expect(await transform(`<view hover-class="p-2.5" />`, 'x.vue'))
      .toBe(`<view hover-class="p-2_a_5" />`)
  })
})
