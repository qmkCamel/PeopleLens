import type { ArticleInput, ArticleMeta, Sentence } from "./types";

export function cleanText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitSentences(text: string): Sentence[] {
  const cleaned = cleanText(text);
  const chunks = cleaned
    .split(/(?<=[。！？；!?;])\s*|\n+/u)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8 && !isBoilerplate(item));

  return chunks.map((sentence, index) => ({
    id: `s${index + 1}`,
    text: sentence,
    index,
  }));
}

export function normalizeName(name: string) {
  return name.replace(/[·.\s]/g, "").toLocaleLowerCase();
}

export function makeArticleMeta(input: ArticleInput): ArticleMeta {
  const title = input.title.trim() || "未命名文章";
  const url = input.url.trim();
  return {
    id: `${Date.now()}-${hashText(`${title}${url}${input.text}`).slice(0, 8)}`,
    title,
    url,
    domain: extractDomain(url),
    analyzedAt: new Date().toISOString(),
    textHash: hashText(input.text),
  };
}

export function hashText(text: string) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function extractDomain(url: string) {
  if (!url) {
    return "";
  }
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function isBoilerplate(text: string) {
  const boilerplate = [
    "微信扫一扫",
    "继续滑动看下一个",
    "轻触阅读原文",
    "分享给朋友",
    "在看",
    "阅读原文",
  ];
  return boilerplate.some((item) => text.includes(item));
}

