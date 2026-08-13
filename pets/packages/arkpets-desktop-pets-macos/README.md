# Arkpets Desktop Pets 3.2.0 — macOS

此目录用于接收 macOS CI 构建产物：

- `Arkpets Desktop Pets-3.2.0-macOS-arm64.dmg`：Apple Silicon（M 系列）
- `Arkpets Desktop Pets-3.2.0-macOS-x64.dmg`：Intel Mac

当前 Windows 工作机不能生成、签名或公证 macOS DMG。请使用项目根目录中的
`.github/workflows/build-macos.yml` 在 macOS GitHub Actions 运行器上构建，再把正式产物与
SHA-256 填入本目录和宣传页。

公开发布前必须完成 Mac 实机功能验证；推荐使用 Apple Developer ID 签名和公证版本。
