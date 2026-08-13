# 制作记录

## 角色信息

- 显示名称：Angelina the Mellow Wish
- 角色：明日方舟「予愿安洁莉娜」
- 素材套装：默认 / 基建 / x1
- 初始及默认形态：`relax`

## 动画映射

| 状态 | 素材 | 播放方式 |
| --- | --- | --- |
| interact | `interact.webm` | 单次；结束后回到当前基础形态 |
| sit | `sit.webm` | 循环 |
| sleep | `sleep.webm` | 循环 |
| relax | `relax.webm` | 循环；初始及默认形态 |
| move | `move.webm` | 循环；启用移动控制 |

## 交互约定

1. 左键单击桌宠时完整播放一次 `interact`。
2. `interact` 播放完成后固定回到默认 `relax`，不会切换到其他姿态。
3. `sit`、`sleep`、`relax` 和 `move` 通过右键菜单手动选择。
4. `move` 模式默认跟随鼠标指针。
5. `move` 模式下按住 WASD 时，键盘方向临时覆盖鼠标跟随；松开所有方向键后恢复跟随。
6. 按住任一 Shift 键时，键盘移动速度为普通速度的 2 倍。

## 后续步骤

- Windows 多桌宠运行时已经实现并通过透明 WebM 渲染检查。
- 共享便携版成品位于 `../../packages/arkpets-desktop-pets/Arkpets Desktop Pets.exe`。
- 播放器使用预解码的冻结/替换关键帧，避免 `relax ↔ interact` 切换时的双层增亮和透明空帧。

## 运行验证

- 五个 WebM 均能被 Chromium 解码，画布均为 1000×1000。
- 默认 `relax` 的透明窗口截图通过 alpha 通道检查。
- 形态循环、对角线归一化、Shift 2 倍速、鼠标跟随和平面边界测试全部通过。
- 便携 EXE 双击等价测试持续运行 12 秒，进程保持稳定。
