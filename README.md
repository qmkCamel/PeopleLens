# PeopleLens
阅读文章时自动生成“人物演员表”，帮你看懂谁是谁、谁和谁有关、为什么重要，并记住下次再遇到他们。

## Chrome Extension MVP

当前阶段是 AI-only、Extension-first MVP：PeopleLens 先以 Chrome 侧边栏作为主要测试入口，Web 应用仅保留为本地开发、配置验证和支持页面资产，不作为本阶段公开上线目标。

- AI 结构化：支持 Chat Completions 和 Responses API 两种协议，会把标题、来源和分句后的正文发送给所选服务商。
- DeepSeek 测试默认值：协议选择 Chat Completions，Base URL 填 `https://api.deepseek.com`，模型填 `deepseek-v4-flash`。
- 本地记忆：支持搜索、保存、清空和 JSON 导出。
- Chrome Extension MVP：支持右侧侧边栏、用户点击后读取当前页面、AI 分析当前页面、手动粘贴兜底。

### 本地启动

```bash
npm install
npm run dev
```

构建检查：

```bash
npm run build
```

完整上线前验证：

```bash
npm run validate
npm run release:package
```

`validate` 会依次运行 OpenSpec 校验、Web 构建、Chrome Extension 类型检查、Chrome Extension 构建和发布资产检查。`release:package` 会生成 Chrome Extension zip；`dist/` 只作为支持页面和未来 Web 发布资产。

### Chrome Extension MVP

构建扩展：

```bash
npm run build:extension
```

然后在 Chrome 打开 `chrome://extensions`：

1. 开启 Developer mode。
2. 点击 Load unpacked。
3. 选择 `extension-dist/`。

扩展使用 Manifest V3，页面权限限定为 `activeTab`、`scripting`、`sidePanel` 和 `storage`。AI 请求需要声明 `https://api.deepseek.com/*` 和 `https://api.openai.com/*` host permissions。扩展只在用户点击侧边栏按钮时读取当前页面，不做后台扫描。

### 微信文章测试

微信文章链接在命令行环境中可能触发验证页，MVP 不做自动抓取。测试时请在浏览器打开：

https://mp.weixin.qq.com/s/yPhd9bjl5UHFf58sgZLlaA

然后手动复制正文，粘贴到 PeopleLens 的正文输入区，点击“分析本文人物”。

AI 分析需要填写 API Key。API Key 只保存在当前浏览器或扩展本地；正式产品应改为服务端代理或临时令牌。Chrome Extension 当前支持 DeepSeek 和 OpenAI 官方 API 域名，其他兼容服务商需要更新 manifest host permissions 后重新打包。

## 文档

- [产品 MVP 设计](docs/product-mvp-design.md)
- [技术架构与工程设计](docs/technical-architecture.md)
- [上线检查清单](docs/launch-checklist.md)
- [发布指南](docs/release.md)
- [Chrome Web Store 文案草稿](docs/chrome-web-store-listing.md)
- [测试文章集](fixtures/README.md)
- [OpenSpec 项目上下文](openspec/project.md)
