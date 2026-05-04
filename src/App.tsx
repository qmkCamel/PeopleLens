import { useMemo, useState } from "react";
import { analyzeArticle } from "./analysis/analyzeArticle";
import { exportAnalysisAsMarkdown } from "./analysis/exportMarkdown";
import { analyzeArticleWithOpenAI } from "./analysis/openaiProvider";
import type {
  AiSettings,
  AnalysisMode,
  AnalysisResult,
  ArticleInput,
  PersonCard as PersonCardType,
} from "./analysis/types";
import {
  clearMemory,
  getMemoryMap,
  recordEncounter,
  toggleSavedPerson,
} from "./memory/memoryService";
import { ArticleInputForm } from "./ui/ArticleInput";
import { CastSidebar, type PersonFilter } from "./ui/CastSidebar";
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
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeTitle = title.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "peoplelens";
  link.href = href;
  link.download = `${safeTitle}-人物演员表.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

function App() {
  const [article, setArticle] = useState<ArticleInput>(defaultInput);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [filter, setFilter] = useState<PersonFilter>("all");
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("local");
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
      setResult(null);
      return;
    }
    if (analysisMode === "ai" && !aiSettings.apiKey.trim()) {
      setError("AI 结构化模式需要填写 OpenAI API Key。Key 只保存在当前浏览器。");
      return;
    }

    setIsAnalyzing(true);
    try {
      const analyzed =
        analysisMode === "ai" ? await analyzeArticleWithOpenAI(article, aiSettings) : analyzeArticle(article);
      analyzed.people.forEach((person) => {
        recordEncounter(person, analyzed.article);
      });
      setResult(withMemory(analyzed));
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
  }

  function handleClearMemory() {
    clearMemory();
    if (result) {
      setResult(withMemory(result));
    }
  }

  function handleExport() {
    if (!result) {
      return;
    }
    downloadMarkdown(exportAnalysisAsMarkdown(result), result.article.title);
  }

  return (
    <main className="app-shell">
      <section className="hero-band">
        <div>
          <p className="eyebrow">PeopleLens Web MVP</p>
          <h1>阅读文章时生成“本文人物”</h1>
          <p className="hero-copy">
            粘贴文章正文，PeopleLens 会用本地规则抽取人物、证据句和关系摘要，并把你见过的人记在浏览器本地。
          </p>
        </div>
        <div className="privacy-note">
          <strong>双模式</strong>
          <span>本地规则不上传正文；AI 结构化模式会把文章句子发送给 OpenAI，并使用浏览器中保存的 API Key。</span>
        </div>
      </section>

      <section className="workspace-grid">
        <ArticleInputForm
          article={article}
          aiSettings={aiSettings}
          analysisMode={analysisMode}
          error={error}
          isAnalyzing={isAnalyzing}
          onAnalyze={handleAnalyze}
          onAiSettingsChange={(settings) => {
            setAiSettings(settings);
            saveAiSettings(settings);
          }}
          onAnalysisModeChange={setAnalysisMode}
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
