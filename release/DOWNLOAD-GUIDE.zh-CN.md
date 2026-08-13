# Arkpets 下载、安装与使用教程

## 下载前先看

Arkpets 是独立桌面程序，不需要安装 ChatGPT、Codex、Node.js 或其他开发工具，也不需要 OpenAI 账号或 API Key。

正式下载页：[GitHub Releases](https://github.com/karasumarenya0903-cmyk/Luthien/releases/latest)

请只从作者的正式发布页下载，并核对该版本公布的 SHA-256：

- Windows 10/11 64 位：下载 `.exe`
- 本项目目前不支持 macOS、Linux 或移动设备

## Windows 安装

1. 下载 `Arkpets.Desktop.Pets.exe`。
2. 它是便携版，无需安装；将文件放进一个固定文件夹后双击运行。
3. 在选择器中点击角色即可启动桌宠。
4. 如果 Windows SmartScreen 出现提示，请先确认文件来自正式发布页并核对 SHA-256；确认一致后，
   可点击“更多信息”查看发布者和文件名，再决定是否运行。不要对来源不明的文件绕过警告。
5. 退出方法：右键桌宠 →“退出桌宠”，或按 `Alt+F4`。

Windows 校验 SHA-256（PowerShell）：

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath "C:\下载位置\Arkpets.Desktop.Pets.exe"
```

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

### 为什么别人导入的角色没有跟着 EXE 一起出现？

用户后续导入的素材保存在各自电脑的应用数据目录，不会写回安装包。分享自定义角色时，
需要另外分享五个基础 WebM，以及该角色拥有时的 Special 文件。

### 双击为什么没有 Special？

只有素材库中包含 `Special.webm` 的角色才支持；其他角色仍按单击 Interact 使用。

## 同人项目声明

Arkpets 是非官方同人项目，仅供交流与个人使用。角色、名称与相关美术素材的权利归原权利方所有。
请勿将程序或素材用于商业用途、二次售卖或冒充官方发布。
