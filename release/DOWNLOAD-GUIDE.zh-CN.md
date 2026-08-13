# Arkpets 下载、安装与使用教程

## 下载前先看

Arkpets 是独立桌面程序，不需要安装 ChatGPT、Codex、Node.js，也不需要 OpenAI 账号或 API Key。

请只从作者的正式发布页下载，并核对该版本公布的 SHA-256。不同平台的文件不能混用：

- Windows 10/11 64 位：下载 `.exe`
- Apple Silicon Mac（M1、M2、M3、M4 等）：下载文件名含 `arm64` 的 `.dmg`
- Intel Mac：下载文件名含 `x64` 的 `.dmg`

Mac 用户可点击左上角苹果图标 →“关于本机”：显示“芯片 Apple M…”就选 arm64；
显示“处理器 Intel…”就选 x64。Mac 版要求 macOS 12 Monterey 或更高版本。

## Windows 安装

1. 下载 `Arkpets Desktop Pets.exe`。
2. 它是便携版，无需安装；将文件放进一个固定文件夹后双击运行。
3. 在选择器中点击角色即可启动桌宠。
4. 如果 Windows SmartScreen 出现提示，请先确认文件来自正式发布页并核对 SHA-256；确认一致后，
   可点击“更多信息”查看发布者和文件名，再决定是否运行。不要对来源不明的文件绕过警告。
5. 退出方法：右键桌宠 →“退出桌宠”，或按 `Alt+F4`。

Windows 校验 SHA-256（PowerShell）：

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath "C:\下载位置\Arkpets Desktop Pets.exe"
```

## macOS 安装

1. 根据芯片下载 `arm64.dmg` 或 `x64.dmg`。
2. 双击打开 DMG。
3. 将 `Arkpets Desktop Pets.app` 拖进 `Applications`（应用程序）文件夹。
4. 弹出 DMG，然后从“应用程序”打开 Arkpets。
5. 第一次启动时，macOS 会确认这是从互联网下载的应用；签名并经过 Apple 公证的正式版可以正常确认打开。
6. 退出方法：右键桌宠 →“退出桌宠”，或按 `Command + Q`。

Mac 校验 SHA-256（终端）：

```bash
shasum -a 256 ~/Downloads/Arkpets*.dmg
```

如果测试版尚未签名，macOS 可能阻止启动。仅在文件来自你确认可信的正式测试页且 SHA-256 一致时，
可以在 Finder 中按住 Control 点击应用 →“打开”；或前往“系统设置 → 隐私与安全性”查看“仍要打开”。
正式公开发布建议下载已签名和 Apple 公证的版本。

## 基本操作

- 左键单击：播放一次 Interact，然后回到 Relax。
- 左键双击：角色带 Special 时播放特殊动作，然后回到 Relax。
- 右键：切换 Relax、Sit、Sleep、Move，切换角色或退出。
- Move：桌宠跟随鼠标。
- Move 中单击：在当前位置停止并回到 Relax。
- Move 中按 WASD：控制移动方向。
- Shift + WASD：加速移动。

## 导入自己的桌宠

点击选择器底部的“导入桌宠”，一次选择同一角色的五个基础 WebM：

- `Relax`
- `Interact`
- `Sit`
- `Sleep`
- `Move`

如果角色还有特殊动作，可以同时选择第六个 `Special`。这些英文动作名必须出现在相应文件名中。
导入成功后角色会出现在选择器中；带 Special 的角色会显示“`双击 Special`”。

用户导入的角色卡片右上角有“删除”按钮。删除会清除该角色复制到本机的五个或六个 WebM，
不会删除你最初下载或保存的源素材文件。内置角色不能删除。

## 常见问题

### 是否需要 ChatGPT？

不需要。ChatGPT/Codex 只参与了开发过程，不是软件运行依赖。

### 为什么别人导入的角色没有跟着 EXE/DMG 一起出现？

用户后续导入的素材保存在各自电脑的应用数据目录，不会写回安装包。分享自定义角色时，
需要另外分享五个基础 WebM，以及该角色拥有时的 Special 文件。

### 双击为什么没有 Special？

只有素材库中包含 `Special.webm` 的角色才支持；其他角色仍按单击 Interact 使用。

### Mac 打不开怎么办？

先确认系统至少为 macOS 12、下载架构正确、文件来自正式发布页并且 SHA-256 一致。
如果正式签名版仍被 Gatekeeper 拦截，请将系统版本、芯片、文件名和提示截图反馈给作者。

## 同人项目声明

Arkpets 是非官方同人项目，仅供交流与个人使用。角色、名称与相关美术素材的权利归原权利方所有。
请勿将程序或素材用于商业用途、二次售卖或冒充官方发布。
