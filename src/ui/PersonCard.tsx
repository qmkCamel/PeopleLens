import type { PersonCard as PersonCardType } from "../analysis/types";

interface PersonCardProps {
  person: PersonCardType;
  onToggleSaved: (person: PersonCardType) => void;
}

const confidenceText = {
  high: "高",
  medium: "中",
  uncertain: "不确定",
};

export function PersonCard({ onToggleSaved, person }: PersonCardProps) {
  const avatar = person.canonicalName.slice(0, 1).toUpperCase();
  const seenBefore = person.memory && person.memory.encounterCount > 1;

  return (
    <article className="person-card">
      <div className="person-topline">
        <div className="avatar" aria-hidden="true">
          {avatar}
        </div>
        <div>
          <h3>{person.canonicalName}</h3>
          <p>{person.identity}</p>
        </div>
        <button className="save-button" type="button" onClick={() => onToggleSaved(person)}>
          {person.memory?.saved ? "已保存" : "保存"}
        </button>
      </div>

      <p className="article-role">{person.articleRole}</p>

      <div className="meta-row">
        <span>{person.mentionCount} 次提及</span>
        <span>置信度：{confidenceText[person.confidence]}</span>
        {seenBefore ? <span>之前见过 {person.memory?.encounterCount} 次</span> : null}
      </div>

      {person.timeline.length > 0 ? (
        <div className="timeline-box">
          <strong>履历/背景</strong>
          <ul>
            {person.timeline.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="evidence-box">
        <strong>证据句</strong>
        {person.evidence.map((sentence) => (
          <p key={sentence.id}>{sentence.text}</p>
        ))}
      </div>
    </article>
  );
}
