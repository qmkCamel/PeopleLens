import type { AnalysisResult } from "./types";

export function exportAnalysisAsMarkdown(result: AnalysisResult) {
  const lines: string[] = [];
  lines.push(`# ${result.article.title}`);
  if (result.article.url) {
    lines.push("");
    lines.push(`来源：${result.article.url}`);
  }
  lines.push("");
  lines.push(`分析时间：${new Date(result.article.analyzedAt).toLocaleString()}`);
  lines.push("");
  lines.push("## 本文人物");
  if (result.people.length === 0) {
    lines.push("");
    lines.push("未识别到人物。");
  }
  result.people.forEach((person, index) => {
    lines.push("");
    lines.push(`### ${index + 1}. ${person.canonicalName}`);
    lines.push("");
    lines.push(`- 身份线索：${person.identity}`);
    lines.push(`- 在本文中：${person.articleRole}`);
    lines.push(`- 提及次数：${person.mentionCount}`);
    lines.push(`- 置信度：${person.confidence}`);
    if (person.memory?.saved) {
      lines.push("- 本地记忆：已保存");
    }
    if (person.timeline.length > 0) {
      lines.push("- 履历/背景：");
      person.timeline.forEach((item) => {
        lines.push(`  - ${item}`);
      });
    }
    lines.push("- 证据句：");
    person.evidence.forEach((sentence) => {
      lines.push(`  - ${sentence.text}`);
    });
  });

  lines.push("");
  lines.push("## 人物关系");
  if (result.relationships.length === 0) {
    lines.push("");
    lines.push("未发现明确人物关系。");
  }
  result.relationships.forEach((relationship) => {
    lines.push("");
    lines.push(`- **${relationship.people.join(" / ")}**：${relationship.summary}`);
    lines.push(`  - 证据：${relationship.evidence.text}`);
  });

  if (result.uncertaintyNotes.length > 0) {
    lines.push("");
    lines.push("## 不确定性说明");
    result.uncertaintyNotes.forEach((note) => {
      lines.push(`- ${note}`);
    });
  }

  return `${lines.join("\n")}\n`;
}
