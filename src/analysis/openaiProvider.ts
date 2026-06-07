import { cleanText, makeArticleMeta, normalizeName, splitSentences } from "./text";
import type {
  AiSettings,
  AnalysisResult,
  ArticleInput,
  Confidence,
  PersonCard,
  Relationship,
  Sentence,
} from "./types";

interface AiPerson {
  canonicalName: string;
  aliases: string[];
  identity: string;
  articleRole: string;
  timeline: string[];
  evidenceSentenceIds: string[];
  confidence: Confidence;
}

interface AiRelationship {
  people: string[];
  label: string;
  summary: string;
  evidenceSentenceIds: string[];
  confidence: Confidence;
}

interface AiResponsePayload {
  people: AiPerson[];
  relationships: AiRelationship[];
  uncertaintyNotes: string[];
}

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["people", "relationships", "uncertaintyNotes"],
  properties: {
    people: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "canonicalName",
          "aliases",
          "identity",
          "articleRole",
          "timeline",
          "evidenceSentenceIds",
          "confidence",
        ],
        properties: {
          canonicalName: { type: "string" },
          aliases: { type: "array", items: { type: "string" } },
          identity: { type: "string" },
          articleRole: { type: "string" },
          timeline: { type: "array", items: { type: "string" } },
          evidenceSentenceIds: { type: "array", items: { type: "string" } },
          confidence: { type: "string", enum: ["high", "medium", "uncertain"] },
        },
      },
    },
    relationships: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["people", "label", "summary", "evidenceSentenceIds", "confidence"],
        properties: {
          people: { type: "array", items: { type: "string" } },
          label: { type: "string" },
          summary: { type: "string" },
          evidenceSentenceIds: { type: "array", items: { type: "string" } },
          confidence: { type: "string", enum: ["high", "medium", "uncertain"] },
        },
      },
    },
    uncertaintyNotes: { type: "array", items: { type: "string" } },
  },
} as const;

const systemPrompt = [
  "你是 PeopleLens 的文章人物识别引擎。",
  "请只基于用户提供的文章标题、来源和带 ID 的句子生成 JSON。",
  "任务是生成本文人物演员表：公众人物或文章核心人物、其在本文中的角色、证据句和人物关系。",
  "不要补充无法从文章推出的百科信息；不确定就标记为 uncertain。",
  "每个人必须至少引用一个 evidenceSentenceIds。",
  "避免把公司、机构、产品、栏目名当成人物。",
  "必须输出合法 JSON，且 JSON 顶层字段必须是 people、relationships、uncertaintyNotes。",
].join("\n");

export async function analyzeArticleWithOpenAI(
  input: ArticleInput,
  settings: AiSettings,
): Promise<AnalysisResult> {
  const cleanedText = cleanText(input.text);
  const article = makeArticleMeta({ ...input, text: cleanedText });
  const sentences = splitSentences(cleanedText).slice(0, 120);
  const outputText =
    settings.protocol === "responses"
      ? await requestResponsesApi(input, settings, sentences)
      : await requestChatCompletions(input, settings, sentences);

  const parsed = parseAiPayload(outputText);
  return mapAiPayloadToResult(parsed, article, sentences);
}

async function requestChatCompletions(
  input: ArticleInput,
  settings: AiSettings,
  sentences: Sentence[],
) {
  const response = await fetch(joinBaseUrl(settings.baseUrl, "chat/completions"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: settings.model.trim() || "deepseek-v4-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: makeUserPrompt(input, sentences) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  const data = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "Chat Completions 请求失败。"));
  }

  const content = getPath(data, ["choices", 0, "message", "content"]);
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Chat Completions 响应中没有可解析的 JSON 文本。");
  }
  return content;
}

async function requestResponsesApi(input: ArticleInput, settings: AiSettings, sentences: Sentence[]) {
  const response = await fetch(joinBaseUrl(settings.baseUrl, "responses"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: settings.model.trim() || "gpt-5-mini",
      instructions: systemPrompt,
      input: [
        {
          role: "user",
          content: makeUserPrompt(input, sentences),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "peoplelens_cast",
          strict: true,
          schema,
        },
      },
    }),
  });

  const data = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, "Responses API 请求失败。"));
  }

  const outputText = extractResponsesOutputText(data);
  if (!outputText) {
    throw new Error("Responses API 响应中没有可解析的结构化文本。");
  }
  return outputText;
}

function makeUserPrompt(input: ArticleInput, sentences: Sentence[]) {
  return [
    "请按下面 JSON shape 输出，不要输出 Markdown：",
    JSON.stringify({
      people: [
        {
          canonicalName: "人物标准姓名",
          aliases: ["别名或简称"],
          identity: "一句话身份，优先来自原文",
          articleRole: "这个人在本文中的作用",
          timeline: ["来自原文或可由原文直接推出的履历/背景点"],
          evidenceSentenceIds: ["s1"],
          confidence: "high | medium | uncertain",
        },
      ],
      relationships: [
        {
          people: ["人物A", "人物B"],
          label: "关系标签",
          summary: "关系摘要",
          evidenceSentenceIds: ["s2"],
          confidence: "high | medium | uncertain",
        },
      ],
      uncertaintyNotes: ["不确定性说明"],
    }),
    "",
    `文章标题：${input.title || "未命名文章"}`,
    `来源 URL：${input.url || "无"}`,
    "句子列表：",
    ...sentences.map((sentence) => `${sentence.id}: ${sentence.text}`),
  ].join("\n");
}

function mapAiPayloadToResult(
  payload: AiResponsePayload,
  article: AnalysisResult["article"],
  sentences: Sentence[],
): AnalysisResult {
  const sentenceMap = new Map(sentences.map((sentence) => [sentence.id, sentence]));
  const people = payload.people
    .map((person, index): PersonCard => {
      const evidence = person.evidenceSentenceIds
        .map((id) => sentenceMap.get(id))
        .filter((sentence): sentence is Sentence => Boolean(sentence))
        .slice(0, 3);
      return {
        canonicalName: person.canonicalName,
        normalizedName: normalizeName(person.canonicalName),
        aliases: person.aliases,
        identity: person.identity,
        articleRole: person.articleRole,
        timeline: person.timeline.slice(0, 5),
        evidence,
        mentionCount: countMentions(person.canonicalName, sentences),
        importance: 100 - index,
        confidence: person.confidence,
      };
    })
    .filter((person) => person.canonicalName.trim() && person.evidence.length > 0);

  const relationships = payload.relationships
    .map((relationship, index): Relationship | null => {
      const evidence = relationship.evidenceSentenceIds
        .map((id) => sentenceMap.get(id))
        .find((sentence): sentence is Sentence => Boolean(sentence));
      if (!evidence || relationship.people.length < 2) {
        return null;
      }
      return {
        id: `ai-r${index + 1}`,
        people: relationship.people.slice(0, 3),
        label: relationship.label,
        summary: relationship.summary,
        evidence,
        confidence: relationship.confidence,
      };
    })
    .filter((relationship): relationship is Relationship => Boolean(relationship));

  return {
    article,
    people,
    relationships,
    uncertaintyNotes: payload.uncertaintyNotes,
  };
}

function parseAiPayload(outputText: string): AiResponsePayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error("AI 返回的内容不是合法 JSON，请重试或调整模型/协议设置。");
  }
  const error = validateAiPayload(parsed);
  if (error) {
    throw new Error(`AI 返回结构不符合 PeopleLens 要求：${error}`);
  }
  return parsed as AiResponsePayload;
}

function validateAiPayload(payload: unknown): string {
  if (!isRecord(payload)) {
    return "顶层结果必须是对象。";
  }
  if (!Array.isArray(payload.people)) {
    return "people 必须是数组。";
  }
  if (!Array.isArray(payload.relationships)) {
    return "relationships 必须是数组。";
  }
  if (!Array.isArray(payload.uncertaintyNotes)) {
    return "uncertaintyNotes 必须是数组。";
  }

  for (const [index, person] of payload.people.entries()) {
    if (!isRecord(person)) {
      return `people[${index}] 必须是对象。`;
    }
    const fields: Array<[string, (value: unknown) => boolean]> = [
      ["canonicalName", isNonEmptyString],
      ["identity", isString],
      ["articleRole", isString],
      ["aliases", isStringArray],
      ["timeline", isStringArray],
      ["evidenceSentenceIds", isStringArray],
      ["confidence", isConfidence],
    ];
    for (const [field, validator] of fields) {
      if (!validator(person[field])) {
        return `people[${index}].${field} 无效。`;
      }
    }
    if ((person.evidenceSentenceIds as string[]).length === 0) {
      return `people[${index}].evidenceSentenceIds 至少需要一个证据句 ID。`;
    }
  }

  for (const [index, relationship] of payload.relationships.entries()) {
    if (!isRecord(relationship)) {
      return `relationships[${index}] 必须是对象。`;
    }
    const fields: Array<[string, (value: unknown) => boolean]> = [
      ["people", isStringArray],
      ["label", isString],
      ["summary", isString],
      ["evidenceSentenceIds", isStringArray],
      ["confidence", isConfidence],
    ];
    for (const [field, validator] of fields) {
      if (!validator(relationship[field])) {
        return `relationships[${index}].${field} 无效。`;
      }
    }
  }

  if (!isStringArray(payload.uncertaintyNotes)) {
    return "uncertaintyNotes 只能包含字符串。";
  }

  return "";
}

function countMentions(name: string, sentences: Sentence[]) {
  return sentences.reduce((count, sentence) => count + (sentence.text.includes(name) ? 1 : 0), 0);
}

function joinBaseUrl(baseUrl: string, path: string) {
  const normalizedBase = (baseUrl || "https://api.deepseek.com").replace(/\/+$/g, "");
  return `${normalizedBase}/${path.replace(/^\/+/g, "")}`;
}

async function readJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new Error("API 返回的不是 JSON。若浏览器提示 Failed to fetch，可能是服务商 CORS 限制，需要改用本地代理。");
  }
}

function extractErrorMessage(data: unknown, fallback: string) {
  const message = getPath(data, ["error", "message"]);
  return typeof message === "string" ? message : fallback;
}

function extractResponsesOutputText(data: unknown) {
  if (isRecord(data) && typeof data.output_text === "string") {
    return data.output_text;
  }
  if (!isRecord(data) || !Array.isArray(data.output)) {
    return "";
  }
  return data.output
    .flatMap((item) => (isRecord(item) && Array.isArray(item.content) ? item.content : []))
    .map((content) => (isRecord(content) && typeof content.text === "string" ? content.text : ""))
    .join("");
}

function getPath(value: unknown, path: Array<string | number>) {
  return path.reduce<unknown>((current, key) => {
    if (Array.isArray(current) && typeof key === "number") {
      return current[key];
    }
    if (isRecord(current) && typeof key === "string") {
      return current[key];
    }
    return undefined;
  }, value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isConfidence(value: unknown): value is Confidence {
  return value === "high" || value === "medium" || value === "uncertain";
}
