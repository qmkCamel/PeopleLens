import type { ArticleMeta, PersonCard, PersonMemory } from "../analysis/types";

const storageKey = "peoplelens.memory.v1";

type MemoryMap = Record<string, PersonMemory>;

export function getMemoryMap(): MemoryMap {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as MemoryMap;
  } catch {
    return {};
  }
}

export function recordEncounter(person: PersonCard, article: ArticleMeta) {
  const memory = getMemoryMap();
  const existing = memory[person.normalizedName];
  const seenAt = new Date().toISOString();
  const source = {
    title: article.title,
    url: article.url,
    seenAt,
  };

  memory[person.normalizedName] = {
    normalizedName: person.normalizedName,
    canonicalName: person.canonicalName,
    saved: existing?.saved ?? false,
    firstSeenAt: existing?.firstSeenAt ?? seenAt,
    lastSeenAt: seenAt,
    encounterCount: (existing?.encounterCount ?? 0) + 1,
    sources: dedupeSources([source, ...(existing?.sources ?? [])]).slice(0, 6),
  };
  saveMemory(memory);
}

export function toggleSavedPerson(person: PersonCard, article?: ArticleMeta) {
  const memory = getMemoryMap();
  const existing = memory[person.normalizedName];
  const now = new Date().toISOString();
  memory[person.normalizedName] = {
    normalizedName: person.normalizedName,
    canonicalName: person.canonicalName,
    saved: !(existing?.saved ?? false),
    firstSeenAt: existing?.firstSeenAt ?? now,
    lastSeenAt: existing?.lastSeenAt ?? now,
    encounterCount: existing?.encounterCount ?? 1,
    sources: existing?.sources?.length
      ? existing.sources
      : article
        ? [{ title: article.title, url: article.url, seenAt: now }]
        : [],
  };
  saveMemory(memory);
}

export function clearMemory() {
  localStorage.removeItem(storageKey);
}

function saveMemory(memory: MemoryMap) {
  localStorage.setItem(storageKey, JSON.stringify(memory));
}

function dedupeSources(sources: PersonMemory["sources"]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = `${source.title}::${source.url}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

