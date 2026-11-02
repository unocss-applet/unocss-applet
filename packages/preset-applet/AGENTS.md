# packages/preset-applet

项目里最核心的包。`presetApplet()` 返回一个被改造过的 wind3 或 wind4 presets，用户配了这一条就同时得到选择器改写和源码改写。

## 文件分工

| 文件 | 作用 |
| --- | --- |
| `src/index.ts` | `presetApplet`，选预设、删规则、换变体、注入 postprocess，并通过 `configResolved` 自动注册 transformer |
| `src/transformers.ts` | `transformerApplet`，把源码里带非法字符的工具类改写成 `_a_` 别名并注册 shortcut |
| `src/preflights.ts` | wind3 专用 preflight，重新实现是为了控制变量前缀和按需产出 |
| `src/variants.ts` | `space-x-*` / `divide-*` / `*:` 的小程序替代实现，把相邻兄弟选择器换成明确的元素列表 |
| `src/types.ts` | 对外选项类型 |

## 四条不能破坏的不变量

**`postprocess` 同时处理 `selector` 和 `parent`。** wind3 把复杂变体拍平成复合选择器，只改 `selector` 就够；wind4 会重构成嵌套形式，类名在 `util.parent` 里。漏掉 `parent` 时 wxss 里引用不到，样式静默失效。正则用的是双重转义（`escapeSelector(escapeSelector(char))`），因为传进来时 `.` 已经变成 `\.`。

**`questionMark` 规则按 pattern 删，不按位置删。** 上游那条规则会把三元表达式里的 `?` 当成工具类，被 transformer 改写成 `_a_` 之后直接损坏脚本代码（#108）。用 `pop()` 依赖它恰好是数组最后一项，上游一追加规则就会漏删。

**wind3 的 `variants` 用下标 1 替换。** 上游 `variants()` 前两项是 `placeholderModifier` 和 `variantSpaceAndDivide`（66.12.0 仍如此）。上游若在这个位置前面插入新变体，这里会换错对象，`test/assets/output/preset-wind3-targets.css` 里 `space-x-*` 的 `>view+view` 会立刻对不上。

**wind4 的 `property` preflight selector 必须去掉 `*`。** 小程序写不出通配选择器，默认的 `*, ::before, ::after, ::backdrop` 换成 `:not(not), ::before, ::after, ::backdrop`。用户显式写 `property: false` 时不要覆盖。

## transformer 的边界

`transformerApplet` 先解析再改写：`.vue` 走 `@vue/compiler-dom`，`.js/.ts/.jsx/.tsx` 走 `oxc-parser`，只改字符串字面量、模板字符串的静态部分、模板文本和 `class` 属性值。数组下标 `m[1]`、注释、正则、指令表达式、插值里的字符串都不动（#114）。不认识的文件类型才回退整文件正则。

解析失败时的选择是「跳过改写」而不是「尽力改写」：宁可漏掉一个工具类，也不能把脚本改坏。改这段逻辑前先读 `test/transformer-applet-source-safety.test.ts`，它固定了这些边界和 transformer 执行顺序（用户 transformer 先、applet 后）。

## 测试

```bash
cd ../.. && pnpm vitest run test/preset-applet-wind3.test.ts test/preset-applet-wind4.test.ts
cd ../.. && pnpm vitest run test/transformer-applet.test.ts test/transformer-applet-source-safety.test.ts test/transformer-applet-directives.test.ts
```

新增工具类覆盖时加到 `test/assets/preset-wind3-targets.ts` / `preset-wind4-targets.ts`，再 `pnpm test:update`。wind4 的已知不支持项记在 `test/preset-applet-wind4.test.ts` 的 `unmatched` inline snapshot 里，它变了就是兼容性结论变了。

改完跑 `pnpm build:uni:mp-weixin` 和 `pnpm build:taro:weapp`。单测只看固定 token 集，真实模板里的写法比它野。
