# packages/shared

`private: true`，不发布，不参与构建。`preset-applet`、`transformer-attributify`、`transformer-hover` 通过相对路径 `../../shared/src` 直接引用源码。

## 两个文件

`src/constants.ts` 的 `UNSUPPORTED_CHARS` 是「小程序类名里不能出现哪些字符」的唯一来源。改这张表等于同时改三件事：`presetApplet` 的 postprocess 会把它们换成 `_a_`，`transformerApplet` 会据此把源码里的 token 改写成别名，`transformerHover` 搬移时用同一套判断。漏改一处会出现「源码改写了、CSS 没改写」或相反的错位。

`src/helper.ts` 的 `encodeNonSpaceLatin` 把非 ASCII 字符编码成字符码。` $$ ` 是 UnoCSS shortcut 的组合分隔符（`'a-bg': 'bg-gray-100 dark:bg-black'` 会生成 `dark $$ a-bg` 这类选择器），必须跳过不编码，否则选择器结构被破坏。

## 注意

- 这里没有测试文件，覆盖它的用例在 `test/utils.test.ts` 和各 transformer 的测试里。加函数时在那个测试里补一条。
- 因为是源码级引用，改完不用 `pnpm build`，但打包后的 `dist` 会把它内联进各个包，所以发布前要重新构建全部包（`pnpm build`）。
