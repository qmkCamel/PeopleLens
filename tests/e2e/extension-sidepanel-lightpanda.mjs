import { createServer } from "node:http";
import { mkdir, chmod, access } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import net from "node:net";
import puppeteer from "puppeteer-core";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const lightpandaDownloadBase = "https://github.com/lightpanda-io/browser/releases/download/nightly";
const articleText =
  "张三创办了示例公司，并邀请李四担任首席技术官。李四随后与王五合作推进产品发布。张三在采访中说，李四负责技术路线，王五负责市场策略。";

const lightpandaProcess = { current: undefined };
const httpServer = await createHarnessServer();

try {
  const lightpandaBinary = await resolveLightpandaBinary();
  const lightpandaPort = await getFreePort();
  const baseUrl = await listen(httpServer);
  await startLightpanda(lightpandaBinary, lightpandaPort);

  const browser = await connectPuppeteer(lightpandaPort);
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/sidepanel-test.html`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await waitForText(page, "当前页面人物");
    await assertPageDoesNotContain(page, "本地规则");

    await clickButton(page, "分析当前页面");
    await waitForText(page, "AI 分析需要填写服务商 API Key");
    assert.deepEqual(await harnessCounts(page), { extractionCalls: 0, fetchCalls: 0 });

    await fillControlByLabel(page, "API Key", "test-api-key");
    await clickButton(page, "分析当前页面");
    await waitForAnyText(page, ["读取中", "AI 分析中"]);
    assert.equal(await isButtonDisabled(page, "分析当前页面", "AI 分析中"), true);

    await fillControlByLabel(page, "来源 URL", "https://example.com/edited-during-analysis");
    assert.equal(await controlValueByLabel(page, "来源 URL"), "https://example.com/edited-during-analysis");

    await waitForText(page, "张三");
    await waitForText(page, "李四");
    await waitForText(page, "创始人与技术负责人");
    assert.equal(await isButtonDisabled(page, "导出"), false);
    assert.deepEqual(await harnessCounts(page), { extractionCalls: 1, fetchCalls: 1 });
    assert.equal(await lastRequestIncludes(page, "句子列表"), true);

    await clickButton(page, "保存");
    await waitForText(page, "已保存");
    assert.equal(await localMemoryHasSavedPerson(page, "张三"), true);

    await page.evaluate(() => {
      window.__peopleLensHarness.failNext = true;
    });
    await clickButton(page, "分析粘贴正文");
    await waitForText(page, "模拟 AI 失败");
    await waitForText(page, "张三");
    assert.equal(await isButtonDisabled(page, "导出"), false);

    await page.evaluate(() => {
      window.__peopleLensHarness.extractedText = "短";
    });
    await clickButton(page, "分析当前页面");
    await waitForText(page, "正文不足 40 个字符");
    await waitForText(page, "张三");
    assert.deepEqual(await harnessCounts(page), { extractionCalls: 2, fetchCalls: 2 });

    await page.close();
  } finally {
    await browser.disconnect();
  }

  console.log("Extension side panel E2E passed with Lightpanda");
} finally {
  await closeServer(httpServer);
  stopLightpanda();
}

async function createHarnessServer() {
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
    <title>PeopleLens Extension E2E</title>
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
        await new Promise((resolve) => setTimeout(resolve, 450));
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
                  content: JSON.stringify({
                    people: [
                      {
                        canonicalName: "张三",
                        aliases: [],
                        identity: "示例公司创办人",
                        articleRole: "推动示例公司产品发布的人物",
                        timeline: ["创办示例公司"],
                        evidenceSentenceIds: ["s1"],
                        confidence: "high"
                      },
                      {
                        canonicalName: "李四",
                        aliases: [],
                        identity: "示例公司首席技术官",
                        articleRole: "负责技术路线",
                        timeline: ["担任首席技术官"],
                        evidenceSentenceIds: ["s1", "s3"],
                        confidence: "high"
                      }
                    ],
                    relationships: [
                      {
                        people: ["张三", "李四"],
                        label: "创始人与技术负责人",
                        summary: "张三邀请李四担任首席技术官。",
                        evidenceSentenceIds: ["s1"],
                        confidence: "high"
                      }
                    ],
                    uncertaintyNotes: []
                  })
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

async function resolveLightpandaBinary() {
  const candidates = [
    process.env.LIGHTPANDA_BINARY,
    await commandPath("lightpanda"),
    resolve(repoRoot, ".tmp/lightpanda/lightpanda"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await isExecutable(candidate)) {
      return candidate;
    }
  }

  if (process.env.LIGHTPANDA_SKIP_DOWNLOAD === "1") {
    throw new Error("lightpanda binary not found. Install it or set LIGHTPANDA_BINARY.");
  }

  return downloadLightpanda();
}

async function downloadLightpanda() {
  const asset = lightpandaAssetName();
  const target = resolve(repoRoot, ".tmp/lightpanda/lightpanda");
  await mkdir(dirname(target), { recursive: true });
  await download(`${lightpandaDownloadBase}/${asset}`, target);
  await chmod(target, 0o755);
  await verifyLightpanda(target);
  return target;
}

function lightpandaAssetName() {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === "darwin" && arch === "arm64") {
    return "lightpanda-aarch64-macos";
  }
  if (platform === "darwin" && arch === "x64") {
    return "lightpanda-x86_64-macos";
  }
  if (platform === "linux" && arch === "x64") {
    return "lightpanda-x86_64-linux";
  }
  if (platform === "linux" && arch === "arm64") {
    return "lightpanda-aarch64-linux";
  }
  throw new Error(`Unsupported Lightpanda platform: ${platform}/${arch}`);
}

async function download(url, target) {
  const https = await import("node:https");
  const file = createWriteStream(target, { mode: 0o755 });
  await new Promise((resolveDownload, rejectDownload) => {
    https.get(url, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        download(new URL(response.headers.location, url).toString(), target).then(resolveDownload, rejectDownload);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        rejectDownload(new Error(`Failed to download Lightpanda: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close(resolveDownload);
      });
    }).on("error", (error) => {
      file.close();
      rejectDownload(error);
    });
  });
}

async function verifyLightpanda(binary) {
  const result = await run(binary, ["version"], { timeoutMs: 15_000 });
  if (!/\d+\.\d+\.\d+/.test(result.stdout)) {
    throw new Error(`Unexpected Lightpanda version output: ${result.stdout || result.stderr}`);
  }
}

async function startLightpanda(binary, port) {
  lightpandaProcess.current = spawn(
    binary,
    ["serve", "--host", "127.0.0.1", "--port", String(port), "--log-level", "error"],
    {
      cwd: repoRoot,
      env: { ...process.env, LIGHTPANDA_DISABLE_TELEMETRY: "true" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let stderr = "";
  lightpandaProcess.current.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });
  lightpandaProcess.current.stdout.on("data", () => {});

  await waitFor(async () => {
    if (lightpandaProcess.current?.exitCode !== null) {
      throw new Error(`Lightpanda exited early: ${stderr}`);
    }
    const response = await fetch(`http://127.0.0.1:${port}/json/version`).catch(() => undefined);
    return response?.ok;
  }, 15_000, "Lightpanda CDP server did not start");
}

function stopLightpanda() {
  if (!lightpandaProcess.current || lightpandaProcess.current.exitCode !== null) {
    return;
  }
  lightpandaProcess.current.kill("SIGTERM");
}

async function connectPuppeteer(port) {
  const version = await fetch(`http://127.0.0.1:${port}/json/version`).then((response) => response.json());
  return puppeteer.connect({
    browserWSEndpoint: version.webSocketDebuggerUrl,
    defaultViewport: null,
  });
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

async function commandPath(command) {
  const result = await run("sh", ["-lc", `command -v ${command}`], { timeoutMs: 5_000 }).catch(() => undefined);
  return result?.stdout.trim() || "";
}

async function isExecutable(path) {
  try {
    await access(path);
    await verifyLightpanda(path);
    return true;
  } catch {
    return false;
  }
}

async function run(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    env: { ...process.env, LIGHTPANDA_DISABLE_TELEMETRY: "true" },
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const timeout = setTimeout(() => {
    child.kill("SIGKILL");
  }, options.timeoutMs ?? 30_000);
  const [code] = await once(child, "exit");
  clearTimeout(timeout);
  if (code !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${stderr || stdout}`);
  }
  return { stdout, stderr };
}

async function waitFor(predicate, timeoutMs, message) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

async function waitForText(page, text) {
  await page.waitForFunction(
    (expected) => document.body?.textContent?.includes(expected),
    { timeout: 15_000 },
    text,
  );
}

async function waitForAnyText(page, texts) {
  await page.waitForFunction(
    (expectedTexts) => expectedTexts.some((text) => document.body?.textContent?.includes(text)),
    { timeout: 15_000 },
    texts,
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

async function harnessCounts(page) {
  return page.evaluate(() => ({
    extractionCalls: window.__peopleLensHarness.extractionCalls,
    fetchCalls: window.__peopleLensHarness.fetchCalls,
  }));
}

async function lastRequestIncludes(page, text) {
  return page.evaluate((expected) => {
    const last = window.__peopleLensHarness.requests.at(-1);
    return Boolean(last?.body.includes(expected));
  }, text);
}

async function isButtonDisabled(page, ...texts) {
  return page.evaluate((expectedTexts) => {
    const button = [...document.querySelectorAll("button")].find((item) =>
      expectedTexts.some((expected) => item.textContent.includes(expected)),
    );
    return button?.disabled ?? false;
  }, texts);
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
