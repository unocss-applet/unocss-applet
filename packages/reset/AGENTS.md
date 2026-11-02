# packages/reset

纯 CSS 集合，没有源码、构建和测试。`package.json` 的 `files` 只有 `taro/` 和 `uni-app/` 两个目录，用户按路径直接引 CSS。

## 目录

两个目录的文件名一一对应：`button-after.css`、`eric-meyer.css`、`normalize.css`、`sanitize/`、`tailwind.css`、`tailwind-compat.css`、`tailwind-v4.css`。uni-app 与 taro 的差异只在条件编译注释的写法（`#ifdef H5` 对 `#ifdef h5`）。

## 改这些文件时

`tailwind.css` 是上游 UnoCSS 内置 Tailwind preflight 的手工同步版本，`tailwind-compat.css` / `tailwind-v4.css` 跟着上游对应版本走。其余几个是各自上游项目的快照，与 UnoCSS 版本无关。同步规则写在 CONTRIBUTING.md 的「关于 reset 的同步」。

表单和浏览器兼容规则（`-webkit-appearance`、`::-webkit-*`、`:-moz-*`、`[type='search']` 等）只在 H5 生效，必须放在条件编译块里；`[hidden]`、`--un-content` 变量这类双端通用的规则放条件编译外。放错位置的表现是小程序端编译出无效规则，不会报错。

改完跑 `pnpm build:uni:mp-weixin` 和 `pnpm build:taro:weapp`，确认条件编译没漏。
