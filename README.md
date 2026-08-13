# Luthien / Arkpets Desktop Pets

Arkpets是一个支持明日方舟多角色的 Windows 桌宠程序。内置桌宠干员包括初始的予愿安洁莉娜、蕾缪安和阿米娅·见习联结者，用户也可自行导入自己喜欢的干员当桌宠。

## 下载与运行

用户无需安装 ChatGPT、Codex、Node.js，也不需要 OpenAI 账号或 API Key。请前往本仓库的 [**Releases**](https://github.com/karasumarenya0903-cmyk/Luthien/releases/latest) 页面下载对应系统的安装包：

- Windows 64 位：下载 `Arkpets.Desktop.Pets.exe`，双击即可运行，无需安装。
本项目目前仅支持 Windows 10/11 64 位，不提供 macOS 版本。

更完整的中文下载说明见 [`release/DOWNLOAD-GUIDE.zh-CN.md`](release/DOWNLOAD-GUIDE.zh-CN.md)。

## 操作方式

- 单击桌宠：戳一下干员，播放 `interact`，然后回到`relax`。
- 双击桌宠：触发有时装干员的时装专属动作，仅在干员包含 `special` 时播放特殊动作，然后回到`relax`。
- 右键桌宠：切换 `relax`、`sit`、`sleep`、`move`，或切换角色、导入/删除自定义桌宠。
- `move` 模式：桌宠跟随鼠标；单击会在原地退出并回到 `relax`。
- `WASD`：在 `move` 模式中控制方向；按住 `Shift` 加速。

## 用户导入桌宠

用户可以自行前往明日方舟中文 Wiki 下载想导入干员模型的 WebM 文件。网址：https://prts.wiki/w/%E9%A6%96%E9%A1%B5

以予愿安洁莉娜为例，在“干员模型”中选择“基建”模型组，下载 `Relax`、`Interact`、`Sit`、`Sleep`、`Move` 的五个 WebM 文件；若下载的是某干员的时装模型，可以选择多下载一个名为`Special`的 WebM 文件，无需重命名文件。

<img width="1508" height="996" alt="image" src="https://github.com/user-attachments/assets/72639b21-5dcb-4a00-a384-5bd883e77e08" />

导入时需要选择文件名中分别包含 `Relax`、`Interact`、`Sit`、`Sleep`、`Move` 的五个 WebM 文件；`Special` 为可选文件。用户导入的干员可以在选择面板中删除，内置干员不可删除。

## 趣味玩法

- 用户可以在游戏端外摸摸自己喜欢的干员进行互动，无需 Miss.Christine 的摸摸券。
- 可以让干员陪着自己办公，比如累得要死的时候可以躺板板。
<img width="1306" height="602" alt="224136d8dd9b26b61e3d21673162f370" src="https://github.com/user-attachments/assets/bd3b2569-8fdb-4aca-b546-14376c226232" />
- 可以在桌面上体验奇象巡展的轮椅竞速、电瓶车、跺脚、随地大小坐……还可以高速飙车。

## 本地开发

```powershell
cd desktop-app
pnpm install
pnpm run verify:assets
pnpm test
pnpm start
```

Windows 打包：`pnpm run dist:win`。

## 素材与授权提示

本项目自身标记为 `UNLICENSED`。角色名称、形象及素材的权利归其各自权利人所有；公开分发或商业使用前，请确保你拥有相应素材的使用与再分发许可。
