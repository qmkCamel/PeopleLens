import type { PersonCard as PersonCardType } from "../analysis/types";
import { PersonCard } from "./PersonCard";

export type PersonFilter = "all" | "main" | "saved" | "uncertain";

interface CastSidebarProps {
  people: PersonCardType[];
  totalCount: number;
  filter: PersonFilter;
  onClearMemory: () => void;
  onExport: () => void;
  onFilterChange: (filter: PersonFilter) => void;
  onToggleSaved: (person: PersonCardType) => void;
}

const filters: Array<{ value: PersonFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "main", label: "主要" },
  { value: "saved", label: "已保存" },
  { value: "uncertain", label: "不确定" },
];

export function CastSidebar({
  filter,
  onClearMemory,
  onExport,
  onFilterChange,
  onToggleSaved,
  people,
  totalCount,
}: CastSidebarProps) {
  return (
    <aside className="panel cast-panel" aria-label="本文人物">
      <div className="panel-header">
        <div>
          <p className="eyebrow">本文人物</p>
          <h2>{totalCount ? `${totalCount} 位人物` : "等待分析"}</h2>
        </div>
        <div className="panel-actions">
          <button type="button" onClick={onExport} disabled={!totalCount}>
            导出
          </button>
          <button type="button" onClick={onClearMemory}>
            清空记忆
          </button>
        </div>
      </div>

      <div className="segmented-control" role="tablist" aria-label="人物筛选">
        {filters.map((item) => (
          <button
            aria-selected={filter === item.value}
            key={item.value}
            type="button"
            onClick={() => onFilterChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="person-list">
        {people.length ? (
          people.map((person) => (
            <PersonCard key={person.normalizedName} person={person} onToggleSaved={onToggleSaved} />
          ))
        ) : (
          <div className="empty-state">
            <strong>还没有人物卡片</strong>
            <span>粘贴文章正文后点击分析，结果会出现在这里。</span>
          </div>
        )}
      </div>
    </aside>
  );
}

