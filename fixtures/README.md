# PeopleLens 测试文章集

这个目录用于维护 MVP 质量评估文章。微信文章在命令行环境中经常返回验证页，因此先记录链接和采集状态；做人工评估时，在浏览器中打开链接并把正文复制到 PeopleLens 输入区。

## 字段说明

- `id`: 稳定样本 ID。
- `url`: 原文链接。
- `sourceType`: 来源类型，例如 `wechat`、`web`。
- `language`: 主要语言。
- `category`: 测试分类。
- `textStatus`: 正文采集状态，`needs_manual_copy` 表示需要人工复制正文。
- `textPath`: 已采集正文的本地 Markdown 路径。微信文章建议由 Obsidian Web Clipper 保存到 `fixtures/sources/` 后填写。
- `expected`: 人工评估时逐步补充的期望结果。

## 微信文章采集流程

1. 在 Chrome 中打开微信文章，确认正文完整显示。
2. 用 Obsidian Web Clipper 保存为 Markdown。
3. 将导出的 Markdown 放入 `fixtures/sources/`。
4. 把对应文章的 `textStatus` 改为 `ready`，并确认 `textPath` 指向该 Markdown 文件。

## 运行本地基线

```bash
npm run fixtures:analyze
```

脚本会读取所有 `textStatus` 为 `ready` 的文章，运行本地规则分析，并检查 `expected.topPeople` 和 `expected.excludedFalsePositives`。
