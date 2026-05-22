import type { ArticleMeta, PersonCard, PersonMemory } from "../analysis/types";

const storageKey = "peoplelens.memory.v1";

type MemoryMap = Record<string, PersonMemory>;

export interface MemoryEntry extends PersonMemory {
  latestSourceTitle: string;
  latestSourceUrl: string;
}

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

export function getMemoryEntries(): MemoryEntry[] {
  return Object.values(getMemoryMap())
    .map((entry) => {
      const latestSource = entry.sources[0];
      return {
        ...entry,
        latestSourceTitle: latestSource?.title ?? "",
        latestSourceUrl: latestSource?.url ?? "",
      };
    })
    .sort((left, right) => {
      if (left.saved !== right.saved) {
        return left.saved ? -1 : 1;
      }
      return new Date(right.lastSeenAt).getTime() - new Date(left.lastSeenAt).getTime();
    });
}

export function exportMemoryJson() {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: 1,
      people: getMemoryEntries(),
    },
    null,
    2,
  );
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
