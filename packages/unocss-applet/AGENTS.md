# packages/unocss-applet

主包，只做聚合：`src/index.ts` 把 `@unocss-applet/preset-applet`、`preset-rem-rpx`、`transformer-attributify`、`transformer-hover` 全部 `export *` 出去，让用户一个包就能拿到 `presetApplet`、`presetRemRpx`、`transformerAttributify`、`transformerHover`。

## 这里的改动只有一种

改对外契约，不改实现。实现都在被聚合的包里，去那边改。

- `peerDependencies.unocss` 是**下游可用范围**（当前 `>=66.10.1 <66.13.0`），和本仓库锁定的开发版本不是一回事。写区间，不写 `~x.y.z`，也不要改成 `catalog:`。改它等于改兼容性承诺，必须同时更新 `COMPATIBILITY.md` 的版本支持段落和版本对应表。
- `engines.node` 是 `>=22.12`，理由在 `COMPATIBILITY.md`：`magic-string@1.x` 只有 ESM 入口，Taro 的 webpack 链路靠 Node 22.12 起的 `require(esm)` 才能加载。
- `package.json` 的 `version` 由维护者用 `pnpm release` 升，不要手改。
- `README.md` 里写着已验证的 UnoCSS 版本和补丁文件名。升 unocss 时这里和 `COMPATIBILITY.md` 一起改，别只改一处。

## 验证

```bash
cd ../.. && pnpm typecheck && pnpm vitest run
```

这个包没有自己的测试，它坏了通常表现为别的包的测试或示例构建失败。改完 `package.json` 记得跑一次 `pnpm install`，让 workspace 重新解析。
