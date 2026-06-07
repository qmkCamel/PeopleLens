export type Confidence = "high" | "medium" | "uncertain";

export interface ArticleInput {
  title: string;
  url: string;
  text: string;
}

export interface ArticleMeta {
  id: string;
  title: string;
  url: string;
  domain: string;
  analyzedAt: string;
  textHash: string;
}

export interface Sentence {
  id: string;
  text: string;
  index: number;
}

export interface PersonMemory {
  normalizedName: string;
  canonicalName: string;
  saved: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  encounterCount: number;
  sources: Array<{
    title: string;
    url: string;
    seenAt: string;
  }>;
}

export interface PersonCard {
  canonicalName: string;
  normalizedName: string;
  aliases: string[];
  identity: string;
  articleRole: string;
  timeline: string[];
  evidence: Sentence[];
  mentionCount: number;
  importance: number;
  confidence: Confidence;
  memory?: PersonMemory;
}

export interface Relationship {
  id: string;
  people: string[];
  label: string;
  summary: string;
  evidence: Sentence;
  confidence: Confidence;
}

export interface AnalysisResult {
  article: ArticleMeta;
  people: PersonCard[];
  relationships: Relationship[];
  uncertaintyNotes: string[];
}

export interface CandidateMention {
  name: string;
  sentence: Sentence;
  start: number;
  hasRoleNearby: boolean;
  hasRelationshipNearby: boolean;
}

export interface CandidateGroup {
  canonicalName: string;
  normalizedName: string;
  aliases: string[];
  mentions: CandidateMention[];
}

export type AiProtocol = "chat_completions" | "responses";

export interface AiSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  protocol: AiProtocol;
}
