import type { MemoryEntry } from "../memory/memoryService";
import { useMemo, useState } from "react";

interface MemoryLibraryProps {
  entries: MemoryEntry[];
  onClearMemory: () => void;
  onExportMemory: () => void;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "未知时间";
  }
  return date.toLocaleDateString();
}

export function MemoryLibrary({ entries, onClearMemory, onExportMemory }: MemoryLibraryProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredEntries = useMemo(() => {
    if (!normalizedQuery) {
      return entries;
    }
    return entries.filter((entry) => {
      const searchable = [
        entry.canonicalName,
        entry.normalizedName,
        entry.latestSourceTitle,
        ...entry.sources.map((source) => source.title),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [entries, normalizedQuery]);
  const savedEntries = filteredEntries.filter((entry) => entry.saved);
  const recentEntries = filteredEntries.filter((entry) => !entry.saved).slice(0, 8);

  return (
    <section className="panel memory-panel" aria-label="本地记忆库">
      <div className="panel-header">
        <div>
          <p className="eyebrow">本地记忆</p>
          <h2>{entries.length ? `${entries.length} 位见过的人` : "暂无记忆"}</h2>
        </div>
        <div className="panel-actions">
          <button type="button" onClick={onExportMemory} disabled={!entries.length}>
            导出记忆
          </button>
          <button type="button" onClick={onClearMemory} disabled={!entries.length}>
            清空
          </button>
        </div>
      </div>

      <div className="memory-tools">
        <label>
          搜索本地记忆
          <input
            value={query}
            placeholder="按人物或文章标题搜索"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {filteredEntries.length ? (
        <div className="memory-grid">
          <MemorySection entries={savedEntries} title="已保存" />
          <MemorySection entries={recentEntries} title="最近见过" />
        </div>
      ) : (
        <div className="empty-state inline">
          <strong>{entries.length ? "没有匹配结果" : "还没有本地记忆"}</strong>
          <span>{entries.length ? "换一个关键词继续搜索。" : "分析文章后，人物会自动记录在当前浏览器。"}</span>
        </div>
      )}
    </section>
  );
}

function MemorySection({ entries, title }: { entries: MemoryEntry[]; title: string }) {
  return (
    <section className="memory-section" aria-label={title}>
      <h3>{title}</h3>
      {entries.length ? (
        <div className="memory-list">
          {entries.map((entry) => (
            <article className="memory-item" key={entry.normalizedName}>
              <div>
                <strong>{entry.canonicalName}</strong>
                <span>
                  {entry.encounterCount} 次遇见 · 最近 {formatDate(entry.lastSeenAt)}
                </span>
              </div>
              {entry.latestSourceTitle ? <p>{entry.latestSourceTitle}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="memory-empty">暂无</p>
      )}
    </section>
  );
}
