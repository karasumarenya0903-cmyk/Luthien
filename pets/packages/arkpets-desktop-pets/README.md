# Arkpets Desktop Pets 3.2.0

双击 `Arkpets Desktop Pets.exe`，在启动窗口中选择桌宠。

当前包含：

- Angelina the Mellow Wish（予愿安洁莉娜）
- Lemuen（蕾缪安）
- Amiya — Apprentice Connector（阿米娅·见习联结者，含 Special）

## 操作

- 左键：播放一次 `interact`，结束后平滑回到 `relax`
- 双击左键：角色含 `special` 时播放一次，结束后平滑回到 `relax`
- 右键：选择 `relax`、`sit`、`sleep` 或 `move`
- 右键 → 切换桌宠：返回角色选择器
- `move`：自动跟随鼠标
- `move` 中左键桌宠：在当前位置退出移动并回到 `relax`
- WASD：键盘移动；Shift + WASD：2 倍速度
- `Alt+F4`：退出

选择器会从每只桌宠的 `relax` 动画中段生成透明角色图标，随后释放图标视频解码器以节省内存。

“导入桌宠”支持选择一套含 `Relax`、`Interact`、`Sit`、`Sleep`、`Move` 的五个基础 WebM，
并可额外选择一个 `Special`；
导入内容保存在当前 Windows 用户的应用数据目录。
导入角色的卡片右上角有“删除”按钮，确认后会删除其五个或六个 WebM 并释放本地空间；内置角色不可删除。

普通切换使用 220ms 收缩/替换/舒展关键帧。`interact` 返回 `relax` 使用 560ms、七个阶段的
互补遮罩关键帧，让互动末帧逐段交给默认动作首帧，避免硬切和透明空帧。
`special` 进入与返回 `relax` 时沿用同一套衔接。

内置三只桌宠已封装在 EXE 中，分享该 EXE 即可使用；用户自行导入的桌宠不会写回 EXE，
需要另行分享五个基础 WebM，以及角色拥有时的可选 `Special` 文件。

```text
SHA-256 3B09A26B68A72560AF30FC3BF1D07DEE4A59FED91F15D3EE09993E1B65D80710
```
