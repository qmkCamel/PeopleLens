import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { analyzeArticle } from "../src/analysis/analyzeArticle";
import { exportAnalysisAsMarkdown } from "../src/analysis/exportMarkdown";
import type { AnalysisResult, ArticleInput, PersonCard as PersonCardType } from "../src/analysis/types";
import { getMemoryMap, recordEncounter, toggleSavedPerson } from "../src/memory/memoryService";
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
    query: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<Array<{ id?: number; title?: string; url?: string }>>;
  };
};

interface ExtractedArticle {
  title: string;
  url: string;
  text: string;
}

const minimumArticleLength = 40;

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
  const people = useMemo(() => result?.people ?? [], [result]);

  async function analyze(input: ArticleInput) {
    if (input.text.trim().length < minimumArticleLength) {
      setError("正文不足 40 个字符。请手动粘贴完整文章正文后再分析。");
      return;
    }
    setIsAnalyzing(true);
    setError("");
    try {
      const analyzed = analyzeArticle(input);
      analyzed.people.forEach((person) => recordEncounter(person, analyzed.article));
      setResult(withMemory(analyzed));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "分析失败，请稍后重试。");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleAnalyzeCurrentPage() {
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
          <p className="eyebrow">PeopleLens Extension</p>
          <h1>当前页面人物</h1>
          <p className="hero-copy">点击后读取当前标签页正文。本地规则不会上传内容；读取失败时可手动粘贴。</p>
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
        <div className="extension-actions">
          <button className="primary-button" type="button" onClick={handleAnalyzeCurrentPage} disabled={isExtracting || isAnalyzing}>
            {isExtracting ? "读取中..." : "分析当前页面"}
          </button>
          <button type="button" onClick={handleAnalyzePasted} disabled={isExtracting || isAnalyzing}>
            {isAnalyzing ? "分析中..." : "分析粘贴正文"}
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
            placeholder="如果当前页面无法读取，请在这里粘贴正文。"
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
