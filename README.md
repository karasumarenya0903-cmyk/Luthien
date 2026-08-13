# Luthien / Arkpets Desktop Pets

一个支持多角色的透明桌宠程序，适用于 Windows，并提供 macOS 自动构建配置。内置桌宠包括 Angelina the Mellow Wish、Lemuen 和 Amiya — Apprentice Connector。

## 下载与运行

普通用户无需安装 ChatGPT、Codex、Node.js 或其他开发工具。请前往本仓库的 **Releases** 页面下载对应系统的安装包：

- Windows：下载 `Arkpets Desktop Pets.exe`，双击运行。
- macOS：根据电脑芯片下载 `arm64`（Apple Silicon）或 `x64`（Intel）的 DMG。

更完整的中文下载说明见 [`release/DOWNLOAD-GUIDE.zh-CN.md`](release/DOWNLOAD-GUIDE.zh-CN.md)。

## 操作方式

- 单击桌宠：播放 `interact`，然后平滑回到默认的 `relax`。
- 双击桌宠：角色包含 `special` 时播放特殊动作，然后平滑回到 `relax`。
- 右键桌宠：切换 `relax`、`sit`、`sleep`、`move`，或切换角色、导入/删除自定义桌宠。
- `move` 模式：桌宠跟随鼠标；单击会在原地退出并回到 `relax`。
- `WASD`：在 `move` 模式中控制方向；按住 `Shift` 加速。

## 用户导入桌宠

导入时需要选择文件名中分别包含 `Relax`、`Interact`、`Sit`、`Sleep`、`Move` 的五个 WebM 文件；`Special` 为可选文件。用户导入的角色可以在选择面板中删除，内置角色不可删除。

## 本地开发

```powershell
cd desktop-app
pnpm install
pnpm run verify:assets
pnpm test
pnpm start
```

Windows 打包：`pnpm run dist:win`。macOS 构建、签名和公证说明见 [`desktop-app/MACOS-BUILD.md`](desktop-app/MACOS-BUILD.md)。

## 素材与授权提示

本项目自身标记为 `UNLICENSED`。角色名称、形象及素材的权利归其各自权利人所有；公开分发或商业使用前，请确保你拥有相应素材的使用与再分发许可。

