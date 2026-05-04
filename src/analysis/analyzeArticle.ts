import { extractCandidateGroups, getRoleHint } from "./extractCandidates";
import { extractRelationships } from "./relationships";
import { cleanText, makeArticleMeta, splitSentences } from "./text";
import type { AnalysisResult, ArticleInput, CandidateGroup, Confidence, PersonCard, Sentence } from "./types";

export function analyzeArticle(input: ArticleInput): AnalysisResult {
  const cleanedText = cleanText(input.text);
  const sentences = splitSentences(cleanedText);
  const article = makeArticleMeta({ ...input, text: cleanedText });
  const groups = extractCandidateGroups(sentences, input.title);
  const people = groups
    .map((group) => toPersonCard(group, sentences, input.title))
    .filter((person) => person.evidence.length > 0)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 18);

  const relationships = extractRelationships(people, sentences);
  const uncertaintyNotes = buildUncertaintyNotes(people, relationships);

  return {
    article,
    people,
    relationships,
    uncertaintyNotes,
  };
}

function toPersonCard(group: CandidateGroup, sentences: Sentence[], title: string): PersonCard {
  const evidence = uniqueSentences(
    group.mentions
      .filter((mention) => mention.sentence.id !== "title")
      .map((mention) => mention.sentence),
  ).slice(0, 2);
  const mentionCount = group.mentions.filter((mention) => mention.sentence.id !== "title").length;
  const firstIndex = Math.min(...evidence.map((sentence) => sentence.index));
  const roleHint = getRoleHint(group.canonicalName, sentences);
  const relationshipMentions = group.mentions.filter((mention) => mention.hasRelationshipNearby).length;
  const importance =
    mentionCount * 2 +
    (title.includes(group.canonicalName) ? 6 : 0) +
    (firstIndex >= 0 && firstIndex <= 2 ? 3 : 0) +
    (roleHint ? 4 : 0) +
    relationshipMentions * 3;
  const confidence = getConfidence(mentionCount, roleHint, relationshipMentions);

  return {
    canonicalName: group.canonicalName,
    normalizedName: group.normalizedName,
    aliases: group.aliases,
    identity: roleHint ? `原文附近出现身份线索：${roleHint}` : "原文未给出明确身份，可结合证据句判断。",
    articleRole: makeArticleRole(group.canonicalName, evidence),
    timeline: [],
    evidence,
    mentionCount,
    importance,
    confidence,
  };
}

function uniqueSentences(sentences: Sentence[]) {
  const seen = new Set<string>();
  return sentences.filter((sentence) => {
    if (seen.has(sentence.id)) {
      return false;
    }
    seen.add(sentence.id);
    return true;
  });
}

function getConfidence(mentionCount: number, roleHint: string, relationshipMentions: number): Confidence {
  if (mentionCount >= 3 || (mentionCount >= 2 && roleHint)) {
    return "high";
  }
  if (mentionCount >= 2 || roleHint || relationshipMentions > 0) {
    return "medium";
  }
  return "uncertain";
}

function makeArticleRole(name: string, evidence: Sentence[]) {
  const firstEvidence = evidence[0]?.text ?? "";
  if (!firstEvidence) {
    return "当前文章提到了这个人物，但证据不足，需要人工确认。";
  }
  const clipped = firstEvidence.length > 76 ? `${firstEvidence.slice(0, 76)}...` : firstEvidence;
  return `${name} 在本文中主要出现在这段语境里：“${clipped}”`;
}

function buildUncertaintyNotes(people: PersonCard[], relationships: AnalysisResult["relationships"]) {
  const notes: string[] = [];
  if (people.length === 0) {
    notes.push("没有抽取到高可信人物。可以尝试粘贴更完整的正文，或保留标题和导语。");
  }
  if (people.some((person) => person.confidence === "uncertain")) {
    notes.push("部分人物缺少职位或关系上下文，已标记为不确定。");
  }
  if (relationships.length === 0) {
    notes.push("未发现明确的人物同句关系，关系区会显示空状态。");
  }
  return notes;
}
