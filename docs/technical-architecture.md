# PeopleLens 技术架构与工程设计

## 1. 工程目标

先把 PeopleLens 做成一个 AI-only Chrome Extension MVP，Web 保留为本地开发、手动粘贴调试和支持页面资产。

第一版需要证明：

- 真实页面正文可以被转化为结构化人物演员表。
- 人物卡片和关系摘要能真实改善阅读体验。
- 本地记忆可以识别之前见过或保存过的人物。

## 2. 推荐架构

长期建议使用共享核心包和两个薄应用壳：

```text
peoplelens/
  apps/
    web/                  # Web 支持面
    extension/            # Chrome Extension 主入口
  packages/
    core/                 # 抽取、排序、记忆、共享类型
    ui/                   # 可复用 UI 组件
  docs/
```

当前仓库还很轻，可以先从更简单的结构开始：

```text
PeopleLens/
  index.html
  src/
    app.ts
    analysis/
    memory/
    ui/
  docs/
```

等 Extension 开始开发时，再拆分为 `apps/` 和 `packages/`。

## 3. MVP 技术栈

### Web 支持面

- Vite。
- TypeScript。
- React。
- `localStorage` 管理 MVP 本地记忆和 AI 设置。
- 普通 CSS 或 CSS Modules。

### Chrome Extension MVP

- Chrome Extension Manifest V3。
- Side Panel API。
- Content Script，用于抽取网页正文。
- Service Worker，用于插件编排。
- Chrome Storage 或 IndexedDB，用于本地记忆。

### AI / NLP

MVP 用户可见分析支持一种模式：

1. AI 结构化模式
   - 使用用户自己的 API Key，或后续通过服务端代理。
   - 生成更高质量的人物角色、关系摘要和不确定性说明。
   - 渲染前必须校验结构化响应。
   - 只在用户主动点击分析后发送标题、来源和分句正文。

本地启发式代码可以作为内部实验和 fixture 回归工具保留，但不作为用户可见产品模式。

## 4. 高层数据流

```text
文章正文
  -> 清洗和分句
  -> AI 结构化分析
  -> 校验结构化响应
  -> 映射为文章内人物卡片和关系
  -> 和本地记忆比对
  -> 渲染人物演员表并保存遇见记录
```

Chrome Extension 数据流：

```text
用户点击插件
  -> 打开侧边栏
  -> Content Script 抽取当前页面正文
  -> 侧边栏把标题、来源和正文发送给配置的 AI Provider
  -> 校验结构化响应
  -> 分析结果保存到本地
  -> UI 渲染人物卡片和关系摘要
```

## 5. 浏览器插件组件

### Manifest

使用 Manifest V3。

最小权限：

- `sidePanel`
- `storage`
- `activeTab`
- `scripting`

MVP 避免宽泛的 host permissions。优先使用 `activeTab`，只在用户主动触发时访问当前页面。

### 侧边栏

职责：

- 展示当前页面标题和域名。
- 触发分析。
- 渲染人物卡片。
- 管理保存人物和本地记忆。
- 展示设置和隐私控制。

### Content Script

职责：

- 从当前页面抽取文章正文。
- 返回标题、URL、域名和必要元数据。
- 避免收集隐藏输入、表单内容、评论区、侧边栏和导航文本。

推荐正文抽取策略：

1. 优先读取 `article` 元素。
2. 其次使用 `main`、`[role="main"]` 和常见正文容器。
3. 按段落长度和文本密度打分。
4. 移除 nav、footer、script、style、aside。
5. 限制正文长度，控制成本和延迟。

### Service Worker

职责：

- 协调侧边栏和 Content Script。
- 保存插件设置。
- 处理后续安全的后台任务。

MVP 不做后台页面扫描。

## 6. 分析流水线

### 步骤 1：文本清洗

- 归一化空白字符。
- 保留句子边界。
- 保留段落分组。
- 粗略检测语言：英文、中文、混合。
- 移除样板文本和页面噪音。

### 步骤 2：分句

英文：

- 按句号、问号、感叹号等标点切分，并处理常见缩写。

中文：

- 按 `。！？；` 切分。

中英混合文章同时使用两套策略。

### 步骤 3：AI 结构化人物抽取

MVP 用户可见结果由 AI 结构化输出生成：

- 输入包含文章标题、来源 URL 和带 ID 的句子列表。
- 输出必须是 JSON，包含 people、relationships 和 uncertaintyNotes。
- 每个人物必须引用至少一个证据句 ID。
- 渲染前必须校验结构。

### 步骤 4：别名合并

规则由 AI 输出和本地归一化共同处理：

- 当上下文无歧义时，把英文全名和只出现姓氏的提及合并。
- 中文姓名以完整姓名精确匹配为主。
- 单独记录 aliases，不要丢失原文出现形式。
- 如果多个候选人共享同一个姓，不要自动合并。

### 步骤 5：重要性排序

AI 输出顺序作为基础排序，本地用提及次数、证据数量和保存状态辅助展示。

### 步骤 6：人物卡片生成

每张人物卡片由以下信息生成：

- 证据句。
- 姓名附近的职位和角色短语。
- 文章标题和上下文摘要。
- 本地记忆中的历史遇见。
- 可选 AI 增强结果。

UI 必须区分：

- 来自当前文章的事实。
- 来自本地记忆的信息。
- 来自外部资料的补全。
- 模型推断。

### 步骤 7：人物关系抽取

MVP 可以从同句共现开始：

- 如果两个人出现在同一句话中，把该句作为关系证据。
- 用轻量标签分类关系：
  - 同事/合作。
  - 共同创办。
  - 接任/替代。
  - 投资。
  - 批评/反对。
  - 竞争。
  - 法律争议。
  - 同时被提及。

AI 模式可以生成更自然的关系摘要，但必须引用证据句。

## 7. AI 结构化输出协议

使用严格 JSON 结构：

```json
{
  "people": [
    {
      "canonicalName": "Sam Altman",
      "aliases": ["Altman"],
      "identity": "OpenAI CEO",
      "articleRole": "在本文中代表 OpenAI 的平台战略。",
      "timeline": [
        "共同创办 OpenAI",
        "担任 OpenAI CEO",
        "推动 ChatGPT 商业化"
      ],
      "evidenceSentenceIds": ["s12", "s18"],
      "confidence": "high"
    }
  ],
  "relationships": [
    {
      "personNames": ["Sam Altman", "Elon Musk"],
      "label": "早期合作者",
      "summary": "两人曾在 OpenAI 早期有合作关系，后来在组织方向上产生分歧。",
      "evidenceSentenceIds": ["s22"],
      "confidence": "medium"
    }
  ],
  "uncertaintyNotes": [
    "文章信息不足，无法区分两个姓李的人物。"
  ]
}
```

校验规则：

- 拒绝格式错误的 JSON。
- 除非明确标记为外部资料增强，否则没有证据句的人物应被拒绝或降置信度。
- 限制卡片文案长度。
- 保留不确定性说明，不要静默丢弃。

## 8. 本地存储设计

Web 和 Extension 侧边栏都优先使用 IndexedDB。

### 数据表

`articles`

- id
- title 标题
- url 来源链接
- domain 来源域名
- createdAt 创建时间
- analyzedAt 分析时间
- textHash 正文哈希

`people`

- id
- canonicalName 标准姓名
- normalizedName 归一化姓名
- aliases 别名
- identity 身份
- avatarUrl 头像地址
- confidence 置信度
- createdAt 创建时间
- updatedAt 更新时间

`mentions`

- id
- articleId 文章 ID
- personId 人物 ID
- surfaceText 原文出现形式
- sentence 所在句子
- sentenceId 句子 ID
- importanceScore 重要性分数

`relationships`

- id
- articleId 文章 ID
- personIds 相关人物
- label 关系标签
- summary 摘要
- evidenceSentenceIds 证据句 ID
- confidence 置信度

`memory`

- personId 人物 ID
- saved 是否保存
- userNotes 用户笔记
- confusedWith 易混淆人物
- lastSeenAt 最近见到时间
- encounterCount 遇见次数

### 隐私默认值

保存文章元数据和抽取片段。默认不在分析后长期保存完整文章正文。

## 9. 外部资料增强策略

MVP 不强制外部资料增强。

后续添加时：

- 优先使用可信公开来源，并展示引用。
- 只缓存最小必要字段。
- 显示来源标签。
- 避免增强私人个体。
- 允许用户关闭外部查询。

头像策略：

1. 有引用的可信外部图片。
2. 用户自己添加的头像。
3. 首字母占位头像。

不要在没有版权和来源清晰度的情况下抓取任意搜索结果图片。

## 10. 前端 UX 架构

### 主要状态

- 空输入。
- 可以分析。
- 分析中。
- 已生成结果。
- 结果部分可用且有不确定性。
- 错误。
- 记忆库搜索。

### 组件

- `ArticleInput`
- `AnalyzeButton`
- `CastSidebar`
- `PersonCard`
- `PersonDetail`
- `RelationshipList`
- `MemoryBadge`
- `SourceBadge`
- `ExportMenu`
- `SettingsPanel`

### 设计方向

- 工作型阅读工具，不做营销页。
- 信息密度适中，界面安静。
- 桌面端双栏布局。
- 移动端单栏布局。
- 只把单个人物条目做成卡片，不把大区域层层套卡。
- 清晰展示来源和置信度。

## 11. API 与 Provider 设计

### 本地统一接口

```ts
analyzeArticleWithOpenAI(input: ArticleInput, settings: AiSettings): Promise<AnalysisResult>
```

用户可见 UI 调用 AI 结构化分析接口。本地启发式接口只用于内部实验或 fixture 回归。

### Provider 抽象

```ts
interface AnalysisProvider {
  analyze(input: ArticleInput, context: AnalysisContext): Promise<AnalysisResult>;
}
```

Provider 类型：

- `OpenAIProvider`
- 未来可加：`ServerProvider`

这样 MVP 可以先用用户配置的服务商运行，后续再切换为服务端代理或临时令牌。

## 12. 第一版项目结构

建议第一版：

```text
PeopleLens/
  README.md
  docs/
    product-mvp-design.md
    technical-architecture.md
  package.json
  index.html
  src/
    main.tsx
    styles.css
    analysis/
      analyzeArticle.ts
      extractCandidates.ts
      rankPeople.ts
      relationships.ts
      types.ts
    memory/
      db.ts
      memoryService.ts
    ui/
      ArticleInput.tsx
      CastSidebar.tsx
      PersonCard.tsx
      RelationshipList.tsx
```

## 13. 工程里程碑

### 里程碑 1：AI-only Extension MVP

- Manifest V3 Side Panel。
- 用户点击后抽取当前页面正文。
- AI 结构化人物抽取。
- 人物卡片。
- 关系列表。
- 本地保存/收藏。
- Markdown 导出。

### 里程碑 2：Web 支持面

- 粘贴文章调试入口。
- AI 设置验证。
- 支持页和政策页资产。

### 里程碑 4：记忆层

- 更好的姓名归一化和身份匹配。
- “之前见过”标记。
- 记忆库搜索。
- 删除和导出控制。

### 里程碑 5：质量与信任

- 测试文章集。
- 抽取逻辑回归测试。
- 输出质量人工评估。
- 隐私设置和域名禁用列表。

## 14. 测试策略

### 单元测试

- 分句。
- 候选人物抽取。
- 别名合并。
- 重要性排序。
- 人物关系抽取。
- 本地存储服务。

### Fixture 测试

维护文章样例：

- 英文科技/商业文章。
- 英文政治文章。
- 中文科技文章。
- 中文商业文章。
- 包含同姓歧义的文章。
- 包含容易被误判为人名的组织名。

每篇样例维护期望结果：

- Top 人物。
- 应排除的误判。
- 关键人物关系。

当前 fixture 脚本绑定本地启发式逻辑，因此只作为内部回归工具，不作为 AI-only 扩展发布门禁。

### UI 测试

- 空状态正常渲染。
- 分析流程可用。
- 保存/收藏可以持久化。
- “之前见过”标记出现。
- 导出的 Markdown 包含人物和关系。

### Extension 测试

- 能分析当前文章页面。
- 不在用户未触发时分析。
- 能处理没有正文的页面。
- 避开表单密集或私密页面。

## 15. 安全与隐私要求

- Extension MVP 避免宽泛站点权限。
- 用户触发前不读取页面内容。
- 默认不在敏感域名运行。
- 不采集输入框或私密编辑器内容。
- 遇到密码字段时跳过或提示。
- 提供本地数据删除和导出。
- 清晰展示 AI Provider 配置。

## 16. 关键技术风险

### 同名人物消歧

缓解方式：

- 展示不确定性。
- 使用文章上下文和来源域名辅助判断。
- 避免合并有歧义的姓氏简称。

### 外部履历错误

缓解方式：

- 展示来源标签。
- MVP 优先使用文章内信息。
- 外部增强后置。

### 页面正文抽取噪音

缓解方式：

- Extension 正文抽取只在用户点击后运行。
- 保留手动粘贴兜底。
- 对低信号页面显示可恢复错误，不覆盖已有结果。

### 隐私顾虑

缓解方式：

- 只在用户主动触发时分析。
- 本地优先记忆。
- MVP 不要求账号。
- 明确的数据控制入口。

### AI 幻觉

缓解方式：

- 结构化输出。
- 证据句 ID。
- 响应校验。
- 展示不确定性。

## 17. MVP 完成定义

MVP 完成时应满足：

- 用户可以粘贴真实文章并得到有用人物演员表。
- 初始测试文章集中 Top 人物大多正确。
- 每张人物卡都能解释人物在当前文章中的作用。
- 人物关系可读，并能引用文章证据。
- 保存的人物能在本地持久化。
- 同一个人物再次出现时能显示“之前见过”。
- 当前结果可导出为 Markdown。
- 隐私控制可见且可用。
