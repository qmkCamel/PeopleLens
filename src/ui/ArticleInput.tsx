import type { AiSettings, AnalysisMode, ArticleInput } from "../analysis/types";

interface ArticleInputFormProps {
  article: ArticleInput;
  aiSettings: AiSettings;
  analysisMode: AnalysisMode;
  error: string;
  isAnalyzing: boolean;
  onAiSettingsChange: (settings: AiSettings) => void;
  onAnalyze: () => void;
  onAnalysisModeChange: (mode: AnalysisMode) => void;
  onChange: (article: ArticleInput) => void;
}

export function ArticleInputForm({
  aiSettings,
  analysisMode,
  article,
  error,
  isAnalyzing,
  onAiSettingsChange,
  onAnalyze,
  onAnalysisModeChange,
  onChange,
}: ArticleInputFormProps) {
  return (
    <section className="panel input-panel" aria-label="文章输入">
      <div className="panel-header">
        <div>
          <p className="eyebrow">输入</p>
          <h2>文章正文</h2>
        </div>
        <span className="muted">{article.text.trim().length} 字符</span>
      </div>

      <div className="mode-box">
        <div className="mode-options" role="radiogroup" aria-label="分析模式">
          <button
            aria-checked={analysisMode === "local"}
            role="radio"
            type="button"
            onClick={() => onAnalysisModeChange("local")}
          >
            本地规则
          </button>
          <button
            aria-checked={analysisMode === "ai"}
            role="radio"
            type="button"
            onClick={() => onAnalysisModeChange("ai")}
          >
            AI 结构化
          </button>
        </div>

        {analysisMode === "ai" ? (
          <div className="ai-settings">
            <label>
              API Key
              <input
                value={aiSettings.apiKey}
                type="password"
                placeholder="DeepSeek / OpenAI / 兼容服务商 API Key"
                onChange={(event) => onAiSettingsChange({ ...aiSettings, apiKey: event.target.value })}
              />
            </label>
            <label>
              API 协议
              <select
                value={aiSettings.protocol}
                onChange={(event) =>
                  onAiSettingsChange({
                    ...aiSettings,
                    protocol: event.target.value === "responses" ? "responses" : "chat_completions",
                  })
                }
              >
                <option value="chat_completions">Chat Completions（DeepSeek/兼容服务商）</option>
                <option value="responses">Responses API（OpenAI）</option>
              </select>
            </label>
            <label>
              Base URL
              <input
                value={aiSettings.baseUrl}
                placeholder="https://api.deepseek.com"
                onChange={(event) => onAiSettingsChange({ ...aiSettings, baseUrl: event.target.value })}
              />
            </label>
            <label>
              模型
              <input
                value={aiSettings.model}
                placeholder="deepseek-v4-flash"
                onChange={(event) => onAiSettingsChange({ ...aiSettings, model: event.target.value })}
              />
            </label>
            <p>
              DeepSeek 测试推荐：Chat Completions、Base URL 为 https://api.deepseek.com、模型 deepseek-v4-flash。AI 模式会把标题、来源和分句后的正文发送给所选服务商。
            </p>
          </div>
        ) : (
          <p className="local-mode-note">本地规则不上传正文，适合快速离线验证，但中文识别准确率有限。</p>
        )}
      </div>

      <label>
        文章标题
        <input
          value={article.title}
          placeholder="可选，例如：一篇人物密集的商业报道"
          onChange={(event) => onChange({ ...article, title: event.target.value })}
        />
      </label>

      <label>
        来源 URL
        <input
          value={article.url}
          placeholder="可选，例如：https://mp.weixin.qq.com/s/..."
          onChange={(event) => onChange({ ...article, url: event.target.value })}
        />
      </label>

      <label className="textarea-label">
        正文
        <textarea
          value={article.text}
          placeholder="打开微信文章后手动复制正文，粘贴到这里。第一版不会自动抓取网页，也不会上传内容。"
          onChange={(event) => onChange({ ...article, text: event.target.value })}
        />
      </label>

      {error ? <p className="error-text">{error}</p> : null}

      <button className="primary-button" type="button" onClick={onAnalyze} disabled={isAnalyzing}>
        {isAnalyzing ? "分析中..." : analysisMode === "ai" ? "用 AI 分析本文人物" : "用本地规则分析"}
      </button>
    </section>
  );
}
