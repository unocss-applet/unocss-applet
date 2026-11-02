# packages/transformer-attributify

小程序端的 attributify 变通实现，替代上游 `@unocss/preset-attributify`。上游靠运行期属性选择器 `[un-text='']` 工作，小程序 wxss 不支持属性选择器，所以这个 transformer 在构建期把 `<view text="red" mt-2 />` 编译成 `<view class="text-red mt-2" />`。

## 要点

- `.vue` 走 `@vue/compiler-dom` 解析，`.jsx` / `.tsx` 走正则匹配元素。JSX 侧的边界写在 `src/index.ts` 文件头：Fragment 短语法不命中、长得像标签的字符串子节点可能被误读、表达式容器里的 `>` 会截断匹配导致该元素的工具类静默丢失。改代码前先读那段注释。
- 被搬进 `class` 的工具类会走和 `presetApplet` 同一套别名规则（非法字符换 `_a_`、非 ASCII 编码），否则源码里的类名和生成的 CSS 选择器对不上。共用逻辑在 `../shared`。
- `ignoreAttributes`、`prefixedOnly`、`deleteAttributes`、`ignoreTagPrefixes` 的行为由 `src/types.ts` 的 JSDoc 定义，改语义时同步改 JSDoc。
- 上游 `preset-attributify` 在 66.11 改了 `ignoreAttributes` 与绑定前缀的先后顺序，那是上游自己的提取器，和这里的实现没有共享代码。

## 测试

```bash
cd ../.. && pnpm vitest run test/transformer-attributify.test.ts
```

快照在 `test/fixtures/output/attributify.vue` 和 `attributify-prefixed-only.vue`，输入 fixtures 是手写的小程序模板。改了改写规则要连 fixtures 一起看，不能只 `-u`。
