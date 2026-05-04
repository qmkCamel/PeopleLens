import type { Relationship } from "../analysis/types";

interface RelationshipListProps {
  relationships: Relationship[];
}

export function RelationshipList({ relationships }: RelationshipListProps) {
  return (
    <section className="panel relationship-panel" aria-label="人物关系">
      <div className="panel-header">
        <div>
          <p className="eyebrow">人物关系</p>
          <h2>{relationships.length ? `${relationships.length} 条关系线索` : "关系摘要"}</h2>
        </div>
      </div>

      {relationships.length ? (
        <div className="relationship-list">
          {relationships.map((relationship) => (
            <article className="relationship-item" key={relationship.id}>
              <div>
                <strong>{relationship.people.join(" / ")}</strong>
                <span>{relationship.label}</span>
              </div>
              <p>{relationship.summary}</p>
              <blockquote>{relationship.evidence.text}</blockquote>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state inline">
          <strong>暂无明确人物关系</strong>
          <span>如果文章里多个人物没有在同一句或明确关系词附近出现，这里会保持空状态。</span>
        </div>
      )}
    </section>
  );
}

