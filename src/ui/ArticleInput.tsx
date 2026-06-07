import type { AiSettings, ArticleInput } from "../analysis/types";

interface ArticleInputFormProps {
  article: ArticleInput;
  aiSettings: AiSettings;
  error: string;
  isAnalyzing: boolean;
  onAiSettingsChange: (settings: AiSettings) => void;
  onAnalyze: () => void;
  onChange: (article: ArticleInput) => void;
}

export function ArticleInputForm({
  aiSettings,
  article,
  error,
  isAnalyzing,
  onAiSettingsChange,
  onAnalyze,
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
            DeepSeek 测试推荐：Chat Completions、Base URL 为 https://api.deepseek.com、模型 deepseek-v4-flash。
          </p>
        </div>
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
          placeholder="打开微信文章后手动复制正文，粘贴到这里。点击分析后，标题、来源和正文会发送给你配置的 AI 服务商。"
          onChange={(event) => onChange({ ...article, text: event.target.value })}
        />
      </label>

      {error ? <p className="error-text">{error}</p> : null}

      <button className="primary-button" type="button" onClick={onAnalyze} disabled={isAnalyzing}>
        {isAnalyzing ? "分析中..." : "用 AI 分析本文人物"}
      </button>
    </section>
  );
}
