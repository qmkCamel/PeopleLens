import type { PersonCard, Relationship, Sentence } from "./types";
import { hasRelationshipSignal } from "./extractCandidates";

const labelRules: Array<[string, string[]]> = [
  ["共同创办", ["共同创办", "联合创始", "co-founded", "founded"]],
  ["投资关系", ["投资", "invested", "backed"]],
  ["竞争关系", ["竞争", "对手", "competed", "rival"]],
  ["批评/反对", ["批评", "反对", "criticized"]],
  ["法律争议", ["起诉", "诉讼", "sued", "lawsuit"]],
  ["接任/替代", ["接替", "取代", "replaced"]],
  ["合作/会见", ["合作", "会见", "met", "joined"]],
];

export function extractRelationships(people: PersonCard[], sentences: Sentence[]): Relationship[] {
  const importantPeople = people.slice(0, 10);
  const relationships: Relationship[] = [];
  const seenPairs = new Set<string>();

  sentences.forEach((sentence) => {
    const present = importantPeople.filter((person) => sentence.text.includes(person.canonicalName));
    if (present.length < 2) {
      return;
    }

    for (let left = 0; left < present.length; left += 1) {
      for (let right = left + 1; right < present.length; right += 1) {
        const pair = [present[left].canonicalName, present[right].canonicalName].sort();
        const key = `${pair[0]}::${pair[1]}`;
        if (seenPairs.has(key)) {
          continue;
        }
        seenPairs.add(key);
        const label = classifyRelationship(sentence.text);
        relationships.push({
          id: `r${relationships.length + 1}`,
          people: pair,
          label,
          summary: `${pair[0]} 与 ${pair[1]}：${label === "同时被提及" ? "在同一句上下文中被提及，建议结合证据句判断关系。" : `原文暗示存在${label}。`}`,
          evidence: sentence,
          confidence: hasRelationshipSignal(sentence.text) ? "medium" : "uncertain",
        });
      }
    }
  });

  return relationships.slice(0, 8);
}

function classifyRelationship(sentence: string) {
  const matched = labelRules.find(([, words]) => words.some((word) => sentence.includes(word)));
  return matched?.[0] ?? "同时被提及";
}

