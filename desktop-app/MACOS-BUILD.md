# macOS 构建与发布

Arkpets 的渲染、动画、桌面跟随和用户导入逻辑均为 Electron 跨平台实现。macOS 构建目标为：

- Apple Silicon：`arm64`（M1、M2、M3、M4 及后续 M 系列）
- Intel Mac：`x64`
- 最低系统：macOS 12 Monterey
- 分发格式：DMG（给用户安装）与 ZIP（备份或发布系统使用）

## 在 Mac 本机生成测试包

```bash
cd desktop-app
corepack enable
pnpm install --frozen-lockfile
pnpm run dist:mac:arm64 # Apple Silicon
# 或
pnpm run dist:mac:x64   # Intel
```

输出位于 `desktop-app/dist/`。

## 使用 GitHub Actions

项目包含 `.github/workflows/build-macos.yml`。推送 `v*` 标签或在 GitHub 的 Actions 页面手动运行
“Build macOS packages”，会分别在 Apple Silicon 和 Intel macOS 运行器上生成 DMG 与 ZIP。

没有签名密钥时，工作流可以生成仅供测试的未签名包。面向公众发布前，建议加入以下 GitHub Secrets：

- `MAC_CSC_LINK`：Developer ID Application `.p12` 的 Base64 内容
- `MAC_CSC_KEY_PASSWORD`：证书密码
- `APPLE_API_KEY`：App Store Connect API `.p8` 密钥内容
- `APPLE_API_KEY_ID`：API Key ID
- `APPLE_API_ISSUER`：Issuer ID

凭据只能放在仓库 Secrets 中，不得写进代码或提交到 Git。

## 发布前检查

在 Mac 上对每个架构至少执行一次：

```bash
codesign --verify --deep --strict --verbose=2 "Arkpets Desktop Pets.app"
spctl --assess --verbose --type exec "Arkpets Desktop Pets.app"
xcrun stapler validate "Arkpets Desktop Pets.app"
```

还应人工验证：透明窗口、始终置顶、角色切换、Move 跟随、单击 Interact、双击 Special、
WASD/Shift、导入和删除桌宠，以及从右键菜单退出。

## 当前限制

Windows 工作机无法完成 Apple Developer ID 签名、公证或 Gatekeeper 实机验收。公开发布用的最终 DMG
必须在 macOS 或上述 macOS CI 中构建。未签名包不适合作为面向普通用户的正式下载包。
