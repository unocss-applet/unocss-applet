# packages/preset-rem-rpx

一个 `postprocess`，把生成 CSS 里的 `rem` 和 `rpx` 互相换算，让同一份工具类在两端都能用。小程序端用 `rem2rpx`（默认），H5 端用 `rpx2rem`。

## 要点

- 换算只改 `util.entries` 里的值，不碰选择器。所以它和 `presetApplet` 的 postprocess 谁先谁后都不影响选择器改写，两者可以同时开。
- 公式：`rem2rpx` 乘以 `baseFontSize * (750 / screenWidth)`，`rpx2rem` 反过来。默认 16px / 375，改默认值等于改所有人的视觉尺寸。
- 正则只匹配数字加单位（`-?[.\d]+rem`），不处理 `calc()` 里嵌套的表达式的语义，只做字符串替换。

## 测试

```bash
cd ../.. && pnpm vitest run test/preset-rem-rpx.test.ts
```

测试里 `space-x-4` 的期望值来自上游 wind3 生成的相邻兄弟选择器形式（`>:not([hidden])~:not([hidden])`），因为它用的是上游 preset 而不是 `presetApplet`。如果哪天把 applet 的变体也接进来，这批期望值要跟着改。
