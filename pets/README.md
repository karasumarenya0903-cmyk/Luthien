# 明日方舟桌宠库

这个目录用于集中管理多个角色桌宠。

## 目录说明

- `_incoming/`：暂未归类的原始模型、立绘、截图和补充素材。
- `characters/`：每只桌宠的长期角色档案。建议使用英文小写 ID 建立子目录，例如 `amiya/`。
- `runs/`：`hatch-pet` 的制作运行目录，保存提示词、帧、图集与 QA 结果。
- `packages/`：已经完成、可安装的桌宠包；每只宠物包含 `pet.json` 和 `spritesheet.webp`。
- `shared/`：多只宠物共用的画风、尺寸或世界观参考素材。
- `catalog.json`：宠物总目录及当前素材状态。

## 单只宠物建议结构

```text
characters/<pet-id>/
  references/     # 角色立绘、模型截图、配色与道具参考
  notes.md        # 名称、造型约束、画风和动画备注
```

收到新角色素材后，先放入 `_incoming/<pet-id>/`；确认角色 ID 后再整理到
`characters/<pet-id>/references/`，随后在 `runs/<pet-id>/` 中制作。

