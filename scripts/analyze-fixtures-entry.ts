import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { analyzeArticle } from "../src/analysis/analyzeArticle";

interface FixtureArticle {
  id: string;
  title: string;
  url: string;
  textPath: string;
  textStatus: string;
  expected?: {
    topPeople?: string[];
    excludedFalsePositives?: string[];
  };
}

const rootDir = process.cwd();
const manifestPath = resolve(rootDir, "fixtures/articles.json");
const articles = JSON.parse(await readFile(manifestPath, "utf8")) as FixtureArticle[];

let readyCount = 0;
let failedCount = 0;

for (const article of articles) {
  if (article.textStatus !== "ready") {
    console.log(`SKIP ${article.id}: textStatus=${article.textStatus}`);
    continue;
  }

  readyCount += 1;
  try {
    const textPath = resolve(rootDir, article.textPath);
    const text = await readFile(textPath, "utf8");
    const result = analyzeArticle({
      title: article.title,
      url: article.url,
      text,
    });
    const people = result.people.slice(0, 8).map((person) => ({
      name: person.canonicalName,
      mentions: person.mentionCount,
      confidence: person.confidence,
    }));
    const relationships = result.relationships.slice(0, 5).map((relationship) => ({
      people: relationship.people,
      label: relationship.label,
      confidence: relationship.confidence,
    }));

    console.log(`\n${article.id}`);
    console.log(`title: ${result.article.title}`);
    console.log(`people: ${result.people.length}`);
    console.table(people);
    if (relationships.length > 0) {
      console.log("relationships:");
      console.table(relationships);
    }
    if (article.expected?.topPeople?.length) {
      const found = new Set(result.people.map((person) => person.canonicalName));
      const missing = article.expected.topPeople.filter((name) => !found.has(name));
      if (missing.length > 0) {
        failedCount += 1;
        console.error(`missing expected top people: ${missing.join(", ")}`);
      }
    }
    if (article.expected?.excludedFalsePositives?.length) {
      const found = new Set(result.people.map((person) => person.canonicalName));
      const falsePositives = article.expected.excludedFalsePositives.filter((name) => found.has(name));
      if (falsePositives.length > 0) {
        failedCount += 1;
        console.error(`found excluded false positives: ${falsePositives.join(", ")}`);
      }
    }
  } catch (error) {
    failedCount += 1;
    console.error(`FAIL ${article.id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (readyCount === 0) {
  console.error("No ready fixtures found.");
  process.exitCode = 1;
} else if (failedCount > 0) {
  process.exitCode = 1;
}
