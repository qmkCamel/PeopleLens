import { useMemo, useState } from "react";
import { exportAnalysisAsMarkdown } from "./analysis/exportMarkdown";
import { analyzeArticleWithOpenAI } from "./analysis/openaiProvider";
import type {
  AiSettings,
  AnalysisResult,
  ArticleInput,
  PersonCard as PersonCardType,
} from "./analysis/types";
import {
  clearMemory,
  exportMemoryJson,
  getMemoryEntries,
  getMemoryMap,
  type MemoryEntry,
  recordEncounter,
  toggleSavedPerson,
} from "./memory/memoryService";
import { ArticleInputForm } from "./ui/ArticleInput";
import { CastSidebar, type PersonFilter } from "./ui/CastSidebar";
import { MemoryLibrary } from "./ui/MemoryLibrary";
import { RelationshipList } from "./ui/RelationshipList";

const defaultInput: ArticleInput = {
  title: "",
  url: "",
  text: "",
};

const aiSettingsKey = "peoplelens.aiSettings.v1";
const defaultAiSettings: AiSettings = {
  apiKey: "",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash",
  protocol: "chat_completions",
};

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

function downloadMarkdown(markdown: string, title: string) {
  downloadFile(markdown, `${safeFileStem(title)}-人物演员表.md`, "text/markdown;charset=utf-8");
}

function downloadJson(json: string, title: string) {
  downloadFile(json, `${safeFileStem(title)}.json`, "application/json;charset=utf-8");
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

function safeFileStem(title: string) {
  return title.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "peoplelens";
}

function App() {
  const [article, setArticle] = useState<ArticleInput>(defaultInput);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>(() => getMemoryEntries());
  const [filter, setFilter] = useState<PersonFilter>("all");
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());

  const visiblePeople = useMemo(() => {
    if (!result) {
      return [];
    }

    const people = result.people;
    if (filter === "main") {
      return people.filter((person) => person.importance >= 10 || person.mentionCount >= 3);
    }
    if (filter === "saved") {
      return people.filter((person) => person.memory?.saved);
    }
    if (filter === "uncertain") {
      return people.filter((person) => person.confidence !== "high");
    }
    return people;
  }, [filter, result]);

  async function handleAnalyze() {
    setError("");
    if (article.text.trim().length < 40) {
      setError("请先粘贴一段完整文章正文，至少 40 个字符。");
      return;
    }
    if (!aiSettings.apiKey.trim()) {
      setError("AI 分析需要填写服务商 API Key。Key 只保存在当前浏览器。");
      return;
    }

    setIsAnalyzing(true);
    try {
      const analyzed = await analyzeArticleWithOpenAI(article, aiSettings);
      analyzed.people.forEach((person) => {
        recordEncounter(person, analyzed.article);
      });
      setResult(withMemory(analyzed));
      setMemoryEntries(getMemoryEntries());
      setFilter("all");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "分析失败，请稍后重试。");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleToggleSaved(person: PersonCardType) {
    toggleSavedPerson(person, result?.article);
    if (result) {
      setResult(withMemory(result));
    }
    setMemoryEntries(getMemoryEntries());
  }

  function handleClearMemory() {
    clearMemory();
    if (result) {
      setResult(withMemory(result));
    }
    setMemoryEntries([]);
  }

  function handleExport() {
    if (!result) {
      return;
    }
    downloadMarkdown(exportAnalysisAsMarkdown(result), result.article.title);
  }

  function handleExportMemory() {
    downloadJson(exportMemoryJson(), "peoplelens-local-memory");
  }

  return (
    <main className="app-shell">
      <section className="hero-band">
        <div>
          <p className="eyebrow">PeopleLens Web Support</p>
          <h1>阅读文章时生成“本文人物”</h1>
          <p className="hero-copy">
            粘贴文章正文，PeopleLens 会用 AI 生成文章人物、证据句和关系摘要，并把你见过的人记在浏览器本地。
          </p>
        </div>
        <div className="privacy-note">
          <strong>AI 分析</strong>
          <span>标题、来源和分句后的正文会发送给你配置的 AI 服务商；API Key 只保存在当前浏览器。</span>
        </div>
      </section>

      <section className="workspace-grid">
        <ArticleInputForm
          article={article}
          aiSettings={aiSettings}
          error={error}
          isAnalyzing={isAnalyzing}
          onAnalyze={handleAnalyze}
          onAiSettingsChange={(settings) => {
            setAiSettings(settings);
            saveAiSettings(settings);
          }}
          onChange={setArticle}
        />
        <CastSidebar
          filter={filter}
          people={visiblePeople}
          totalCount={result?.people.length ?? 0}
          onClearMemory={handleClearMemory}
          onExport={handleExport}
          onFilterChange={setFilter}
          onToggleSaved={handleToggleSaved}
        />
      </section>

      <RelationshipList relationships={result?.relationships ?? []} />
      <MemoryLibrary entries={memoryEntries} onClearMemory={handleClearMemory} onExportMemory={handleExportMemory} />
      <footer className="app-footer">
        <a href="/privacy.html">隐私政策</a>
        <a href="/terms.html">使用条款</a>
      </footer>
    </main>
  );
}

export default App;

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
