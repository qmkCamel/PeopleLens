import { createServer } from "node:http";
import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import net from "node:net";
import { chromium } from "playwright";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const extensionDir = resolve(repoRoot, "extension-dist");
const userDataDir = resolve(repoRoot, ".tmp/playwright-extension-profile");
const articleText =
  "张三创办了示例公司，并邀请李四担任首席技术官。李四随后与王五合作推进产品发布。张三在采访中说，李四负责技术路线，王五负责市场策略。";

await rm(userDataDir, { force: true, recursive: true });
await mkdir(userDataDir, { recursive: true });

const harnessServer = createHarnessServer();
const harnessBaseUrl = await listen(harnessServer);

let context;
try {
  context = await chromium.launchPersistentContext(userDataDir, {
    acceptDownloads: true,
    channel: "chromium",
    headless: process.env.PLAYWRIGHT_HEADLESS !== "0",
    args: [`--disable-extensions-except=${extensionDir}`, `--load-extension=${extensionDir}`],
  });

  const extensionId = await getExtensionId(context);
  await runInstalledExtensionE2E(context, extensionId);
  await runCurrentPageHarnessE2E(context, harnessBaseUrl);

  console.log("Extension side panel E2E passed with Playwright Chromium");
} finally {
  await context?.close();
  await closeServer(harnessServer);
  await rm(userDataDir, { force: true, recursive: true });
}

async function runInstalledExtensionE2E(context, extensionId) {
  let aiRequests = [];
  let failNext = false;
  await context.route("https://api.deepseek.com/**", async (route) => {
    aiRequests.push(route.request().postData() ?? "");
    await delay(700);
    if (failNext) {
      failNext = false;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { message: "模拟 AI 失败" } }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAiPayload()),
            },
          },
        ],
      }),
    });
  });

  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await waitForText(page, "当前页面人物");
  await assertPageDoesNotContain(page, "本地规则");

  await clickButton(page, "分析当前页面");
  await waitForText(page, "AI 分析需要填写服务商 API Key");
  assert.equal(aiRequests.length, 0);

  await fillControlByLabel(page, "API Key", "test-api-key");
  await fillControlByLabel(page, "文章标题", "Playwright 测试文章");
  await fillControlByLabel(page, "来源 URL", "https://example.com/playwright");
  await fillControlByLabel(page, "正文", articleText);

  await clickButton(page, "分析粘贴正文");
  await waitForText(page, "AI 分析中");
  assert.equal(await isAnyButtonDisabled(page, "AI 分析中"), true);

  await fillControlByLabel(page, "来源 URL", "https://example.com/edited-during-analysis");
  assert.equal(await controlValueByLabel(page, "来源 URL"), "https://example.com/edited-during-analysis");

  await waitForText(page, "张三");
  await waitForText(page, "李四");
  await waitForText(page, "创始人与技术负责人");
  assert.equal(aiRequests.length, 1);
  assert.equal(aiRequests.at(-1).includes("句子列表"), true);
  assert.equal(await isAnyButtonDisabled(page, "导出"), false);

  const download = await triggerDownload(page, "导出");
  assert.match(download.suggestedFilename(), /人物演员表\.md$/);

  await clickButton(page, "保存");
  await waitForText(page, "已保存");
  assert.equal(await localMemoryHasSavedPerson(page, "张三"), true);

  failNext = true;
  await clickButton(page, "分析粘贴正文");
  await waitForText(page, "模拟 AI 失败");
  await waitForText(page, "张三");
  assert.equal(await isAnyButtonDisabled(page, "导出"), false);
  assert.equal(aiRequests.length, 2);

  await fillControlByLabel(page, "正文", "短");
  await clickButton(page, "分析粘贴正文");
  await waitForText(page, "正文不足 40 个字符");
  await waitForText(page, "张三");
  assert.equal(aiRequests.length, 2);

  await page.close();
  await context.unroute("https://api.deepseek.com/**");
}

async function runCurrentPageHarnessE2E(context, baseUrl) {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/sidepanel-test.html`);
  await waitForText(page, "当前页面人物");

  await clickButton(page, "分析当前页面");
  await waitForText(page, "AI 分析需要填写服务商 API Key");
  assert.deepEqual(await harnessCounts(page), { extractionCalls: 0, fetchCalls: 0 });

  await fillControlByLabel(page, "API Key", "test-api-key");
  await clickButton(page, "分析当前页面");
  await waitForAnyText(page, ["读取中", "AI 分析中"]);
  assert.equal(await isAnyButtonDisabled(page, "读取中", "AI 分析中"), true);

  await fillControlByLabel(page, "来源 URL", "https://example.com/harness-edit");
  assert.equal(await controlValueByLabel(page, "来源 URL"), "https://example.com/harness-edit");

  await waitForText(page, "张三");
  await waitForText(page, "李四");
  await waitForText(page, "创始人与技术负责人");
  assert.deepEqual(await harnessCounts(page), { extractionCalls: 1, fetchCalls: 1 });
  assert.equal(await harnessLastRequestIncludes(page, "句子列表"), true);

  await page.evaluate(() => {
    window.__peopleLensHarness.failNext = true;
  });
  await clickButton(page, "分析粘贴正文");
  await waitForText(page, "模拟 AI 失败");
  await waitForText(page, "张三");
  assert.equal(await isAnyButtonDisabled(page, "导出"), false);

  await page.evaluate(() => {
    window.__peopleLensHarness.extractedText = "短";
  });
  await clickButton(page, "分析当前页面");
  await waitForText(page, "正文不足 40 个字符");
  await waitForText(page, "张三");
  assert.deepEqual(await harnessCounts(page), { extractionCalls: 2, fetchCalls: 2 });

  await page.close();
}

function createHarnessServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    try {
      if (url.pathname === "/sidepanel-test.html") {
        send(response, 200, makeHarnessHtml(), "text/html; charset=utf-8");
        return;
      }
      if (url.pathname === "/extension-dist/sidepanel.js") {
        sendFile(response, resolve(repoRoot, "extension-dist/sidepanel.js"), "text/javascript; charset=utf-8");
        return;
      }
      if (url.pathname === "/extension-dist/sidepanel.css") {
        sendFile(response, resolve(repoRoot, "extension-dist/sidepanel.css"), "text/css; charset=utf-8");
        return;
      }
      send(response, 404, "Not found", "text/plain; charset=utf-8");
    } catch (error) {
      send(response, 500, error instanceof Error ? error.message : "Server error", "text/plain; charset=utf-8");
    }
  });
}

function makeHarnessHtml() {
  const escapedArticle = JSON.stringify(articleText);
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PeopleLens Playwright Harness</title>
    <script>
      localStorage.clear();
      window.__peopleLensHarness = {
        extractionCalls: 0,
        fetchCalls: 0,
        requests: [],
        failNext: false,
        extractedText: ${escapedArticle}
      };

      window.chrome = {
        tabs: {
          async query() {
            return [{ id: 101, title: "测试文章", url: "https://example.com/article" }];
          }
        },
        scripting: {
          async executeScript() {
            window.__peopleLensHarness.extractionCalls += 1;
            return [{
              result: {
                title: "测试文章",
                url: "https://example.com/article",
                text: window.__peopleLensHarness.extractedText
              }
            }];
          }
        }
      };

      window.fetch = async (url, options) => {
        window.__peopleLensHarness.fetchCalls += 1;
        window.__peopleLensHarness.requests.push({ url: String(url), body: String(options?.body || "") });
        await new Promise((resolve) => setTimeout(resolve, 700));
        if (window.__peopleLensHarness.failNext) {
          window.__peopleLensHarness.failNext = false;
          throw new Error("模拟 AI 失败");
        }
        return {
          ok: true,
          async json() {
            return {
              choices: [{
                message: {
                  content: JSON.stringify(${JSON.stringify(mockAiPayload())})
                }
              }]
            };
          }
        };
      };
    </script>
    <script type="module" src="/extension-dist/sidepanel.js"></script>
    <link rel="stylesheet" href="/extension-dist/sidepanel.css" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
}

function mockAiPayload() {
  return {
    people: [
      {
        canonicalName: "张三",
        aliases: [],
        identity: "示例公司创办人",
        articleRole: "推动示例公司产品发布的人物",
        timeline: ["创办示例公司"],
        evidenceSentenceIds: ["s1"],
        confidence: "high",
      },
      {
        canonicalName: "李四",
        aliases: [],
        identity: "示例公司首席技术官",
        articleRole: "负责技术路线",
        timeline: ["担任首席技术官"],
        evidenceSentenceIds: ["s1", "s3"],
        confidence: "high",
      },
    ],
    relationships: [
      {
        people: ["张三", "李四"],
        label: "创始人与技术负责人",
        summary: "张三邀请李四担任首席技术官。",
        evidenceSentenceIds: ["s1"],
        confidence: "high",
      },
    ],
    uncertaintyNotes: [],
  };
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

async function sendFile(response, path, contentType) {
  const { readFile } = await import("node:fs/promises");
  send(response, 200, await readFile(path), contentType);
}

function send(response, status, body, contentType) {
  response.writeHead(status, { "Content-Type": contentType });
  response.end(body);
}

async function listen(server) {
  const port = await getFreePort();
  server.listen(port, "127.0.0.1");
  await once(server, "listening");
  return `http://127.0.0.1:${port}`;
}

async function closeServer(server) {
  if (!server.listening) {
    return;
  }
  server.close();
  await once(server, "close");
}

async function getFreePort() {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : undefined;
  server.close();
  await once(server, "close");
  if (!port) {
    throw new Error("Failed to allocate a free port");
  }
  return port;
}

async function waitForText(page, text) {
  await page.waitForFunction((expected) => document.body?.textContent?.includes(expected), text, {
    timeout: 15_000,
  });
}

async function waitForAnyText(page, texts) {
  await page.waitForFunction(
    (expectedTexts) => expectedTexts.some((text) => document.body?.textContent?.includes(text)),
    texts,
    { timeout: 15_000 },
  );
}

async function assertPageDoesNotContain(page, text) {
  const contains = await page.evaluate((expected) => document.body.textContent.includes(expected), text);
  assert.equal(contains, false);
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

async function localMemoryHasSavedPerson(page, canonicalName) {
  return page.evaluate((expectedName) => {
    const raw = localStorage.getItem("peoplelens.memory.v1");
    if (!raw) {
      return false;
    }
    const memory = JSON.parse(raw);
    return Object.values(memory).some((entry) => entry.canonicalName === expectedName && entry.saved);
  }, canonicalName);
}

async function harnessCounts(page) {
  return page.evaluate(() => ({
    extractionCalls: window.__peopleLensHarness.extractionCalls,
    fetchCalls: window.__peopleLensHarness.fetchCalls,
  }));
}

async function harnessLastRequestIncludes(page, text) {
  return page.evaluate((expected) => {
    const last = window.__peopleLensHarness.requests.at(-1);
    return Boolean(last?.body.includes(expected));
  }, text);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
