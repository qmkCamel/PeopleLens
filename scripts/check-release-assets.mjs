import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const requiredWebFiles = [
  "dist/index.html",
  "dist/privacy.html",
  "dist/terms.html",
  "dist/robots.txt",
  "dist/site.webmanifest",
  "dist/favicon.svg",
];

const requiredExtensionFiles = [
  "extension-dist/manifest.json",
  "extension-dist/sidepanel.html",
  "extension-dist/sidepanel.js",
  "extension-dist/sidepanel.css",
  "extension-dist/service-worker.js",
];

for (const file of [...requiredWebFiles, ...requiredExtensionFiles]) {
  await assertExists(file);
}

const manifest = JSON.parse(await readFile(resolve("extension-dist/manifest.json"), "utf8"));
const iconPaths = new Set([
  ...Object.values(manifest.icons ?? {}),
  ...Object.values(manifest.action?.default_icon ?? {}),
]);

for (const iconPath of iconPaths) {
  await assertExists(`extension-dist/${iconPath}`);
}

console.log("Release assets OK");

async function assertExists(file) {
  try {
    await access(resolve(file));
  } catch {
    throw new Error(`Missing release asset: ${file}`);
  }
}
