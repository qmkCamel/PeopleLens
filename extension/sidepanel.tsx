import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { exportAnalysisAsMarkdown } from "../src/analysis/exportMarkdown";
import { analyzeArticleWithOpenAI } from "../src/analysis/openaiProvider";
import type { AiSettings, AnalysisResult, ArticleInput, PersonCard as PersonCardType } from "../src/analysis/types";
import { getMemoryMap, recordEncounter, toggleSavedPerson } from "../src/memory/memoryService";
import { LogoMark } from "../src/ui/LogoMark";
import { PersonCard } from "../src/ui/PersonCard";
import { RelationshipList } from "../src/ui/RelationshipList";
import "../src/styles.css";
import "./sidepanel.css";

declare const chrome: {
  scripting?: {
    executeScript: (args: {
      target: { tabId: number };
      func: () => ExtractedArticle;
    }) => Promise<Array<{ result?: ExtractedArticle }>>;
  };
  tabs?: {
    query: (
      queryInfo: { active: boolean; currentWindow: boolean },
    ) => Promise<Array<{ id?: number; title?: string; url?: string }>>;
  };
};

interface ExtractedArticle {
  title: string;
  url: string;
  text: string;
}

const minimumArticleLength = 40;
const aiSettingsKey = "peoplelens.extension.aiSettings.v1";
const defaultAiSettings: AiSettings = {
  apiKey: "",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash",
  protocol: "chat_completions",
};
const supportedApiOrigins = new Set(["https://api.deepseek.com", "https://api.openai.com"]);

function withMemory(result: AnalysisResult): AnalysisResult {
  const memory = getMemoryMap();
  return {
    ...result,
    people: result.people.map((person) => ({
      ...person,
      memory: memory[person.normalizedName],
    })),
  };
}

function SidePanelApp() {
  const [article, setArticle] = useState<ArticleInput>({ title: "", url: "", text: "" });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const people = useMemo(() => result?.people ?? [], [result]);
  const isBusy = isExtracting || isAnalyzing;

  function handleAiSettingsChange(settings: AiSettings) {
    setAiSettings(settings);
    saveAiSettings(settings);
  }

  async function analyze(input: ArticleInput) {
    const settingsError = getAiSettingsError(aiSettings);
    if (settingsError) {
      setError(settingsError);
      return;
    }
    if (input.text.trim().length < minimumArticleLength) {
      setError("正文不足 40 个字符。请手动粘贴完整文章正文后再分析。");
      return;
    }
    setIsAnalyzing(true);
    setError("");
    try {
      const analyzed = await analyzeArticleWithOpenAI(input, aiSettings);
      analyzed.people.forEach((person) => recordEncounter(person, analyzed.article));
      setResult(withMemory(analyzed));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "分析失败，请稍后重试。");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleAnalyzeCurrentPage() {
    const settingsError = getAiSettingsError(aiSettings);
    if (settingsError) {
      setError(settingsError);
      return;
    }
    setIsExtracting(true);
    setError("");
    try {
      if (!chrome.tabs || !chrome.scripting) {
        throw new Error("当前环境不支持 Chrome 扩展页面抽取。");
      }
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error("没有找到当前活动标签页。");
      }
      const [injection] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractReadableArticle,
      });
      const extracted = injection?.result;
      if (!extracted) {
        throw new Error("未能读取当前页面。");
      }
      const nextArticle = {
        title: extracted.title || tab.title || "",
        url: extracted.url || tab.url || "",
        text: extracted.text,
      };
      setArticle(nextArticle);
      await analyze(nextArticle);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "无法分析当前页面，请手动粘贴正文。");
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleAnalyzePasted() {
    await analyze(article);
  }

  function handleToggleSaved(person: PersonCardType) {
    toggleSavedPerson(person, result?.article);
    if (result) {
      setResult(withMemory(result));
    }
  }

  function handleExport() {
    if (!result) {
      return;
    }
    const blob = new Blob([exportAnalysisAsMarkdown(result)], { type: "text/markdown;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${result.article.title.replace(/[^\p{L}\p{N}]+/gu, "-") || "peoplelens"}-人物演员表.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  }

  return (
    <main className="app-shell extension-shell">
      <section className="hero-band extension-hero">
        <div>
          <div className="brand-lockup" aria-label="PeopleLens">
            <LogoMark className="brand-mark" />
            <div className="brand-copy">
              <strong>PeopleLens</strong>
              <span>Extension</span>
            </div>
          </div>
          <h1>当前页面人物</h1>
          <p className="hero-copy">点击后读取当前标签页正文，并用你配置的 AI 服务商生成人物卡片；读取失败时可手动粘贴。</p>
        </div>
      </section>

      <section className="panel input-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">分析</p>
            <h2>当前页面或粘贴正文</h2>
          </div>
          <span className="muted">{article.text.trim().length} 字符</span>
        </div>
        <div className="mode-box extension-settings">
          <div className="mode-header">
            <strong>AI 分析设置</strong>
            <span>正文只会在你点击分析后发送给配置的服务商。</span>
          </div>
          <div className="ai-settings">
            <label>
              API Key
              <input
                value={aiSettings.apiKey}
                type="password"
                placeholder="DeepSeek / OpenAI API Key"
                onChange={(event) => handleAiSettingsChange({ ...aiSettings, apiKey: event.target.value })}
              />
            </label>
            <label>
              API 协议
              <select
                value={aiSettings.protocol}
                onChange={(event) =>
                  handleAiSettingsChange({
                    ...aiSettings,
                    protocol: event.target.value === "responses" ? "responses" : "chat_completions",
                  })
                }
              >
                <option value="chat_completions">Chat Completions（DeepSeek/兼容 OpenAI）</option>
                <option value="responses">Responses API（OpenAI）</option>
              </select>
            </label>
            <label>
              Base URL
              <input
                value={aiSettings.baseUrl}
                list="peoplelens-extension-base-urls"
                placeholder="https://api.deepseek.com"
                onChange={(event) => handleAiSettingsChange({ ...aiSettings, baseUrl: event.target.value })}
              />
              <datalist id="peoplelens-extension-base-urls">
                <option value="https://api.deepseek.com" />
                <option value="https://api.openai.com/v1" />
              </datalist>
            </label>
            <label>
              模型
              <input
                value={aiSettings.model}
                placeholder="deepseek-v4-flash"
                onChange={(event) => handleAiSettingsChange({ ...aiSettings, model: event.target.value })}
              />
            </label>
            <p>扩展包当前声明 DeepSeek 和 OpenAI API 域名权限；其他兼容服务商需要先更新 manifest 后重新打包。</p>
          </div>
        </div>
        <div className="extension-actions">
          <button className="primary-button" type="button" onClick={handleAnalyzeCurrentPage} disabled={isBusy}>
            {isExtracting ? "读取中..." : isAnalyzing ? "AI 分析中..." : "分析当前页面"}
          </button>
          <button type="button" onClick={handleAnalyzePasted} disabled={isBusy}>
            {isAnalyzing ? "AI 分析中..." : "分析粘贴正文"}
          </button>
        </div>
        <label>
          文章标题
          <input value={article.title} onChange={(event) => setArticle({ ...article, title: event.target.value })} />
        </label>
        <label>
          来源 URL
          <input value={article.url} onChange={(event) => setArticle({ ...article, url: event.target.value })} />
        </label>
        <label className="textarea-label">
          正文
          <textarea
            value={article.text}
            placeholder="如果当前页面无法读取，请在这里粘贴正文。点击分析后，标题、来源和正文会发送给你配置的 AI 服务商。"
            onChange={(event) => setArticle({ ...article, text: event.target.value })}
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
      </section>

      <section className="panel cast-panel extension-results">
        <div className="panel-header">
          <div>
            <p className="eyebrow">本文人物</p>
            <h2>{people.length ? `${people.length} 位人物` : "等待分析"}</h2>
          </div>
          <button type="button" onClick={handleExport} disabled={!result}>
            导出
          </button>
        </div>
        <div className="person-list">
          {people.length ? (
            people.map((person) => (
              <PersonCard key={person.normalizedName} person={person} onToggleSaved={handleToggleSaved} />
            ))
          ) : (
            <div className="empty-state">
              <strong>还没有人物卡片</strong>
              <span>分析当前页面或手动粘贴正文。</span>
            </div>
          )}
        </div>
      </section>

      <RelationshipList relationships={result?.relationships ?? []} />
    </main>
  );
}

function loadAiSettings(): AiSettings {
  const raw = localStorage.getItem(aiSettingsKey);
  if (!raw) {
    return defaultAiSettings;
  }
  try {
    return { ...defaultAiSettings, ...(JSON.parse(raw) as Partial<AiSettings>) };
  } catch {
    return defaultAiSettings;
  }
}

function saveAiSettings(settings: AiSettings) {
  localStorage.setItem(aiSettingsKey, JSON.stringify(settings));
}

function getAiSettingsError(settings: AiSettings) {
  if (!settings.apiKey.trim()) {
    return "AI 分析需要填写服务商 API Key。Key 只保存在扩展本地。";
  }
  try {
    const origin = new URL(settings.baseUrl || defaultAiSettings.baseUrl).origin;
    if (!supportedApiOrigins.has(origin)) {
      return "当前扩展包只支持 DeepSeek 和 OpenAI API 域名；其他服务商需要更新 manifest host_permissions 后重新打包。";
    }
  } catch {
    return "Base URL 不是合法 URL。";
  }
  return "";
}

function extractReadableArticle(): ExtractedArticle {
  const title = document.querySelector("h1")?.textContent?.trim() || document.title.trim();
  const url = window.location.href;
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script, style, nav, footer, aside, noscript, iframe, form, input, textarea, button, svg").forEach((node) => {
    node.remove();
  });
  const candidates = [clone.querySelector("article"), clone.querySelector("main"), clone.querySelector('[role="main"]'), clone]
    .filter((node): node is Element => Boolean(node))
    .map((node) => {
      const paragraphs = Array.from(node.querySelectorAll("p, h1, h2, h3, li, blockquote"))
        .map((item) => item.textContent?.replace(/\s+/g, " ").trim() ?? "")
        .filter((text) => text.length >= 12);
      const text = paragraphs.length ? paragraphs.join("\n\n") : node.textContent?.replace(/\s+/g, " ").trim() ?? "";
      return { text, score: paragraphs.length * 100 + text.length };
    })
    .sort((left, right) => right.score - left.score);

  return {
    title,
    url,
    text: candidates[0]?.text.slice(0, 80000) ?? "",
  };
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SidePanelApp />
  </React.StrictMode>,
);
