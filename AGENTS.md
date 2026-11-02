# AGENTS.md

给在这里改代码的 AI agent 用的说明。人类贡献者看 [CONTRIBUTING.md](./CONTRIBUTING.md)，两边有冲突时以本文件为准，并顺手把 CONTRIBUTING.md 一起改掉。

## 这是什么项目

`unocss-applet` 让 UnoCSS 能在 uni-app / Taro 构建的小程序里跑。它不是 UnoCSS 的 fork，而是包住上游 `@unocss/preset-wind3` / `@unocss/preset-wind4`，做三件事：删掉小程序解析不了的规则和变体、把选择器里的非法字符改写掉、把源码里的工具类改写成小程序安全的形式。

两套真实示例在 `examples/`（uni-app + Vite、Taro 4 + Webpack5）。小程序端的坑只有跑这两套构建才看得到，单测覆盖不到。

## 环境

- Node 26（`.node-version`）；发布的包要求 `>= 22.12`
- pnpm 12.3.4（`packageManager` 字段），建议 `corepack enable`

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint .
pnpm test             # vitest watch
pnpm vitest run       # 跑一遍
pnpm test:update      # 更新快照
pnpm build            # 构建所有包

# 真实构建链路（改 preset / transformer / 依赖版本后必跑）
pnpm build:uni:mp-weixin
pnpm build:uni:h5
pnpm build:taro:weapp
pnpm build:taro:h5
```

## 目录

```
packages/     发布的包，每个包有独立的 AGENTS.md
examples/     uni-app 与 Taro 示例，也是端到端验证手段
test/         单测与快照（test/assets/output/ 是 CSS，test/fixtures/output/ 是改写后的模板）
patches/      依赖补丁，只用于 @unocss/webpack 的 CJS interop 缺陷
```

## 改代码前必须知道的三件事

**依赖版本集中在一处。** 所有 `@unocss/*` 版本走 `pnpm-workspace.yaml` 的 catalog，不许在包 `package.json` 里写死。升级流程（catalog、`minimumReleaseAgeExclude`、补丁、peer 范围、快照、文档）见 CONTRIBUTING.md 的「升级上游 UnoCSS」。

**`@unocss/webpack` 的补丁绑定版本号和产物文件名。** `patches/@unocss__webpack@<版本>.patch` 改的是 `dist/unplugin-<hash>.cjs` 里的一行 interop。换 unocss 版本必须重新生成补丁，只改版本号会让补丁静默失配，Taro 构建报 `magic_string.default is not a constructor`。补丁能删的前提是上游自己修好了。

**快照是兼容性结论，不是噪音。** `test/assets/output/*.css` 记录小程序端会生成什么 CSS。`pnpm test:update` 之后必须逐条看 diff，每一项都要能对应到上游提交或本次改动；对不上就是行为变了，先查清楚再提交。`test/preset-applet-wind4.test.ts` 里的 `unmatched` inline snapshot 是小程序端已知不支持的清单，它变了就等于 COMPATIBILITY.md 的结论变了。

## 约定

- 代码、注释、文档都用中文；文件与目录用 kebab-case。
- 注释解释「为什么」和「上游的哪个行为被绕过了」，不重复代码本身。引用上游文件时给链接。
- 改动碰到跨端行为时，同时说明小程序端和 H5 端。
- commit 用 Conventional Commits，scope 用包名，例如 `fix(preset-applet): ...`。
- 不手写 lockfile，用 pnpm 生成。

## 验证标准

改完至少跑 `pnpm lint`、`pnpm typecheck`、`pnpm vitest run`。碰到下面这些还必须跑对应示例构建：

- 改 `packages/preset-applet`、`shared`，或改 `packages/*/src` 里影响生成 CSS 的逻辑
- 改 unocss 依赖版本或补丁
- 改 `examples/*/uno.config.ts`、`vite.config.ts`、`config/index.ts`
