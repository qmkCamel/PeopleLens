# PeopleLens
阅读文章时自动生成“人物演员表”，帮你看懂谁是谁、谁和谁有关、为什么重要，并记住下次再遇到他们。

## Web MVP

当前阶段是双模式 Web MVP：粘贴文章正文后，PeopleLens 可以用本地规则或 AI 结构化模式抽取人物、生成证据卡片、整理人物关系，并用 `localStorage` 记录已见过和已保存的人物。

- 本地规则：不上传正文，不需要 API Key，但中文识别较粗。
- AI 结构化：支持 Chat Completions 和 Responses API 两种协议，会把标题、来源和分句后的正文发送给所选服务商，人物卡片质量更高。
- DeepSeek 测试默认值：协议选择 Chat Completions，Base URL 填 `https://api.deepseek.com`，模型填 `deepseek-v4-flash`。

### 本地启动

```bash
npm install
npm run dev
```

构建检查：

```bash
npm run build
```

### 微信文章测试

微信文章链接在命令行环境中可能触发验证页，MVP 不做自动抓取。测试时请在浏览器打开：

https://mp.weixin.qq.com/s/yPhd9bjl5UHFf58sgZLlaA

然后手动复制正文，粘贴到 PeopleLens 的正文输入区，点击“分析本文人物”。

如果本地规则效果较差，可以切换到“AI 结构化”模式，填写 API Key 后再分析。API Key 只保存在当前浏览器本地；正式产品应改为服务端代理或临时令牌。若浏览器直接请求某些服务商时遇到 CORS 限制，需要增加本地代理或后端代理。

## 文档

- [产品 MVP 设计](docs/product-mvp-design.md)
- [技术架构与工程设计](docs/technical-architecture.md)
