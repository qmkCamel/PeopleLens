import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Defuddle } from "defuddle/node";
import { parseHTML } from "linkedom";
import { chromium } from "playwright";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const extensionDir = resolve(repoRoot, "extension-dist");
const userDataDir = resolve(repoRoot, ".tmp/playwright-infoq-extension-profile");
const reportDir = resolve(repoRoot, "reports/infoq-year-hotlist-2026-06-07");
const screenshotDir = resolve(reportDir, "screenshots");
const hotlistUrl = "https://www.infoq.cn/hotlist?tag=year";
const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const selectedArticles = [
  {
    rank: 1,
    slug: "01-agent-expensive-error",
    title: "编程 Agent 可能是软件开发史上最昂贵的错误之一",
    url: "https://www.infoq.cn/article/oDaj3oKLwc8MiprLcxhs",
    selectionReason: "年度热榜第 1；人物观点强，包含 AI Agent、模型、公司和人物的混合干扰。",
    expectedPeople: [
      {
        canonicalName: "George Hotz",
        aliases: ["Hotz"],
        identity: "comma.ai 创办人、AI 编程 Agent 批评者",
        articleRole: "提出 AI 编程 Agent 可能带来高昂代价的核心观点。",
        timeline: ["破解 iPhone 和 PlayStation 3，后创办 comma.ai。"],
      },
      {
        canonicalName: "Andrej Karpathy",
        aliases: ["Karpathy"],
        identity: "AI 研究者、Anthropic 成员",
        articleRole: "作为支持 AI Agent 改变软件开发的对照观点出现。",
        timeline: ["公开表示 AI Agent 已经改变软件开发。"],
      },
    ],
  },
  {
    rank: 3,
    slug: "02-opus-benchmark-dispute",
    title: "Opus 4.8 刚发布，Redis 之父质疑跑分：DHH 盛赞的 GPT-5.5，正在动摇编码王座",
    url: "https://www.infoq.cn/article/rCTXhK96Y3jiDG7N1is5",
    selectionReason: "模型发布、跑分争议和开发者人物并存，可检查产品/模型名不会被当成人物。",
    expectedPeople: [
      {
        canonicalName: "antirez",
        aliases: ["Redis 之父"],
        identity: "Redis 创始人",
        articleRole: "质疑模型跑分与实际编码表现之间的差异。",
        timeline: ["以 Redis 之父身份参与模型能力讨论。"],
      },
      {
        canonicalName: "DHH",
        aliases: ["David Heinemeier Hansson"],
        identity: "Ruby on Rails 创始人",
        articleRole: "在文章中作为 GPT-5.5 编码能力的支持者出现。",
        timeline: ["公开评价 AI 编码模型表现。"],
      },
    ],
  },
  {
    rank: 4,
    slug: "03-deepseek-v4-open-source",
    title: "DeepSeek V4 重磅开源！首次打通华为 Ascend，也没丢掉英伟达，百万上下文夺回国产模型话语权",
    url: "https://www.infoq.cn/article/wUUPEzvNajcaVN0k7HPF",
    selectionReason: "模型、芯片平台和企业名密集，用来验证 PeopleLens 对人物少、组织多文章的表现。",
    expectedPeople: [
      {
        canonicalName: "梁文锋",
        aliases: [],
        identity: "DeepSeek 创始人",
        articleRole: "作为 DeepSeek 相关战略和开源背景中的关键人物出现。",
        timeline: ["DeepSeek 相关模型发布背景中被提及。"],
      },
    ],
  },
  {
    rank: 11,
    slug: "04-google-ceo-ai-belief",
    title: "前 CEO 被学生嘘“别吹 AI”，现 CEO 被追问“会不会被 AI 取代”：谷歌两代掌门人的 AI 信仰，同时被质疑",
    url: "https://www.infoq.cn/article/Us2wfr7Wx3sdb1RGoDY6",
    selectionReason: "人物密度高，涉及现任/前任 CEO、AI 负责人和 Google 产品体系。",
    expectedPeople: [
      {
        canonicalName: "Sundar Pichai",
        aliases: ["Pichai"],
        identity: "Google CEO",
        articleRole: "回应 AI 对 Google 业务和职位替代的追问。",
        timeline: ["以 Google CEO 身份参与 AI 相关公开访谈。"],
      },
      {
        canonicalName: "Eric Schmidt",
        aliases: ["Schmidt"],
        identity: "Google 前 CEO",
        articleRole: "代表 Google 早期管理层的 AI 信仰与争议。",
        timeline: ["以 Google 前 CEO 身份在文章中被讨论。"],
      },
      {
        canonicalName: "Demis Hassabis",
        aliases: ["Hassabis"],
        identity: "Google DeepMind 负责人",
        articleRole: "出现在 Google AI 叙事和组织背景中。",
        timeline: ["参与 Google AI 相关战略语境。"],
      },
    ],
  },
  {
    rank: 17,
    slug: "05-robot-lwd-interview",
    title: "对话罗剑岚：把机器人“部署”本身变成训练的一部分",
    url: "https://www.infoq.cn/article/9qNdzFNpb66rcCfKhNFe",
    selectionReason: "访谈型文章，核心人物明确，能验证中文姓名、身份和证据句展示。",
    expectedPeople: [
      {
        canonicalName: "罗剑岚",
        aliases: [],
        identity: "上海创智学院副教授、智元机器人首席科学家",
        articleRole: "披露 LWD 方法的技术设计和后续演进方向。",
        timeline: ["发布 LWD（Learning While Deploying）方法。"],
      },
      {
        canonicalName: "华卫",
        aliases: [],
        identity: "InfoQ 作者",
        articleRole: "采访并撰写机器人 LWD 技术实践。",
        timeline: ["作为作者出现在文章署名中。"],
      },
    ],
  },
  {
    rank: 18,
    slug: "06-github-survival-battle",
    title: "GitHub 面临生存之战！多位员工曝内部乱象：独立文化要没了，封杀 Claude Code 才能“活”",
    url: "https://www.infoq.cn/article/VZ4KvkToY57zj0ycsdBF",
    selectionReason: "公司、竞品和多名高管/员工混合，适合测试人物关系和组织噪声。",
    expectedPeople: [
      {
        canonicalName: "Vlad Fedorov",
        aliases: ["Vlad"],
        identity: "GitHub 首席技术官",
        articleRole: "对 GitHub 平台宕机问题公开致歉并解释容量规划问题。",
        timeline: ["以 GitHub CTO 身份回应平台稳定性问题。"],
      },
      {
        canonicalName: "Thomas Dohmke",
        aliases: ["Dohmke"],
        identity: "GitHub CEO",
        articleRole: "出现在 GitHub 管理和产品竞争压力语境中。",
        timeline: ["作为 GitHub CEO 被文章提及。"],
      },
      {
        canonicalName: "Satya Nadella",
        aliases: ["Nadella"],
        identity: "Microsoft CEO",
        articleRole: "作为 Microsoft 与 GitHub 关系背景中的关键管理者出现。",
        timeline: ["以 Microsoft CEO 身份出现在 GitHub 组织背景中。"],
      },
    ],
  },
];

await rm(userDataDir, { force: true, recursive: true });
await rm(reportDir, { force: true, recursive: true });
await mkdir(userDataDir, { recursive: true });
await mkdir(screenshotDir, { recursive: true });

let context;
const aiRequests = [];
const articleResults = [];
let failNextRequest = false;

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    acceptDownloads: true,
    channel: "chromium",
    headless: process.env.PLAYWRIGHT_HEADLESS !== "0",
    viewport: { width: 1280, height: 900 },
    userAgent,
    args: [`--disable-extensions-except=${extensionDir}`, `--load-extension=${extensionDir}`],
  });

  await context.route("https://api.deepseek.com/**", async (route) => {
    const body = route.request().postData() ?? "";
    aiRequests.push(body);
    await delay(850);
    if (failNextRequest) {
      failNextRequest = false;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { message: "模拟 InfoQ 批量测试 AI 失败" } }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        choices: [{ message: { content: JSON.stringify(makeMockAiPayload(body)) } }],
      }),
    });
  });

  const hotlistPage = await context.newPage();
  await hotlistPage.goto(hotlistUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await hotlistPage.waitForTimeout(6_000);
  const hotlistArticles = await scrapeHotlistArticles(hotlistPage);
  await hotlistPage.screenshot({
    path: resolve(screenshotDir, "00-infoq-hotlist-year.png"),
    fullPage: true,
  });
  await hotlistPage.close();

  const extensionId = await getExtensionId(context);
  const extensionPage = await context.newPage();
  await extensionPage.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await waitForText(extensionPage, "当前页面人物");
  await extensionPage.evaluate(() => localStorage.clear());

  let requestCount = 0;
  for (const articleConfig of selectedArticles) {
    const sourcePage = await context.newPage();
    const article = await loadRenderedInfoqArticle(sourcePage, articleConfig);
    await sourcePage.screenshot({
      path: resolve(screenshotDir, `${articleConfig.slug}-article.png`),
      fullPage: false,
    });
    await sourcePage.close();

    await fillControlByLabel(extensionPage, "API Key", "infoq-e2e-mock-key");
    await fillControlByLabel(extensionPage, "文章标题", article.title);
    await fillControlByLabel(extensionPage, "来源 URL", article.url);
    await fillControlByLabel(extensionPage, "正文", article.text);

    await clickButton(extensionPage, "分析粘贴正文");
    await waitForText(extensionPage, "AI 分析中");
    assert.equal(await isAnyButtonDisabled(extensionPage, "AI 分析中"), true);

    const editedUrl = `${article.url}?during-analysis=editable`;
    await fillControlByLabel(extensionPage, "来源 URL", editedUrl);
    assert.equal(await controlValueByLabel(extensionPage, "来源 URL"), editedUrl);

    for (const person of articleConfig.expectedPeople) {
      await waitForPersonCard(extensionPage, person.canonicalName);
    }
    await waitForRelationshipState(extensionPage, articleConfig.expectedPeople.length > 1 ? "条关系线索" : "关系摘要");
    await waitForAnalysisIdle(extensionPage);
    await fillControlByLabel(extensionPage, "来源 URL", article.url);

    const resultScreenshot = resolve(screenshotDir, `${articleConfig.slug}-peoplelens-result.png`);
    await extensionPage.screenshot({ path: resultScreenshot, fullPage: true });

    requestCount += 1;
    assert.equal(aiRequests.length, requestCount);
    assert.equal(aiRequests.at(-1).includes(article.title), true);
    assert.equal(aiRequests.at(-1).includes(article.url), true);
    assert.equal(aiRequests.at(-1).includes("句子列表"), true);
    assert.equal(await isAnyButtonDisabled(extensionPage, "导出"), false);

    articleResults.push({
      ...articleConfig,
      actualTitle: article.title,
      extractedCharacters: article.text.length,
      extractionEngine: article.extractionEngine,
      expectedPeople: articleConfig.expectedPeople.map((person) => person.canonicalName),
      articleScreenshot: `screenshots/${articleConfig.slug}-article.png`,
      resultScreenshot: `screenshots/${articleConfig.slug}-peoplelens-result.png`,
      status: "passed",
    });
  }

  const download = await triggerDownload(extensionPage, "导出");
  assert.match(download.suggestedFilename(), /人物演员表\.md$/);

  await clickFirstSaveButton(extensionPage);
  await waitForText(extensionPage, "已保存");

  failNextRequest = true;
  await clickButton(extensionPage, "分析粘贴正文");
  await waitForText(extensionPage, "模拟 InfoQ 批量测试 AI 失败");
  await waitForPersonCard(extensionPage, selectedArticles.at(-1).expectedPeople[0].canonicalName);
  await waitForAnalysisIdle(extensionPage);
  assert.equal(await isAnyButtonDisabled(extensionPage, "导出"), false);
  await extensionPage.screenshot({
    path: resolve(screenshotDir, "99-failure-preserves-last-result.png"),
    fullPage: true,
  });
  requestCount += 1;
  assert.equal(aiRequests.length, requestCount);

  await writeFile(resolve(reportDir, "articles.json"), JSON.stringify(articleResults, null, 2));
  await writeFile(resolve(reportDir, "README.md"), makeReport({ hotlistArticles, articleResults }));

  await extensionPage.close();
  console.log(`InfoQ hotlist extension E2E passed. Report: ${resolve(reportDir, "README.md")}`);
} finally {
  await context?.close();
  await rm(userDataDir, { force: true, recursive: true });
}

async function scrapeHotlistArticles(page) {
  return page.locator('a[href*="/article/"]').evaluateAll((links) =>
    links
      .map((link, index) => ({
        rank: index + 1,
        title: link.textContent?.replace(/\s+/g, " ").trim() ?? "",
        url: link.href,
      }))
      .filter((item) => item.title && item.url)
      .slice(0, 30),
  );
}

async function loadRenderedInfoqArticle(page, articleConfig) {
  await page.goto(articleConfig.url, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForFunction(() => document.querySelector("article")?.textContent?.length > 600, null, {
    timeout: 20_000,
  });
  const fallbackArticle = await page.evaluate(() => {
    const title = document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() || document.title.trim();
    const articleElement = document.querySelector("article") ?? document.body;
    const text = articleElement.innerText
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 80_000);
    return { title, url: window.location.href, text };
  });
  const article = await extractWithDefuddle(page, fallbackArticle);
  assert.equal(compactText(article.title).includes(compactText(articleConfig.title).slice(0, 10)), true);
  assert.ok(article.text.length >= 600, `${articleConfig.slug} extracted text is too short`);
  return article;
}

async function extractWithDefuddle(page, fallbackArticle) {
  const html = await page.content();
  const { document } = parseHTML(html);
  const parsed = await Defuddle(document, fallbackArticle.url, { markdown: true });
  const text = normalizeExtractedText(parsed.content);
  if (!text || text.length < 600) {
    return { ...fallbackArticle, extractionEngine: "dom-fallback" };
  }
  return {
    title: parsed.title?.trim() || fallbackArticle.title,
    url: fallbackArticle.url,
    text: text.slice(0, 80_000),
    extractionEngine: "defuddle",
  };
}

function normalizeExtractedText(text) {
  if (typeof text !== "string" || !text.trim()) {
    return "";
  }
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function compactText(text) {
  return text.replace(/\s+/g, "");
}

function makeMockAiPayload(postData) {
  const prompt = extractUserPrompt(postData);
  const article = selectedArticles.find((candidate) => {
    const articleId = candidate.url.split("/").at(-1);
    return prompt.includes(candidate.url) || (articleId ? prompt.includes(articleId) : false);
  });
  assert.ok(article, "AI mock could not map request to a selected InfoQ article");
  const sentences = parsePromptSentences(prompt);
  const people = article.expectedPeople.map((person, index) => {
    const evidenceSentenceIds = findEvidenceSentenceIds(sentences, person).slice(0, 3);
    return {
      canonicalName: person.canonicalName,
      aliases: person.aliases,
      identity: person.identity,
      articleRole: person.articleRole,
      timeline: person.timeline,
      evidenceSentenceIds: evidenceSentenceIds.length ? evidenceSentenceIds : [sentences[0]?.id ?? "s1"],
      confidence: evidenceSentenceIds.length ? "high" : "medium",
      _index: index,
    };
  });
  const relationships = makeRelationships(article, sentences);
  return {
    people: people.map(({ _index, ...person }) => person),
    relationships,
    uncertaintyNotes: ["InfoQ 批量 E2E 使用确定性 AI mock；用于验证扩展流程、结构化渲染和状态处理。"],
  };
}

function extractUserPrompt(postData) {
  const body = JSON.parse(postData);
  const content = body.messages?.find((message) => message.role === "user")?.content;
  assert.equal(typeof content, "string");
  return content;
}

function parsePromptSentences(prompt) {
  return prompt
    .split("\n")
    .map((line) => line.match(/^(s\d+):\s*(.+)$/))
    .filter((match) => Boolean(match))
    .map((match) => ({ id: match[1], text: match[2] }));
}

function findEvidenceSentenceIds(sentences, person) {
  const names = [person.canonicalName, ...person.aliases].filter(Boolean);
  return sentences
    .filter((sentence) => names.some((name) => sentence.text.includes(name)))
    .map((sentence) => sentence.id);
}

function makeRelationships(article, sentences) {
  if (article.expectedPeople.length < 2) {
    return [];
  }
  const [first, second] = article.expectedPeople;
  const evidence =
    sentences.find(
      (sentence) =>
        [first.canonicalName, ...first.aliases].some((name) => sentence.text.includes(name)) &&
        [second.canonicalName, ...second.aliases].some((name) => sentence.text.includes(name)),
    ) ??
    sentences.find((sentence) => sentence.text.includes(first.canonicalName) || sentence.text.includes(second.canonicalName)) ??
    sentences[0];
  return [
    {
      people: [first.canonicalName, second.canonicalName],
      label: "同文观点线索",
      summary: `${first.canonicalName} 与 ${second.canonicalName} 在同一篇 InfoQ 热榜文章中形成观点、组织或背景上的关联。`,
      evidenceSentenceIds: [evidence?.id ?? "s1"],
      confidence: "medium",
    },
  ];
}

function makeReport({ hotlistArticles, articleResults }) {
  const selectedRows = articleResults
    .map(
      (article) =>
        `| ${article.rank} | [${article.title}](${article.url}) | ${article.extractedCharacters} | ${article.extractionEngine} | ${article.expectedPeople.join("、")} | ${article.selectionReason} | ${article.status} |`,
    )
    .join("\n");
  const screenshotRows = articleResults
    .map(
      (article) => [
        `### ${article.rank}. ${article.title}`,
        `![InfoQ article](${article.articleScreenshot})`,
        `![PeopleLens result](${article.resultScreenshot})`,
      ].join("\n\n"),
    )
    .join("\n\n");
  const hotlistRows = hotlistArticles
    .slice(0, 23)
    .map((article) => `${article.rank}. [${article.title}](${article.url})`)
    .join("\n");

  return [
    "# InfoQ 年度热榜真实文章扩展 E2E 测试报告",
    "",
    `测试日期：2026-06-07`,
    `来源页面：[InfoQ 年度热榜](${hotlistUrl})`,
    `执行命令：\`npm run e2e:extension:infoq\``,
    "",
    "## 结论",
    "",
    "通过。Chromium 成功打开 InfoQ 年度热榜和 6 篇真实文章，PeopleLens Chrome 扩展完成真实正文粘贴分析、AI 请求拦截、人物卡片渲染、关系渲染、导出、保存、失败保留旧结果等流程。",
    "",
    "AI 服务说明：本次未使用真实外部 API Key；浏览器正文、扩展页面、用户交互和网络请求路径是真实运行，AI 响应用确定性 mock 拦截，目的是稳定验证扩展流程和结构化结果渲染，不评价真实模型抽取质量。",
    "",
    "## 选文标准",
    "",
    "- 必须出现在当前 `https://www.infoq.cn/hotlist?tag=year` 可见年度热榜中。",
    "- Chromium 能打开文章页并从真实 DOM 抽取至少 600 字正文。",
    "- 正文抽取优先使用 Obsidian Web Clipper 同源思路的 `defuddle/node`，并保留 DOM fallback。",
    "- 覆盖不同主题：AI 编程、模型发布、AI 领导者争议、机器人训练、GitHub/Microsoft 生态。",
    "- 至少包含一个明确人物信号，且尽量包含公司、模型、产品名等非人物干扰。",
    "- 优先选择人物关系或观点冲突清晰的文章，便于验证证据句和关系线索 UI。",
    "",
    "## 热榜采样",
    "",
    "![InfoQ hotlist](screenshots/00-infoq-hotlist-year.png)",
    "",
    hotlistRows,
    "",
    "## 选择的 6 篇文章",
    "",
    "| 热榜序号 | 文章 | 抽取字符数 | 抽取引擎 | 期望人物 | 选择理由 | 状态 |",
    "| --- | --- | ---: | --- | --- | --- | --- |",
    selectedRows,
    "",
    "## 覆盖的扩展行为",
    "",
    "- 真实 InfoQ 页面打开和截图。",
    "- 从渲染后的页面 HTML 使用 `defuddle/node` 抽取真实正文。",
    "- Chrome 扩展 side panel 打开、API Key 输入、标题/URL/正文输入。",
    "- 点击“分析粘贴正文”后出现 `AI 分析中...`，触发按钮禁用。",
    "- 分析期间编辑“来源 URL”，验证非相关输入仍可交互。",
    "- AI mock 返回 PeopleLens 要求的 JSON 结构，扩展渲染人物卡片和关系线索。",
    "- 验证请求体包含文章标题、来源 URL 和 `句子列表`。",
    "- 导出 Markdown 下载文件名匹配 `人物演员表.md`。",
    "- 保存人物后出现 `已保存`。",
    "- 模拟 AI 失败后旧人物结果仍可见，导出按钮保持可用。",
    "",
    "## 截图",
    "",
    screenshotRows,
    "",
    "### 失败保留旧结果",
    "",
    "![Failure preserves last result](screenshots/99-failure-preserves-last-result.png)",
    "",
    "## 风险与限制",
    "",
    "- 没有使用真实 AI provider，因此不能把本报告作为模型抽取准确率验收。",
    "- InfoQ 页面含活动横幅和站点导航，本测试保留这些真实页面噪声以贴近扩展实际输入。",
    "- 当前批量测试覆盖“粘贴正文”路径；“分析当前页面”路径由既有 `e2e:extension:chromium` harness 覆盖。",
    "",
  ].join("\n");
}

async function getExtensionId(context) {
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker", { timeout: 15_000 });
  }
  const extensionId = serviceWorker.url().split("/")[2];
  assert.ok(extensionId, `Could not resolve extension id from ${serviceWorker.url()}`);
  return extensionId;
}

async function waitForText(page, text) {
  await page.waitForFunction((expected) => document.body?.textContent?.includes(expected), text, {
    timeout: 30_000,
  });
}

async function waitForPersonCard(page, name) {
  await page.waitForFunction(
    (expectedName) =>
      [...document.querySelectorAll(".person-list .person-card h3")].some(
        (heading) => heading.textContent?.trim() === expectedName,
      ),
    name,
    { timeout: 30_000 },
  );
}

async function waitForRelationshipState(page, text) {
  await page.waitForFunction(
    (expected) => document.querySelector(".relationship-panel")?.textContent?.includes(expected),
    text,
    { timeout: 30_000 },
  );
}

async function waitForAnalysisIdle(page) {
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("button")].some(
        (button) => button.textContent?.includes("分析粘贴正文") && !button.disabled,
      ),
    null,
    { timeout: 30_000 },
  );
}

async function clickButton(page, text) {
  const clicked = await page.evaluate((expected) => {
    const button = [...document.querySelectorAll("button")].find((item) => item.textContent.includes(expected));
    if (!button) {
      return false;
    }
    button.click();
    return true;
  }, text);
  assert.equal(clicked, true, `Button not found: ${text}`);
}

async function clickFirstSaveButton(page) {
  const clicked = await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((item) => item.textContent.includes("保存"));
    if (!button) {
      return false;
    }
    button.click();
    return true;
  });
  assert.equal(clicked, true, "Save button not found");
}

async function fillControlByLabel(page, labelText, value) {
  const changed = await page.evaluate(
    ({ labelText: expected, value: nextValue }) => {
      const label = [...document.querySelectorAll("label")].find((item) => item.textContent.includes(expected));
      const control = label?.querySelector("input, textarea");
      if (!control) {
        return false;
      }
      const prototype = control instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
      valueSetter?.call(control, nextValue);
      control.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    },
    { labelText, value },
  );
  assert.equal(changed, true, `Control not found: ${labelText}`);
}

async function controlValueByLabel(page, labelText) {
  return page.evaluate((expected) => {
    const label = [...document.querySelectorAll("label")].find((item) => item.textContent.includes(expected));
    const control = label?.querySelector("input, textarea");
    return control?.value ?? "";
  }, labelText);
}

async function isAnyButtonDisabled(page, ...texts) {
  return page.evaluate((expectedTexts) => {
    const button = [...document.querySelectorAll("button")].find((item) =>
      expectedTexts.some((expected) => item.textContent.includes(expected)),
    );
    return button?.disabled ?? false;
  }, texts);
}

async function triggerDownload(page, buttonText) {
  const downloadPromise = page.waitForEvent("download", { timeout: 15_000 });
  await clickButton(page, buttonText);
  return downloadPromise;
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}
