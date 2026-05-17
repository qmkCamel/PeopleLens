import type { CandidateGroup, CandidateMention, Sentence } from "./types";
import { normalizeName } from "./text";

const chineseSurnames =
  "王李张刘陈杨赵黄周吴徐孙马朱胡郭何林高罗郑梁谢宋唐许韩冯邓曹彭曾萧田董潘袁蔡蒋余于杜叶程魏苏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤";

const roleWords = [
  "CEO",
  "founder",
  "co-founder",
  "president",
  "minister",
  "professor",
  "investor",
  "analyst",
  "director",
  "chairman",
  "创始人",
  "联合创始人",
  "总裁",
  "董事长",
  "教授",
  "总理",
  "总统",
  "投资人",
  "分析师",
  "负责人",
  "首席",
  "主管",
  "合伙人",
];

const relationshipWords = [
  "合作",
  "共同",
  "创办",
  "投资",
  "竞争",
  "批评",
  "起诉",
  "诉讼",
  "接替",
  "取代",
  "会见",
  "founded",
  "co-founded",
  "joined",
  "replaced",
  "criticized",
  "backed",
  "invested",
  "sued",
  "met",
  "competed",
];

const stopNames = new Set([
  "PeopleLens",
  "Web MVP",
  "Chrome Extension",
  "Manifest V3",
  "Side Panel",
  "Content Script",
  "Service Worker",
  "OpenAI",
  "API Key",
  "ChatGPT",
  "Hacker News",
  "今天",
  "文章",
  "公司",
  "记者",
  "编辑",
  "来源",
  "原标题",
  "作者",
  "一个",
  "这个",
  "这些",
  "他们",
  "我们",
  "自己",
  "公众",
  "平台",
  "市场",
  "产品",
  "用户",
  "方式",
  "范式",
  "向市",
  "向市场",
  "任何",
  "任务",
  "程师",
  "周期",
  "高度",
  "万名",
  "许可",
  "金雄",
  "金雄厚",
]);

const organizationHints = [
  "公司",
  "集团",
  "大学",
  "学院",
  "研究院",
  "委员会",
  "政府",
  "银行",
  "基金",
  "资本",
  "科技",
  "实验室",
  "日报",
  "时报",
  "新闻",
  "OpenAI",
  "Google",
  "Microsoft",
  "Tesla",
  "SpaceX",
];

export function extractCandidateGroups(sentences: Sentence[], title: string): CandidateGroup[] {
  const mentions = sentences.flatMap((sentence) => [
    ...extractEnglishMentions(sentence),
    ...extractChineseMentions(sentence),
  ]);

  const titleMentions = title
    ? [
        ...extractEnglishMentions({ id: "title", text: title, index: -1 }),
        ...extractChineseMentions({ id: "title", text: title, index: -1 }),
      ]
    : [];

  const grouped = new Map<string, CandidateGroup>();
  [...mentions, ...titleMentions].forEach((mention) => {
    const normalizedName = normalizeName(mention.name);
    if (!grouped.has(normalizedName)) {
      grouped.set(normalizedName, {
        canonicalName: mention.name,
        normalizedName,
        aliases: [mention.name],
        mentions: [],
      });
    }
    const group = grouped.get(normalizedName);
    if (!group) {
      return;
    }
    if (!group.aliases.includes(mention.name)) {
      group.aliases.push(mention.name);
    }
    group.mentions.push(mention);
  });

  return [...grouped.values()]
    .filter((group) => {
      const realMentions = group.mentions.filter((mention) => mention.sentence.id !== "title");
      const hasContext = group.mentions.some(
        (mention) => mention.hasRoleNearby || mention.hasRelationshipNearby,
      );
      const appearsInTitle = group.mentions.some((mention) => mention.sentence.id === "title");
      if (isChineseCandidate(group.canonicalName) && !hasContext && !appearsInTitle) {
        return false;
      }
      return realMentions.length >= 2 || hasContext || group.mentions.some((mention) => mention.sentence.id === "title");
    })
    .sort((a, b) => b.mentions.length - a.mentions.length);
}

function extractEnglishMentions(sentence: Sentence): CandidateMention[] {
  const matches = sentence.text.matchAll(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g);
  const mentions: CandidateMention[] = [];
  for (const match of matches) {
    const name = match[0].trim();
    if (shouldSkipName(name)) {
      continue;
    }
    mentions.push(toMention(name, sentence, match.index ?? 0));
  }
  return mentions;
}

function extractChineseMentions(sentence: Sentence): CandidateMention[] {
  const mentions: CandidateMention[] = [];

  for (let index = 0; index < sentence.text.length; index += 1) {
    const current = sentence.text[index];
    if (!current || !chineseSurnames.includes(current)) {
      continue;
    }

    for (const length of [2, 3, 4]) {
      const name = sentence.text.slice(index, index + length);
      if (!isLikelyChineseName(name) || shouldSkipName(name)) {
        continue;
      }
      mentions.push(toMention(name, sentence, index));
    }
  }

  return dedupeMentions(mentions);
}

function toMention(name: string, sentence: Sentence, start: number): CandidateMention {
  const windowStart = Math.max(0, start - 18);
  const windowEnd = Math.min(sentence.text.length, start + name.length + 18);
  const context = sentence.text.slice(windowStart, windowEnd);
  return {
    name,
    sentence,
    start,
    hasRoleNearby: roleWords.some((word) => context.includes(word)),
    hasRelationshipNearby: relationshipWords.some((word) => context.includes(word)),
  };
}

function shouldSkipName(name: string) {
  if (stopNames.has(name)) {
    return true;
  }
  if (name.length < 2 || name.length > 40) {
    return true;
  }
  if (/^\d+$/.test(name)) {
    return true;
  }
  if (roleWords.some((word) => name.includes(word))) {
    return true;
  }
  return organizationHints.some((hint) => name.includes(hint));
}

function isLikelyChineseName(name: string) {
  if (!/^[\u4e00-\u9fa5]{2,4}$/.test(name)) {
    return false;
  }
  if (!chineseSurnames.includes(name[0])) {
    return false;
  }
  if (/[称说指在和与的了是将对为把被从向就都及或但而其这那他她它]$/.test(name)) {
    return false;
  }
  if (/[创始终未已正新旧原本该些者式务师度名可许]$/.test(name)) {
    return false;
  }
  if (/[创始市场]/.test(name)) {
    return false;
  }
  if (/[，。！？；、“”：《》]/.test(name)) {
    return false;
  }
  return true;
}

function dedupeMentions(mentions: CandidateMention[]) {
  const seen = new Set<string>();
  return mentions.filter((mention) => {
    const key = `${mention.name}-${mention.start}-${mention.sentence.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isChineseCandidate(name: string) {
  return /^[\u4e00-\u9fa5]{2,4}$/.test(name);
}

export function getRoleHint(name: string, sentences: Sentence[]) {
  for (const sentence of sentences) {
    const index = sentence.text.indexOf(name);
    if (index === -1) {
      continue;
    }
    const context = sentence.text.slice(Math.max(0, index - 20), index + name.length + 36);
    const role = roleWords.find((word) => context.includes(word));
    if (role) {
      return role;
    }
  }
  return "";
}

export function hasRelationshipSignal(sentence: string) {
  return relationshipWords.some((word) => sentence.includes(word));
}
