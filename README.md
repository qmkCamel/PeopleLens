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
npm run e2e:extension
npm run release:package
```

`validate` 会依次运行 OpenSpec 校验、Web 构建、Chrome Extension 类型检查、Chrome Extension 构建和发布资产检查。`e2e:extension` 会用 Lightpanda + Puppeteer Core 运行独立扩展侧栏 E2E；`release:package` 会生成 Chrome Extension zip；`dist/` 只作为支持页面和未来 Web 发布资产。

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

### 独立 E2E

```bash
npm run e2e:extension
```

E2E 会先构建 `extension-dist/`，再启动本地测试 harness 和 Lightpanda CDP server，通过 mock `chrome.tabs`、`chrome.scripting` 和 AI `fetch` 验证侧栏完整流程：缺少 API Key 拒绝、用户触发当前页抽取、AI 分析忙状态、结果渲染、保存人物、失败保留旧结果、短正文兜底。脚本优先使用 `LIGHTPANDA_BINARY` 或 PATH 上的 `lightpanda`；没有时会下载 nightly binary 到 `.tmp/lightpanda/`，并在运行时禁用 Lightpanda telemetry。

Lightpanda 不是 Chrome，不能验证扩展安装、`chrome://extensions`、真实 side panel 打开或 Chrome Web Store 权限弹窗；这些仍需要按上线清单做手动 Chrome smoke test。

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
