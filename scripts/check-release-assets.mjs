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

assertManifest(manifest);

console.log("Release assets OK");

async function assertExists(file) {
  try {
    await access(resolve(file));
  } catch {
    throw new Error(`Missing release asset: ${file}`);
  }
}

function assertManifest(manifest) {
  const permissions = new Set(manifest.permissions ?? []);
  for (const permission of ["activeTab", "scripting", "sidePanel", "storage"]) {
    if (!permissions.has(permission)) {
      throw new Error(`Missing extension permission: ${permission}`);
    }
  }

  const hostPermissions = manifest.host_permissions ?? [];
  for (const host of ["https://api.deepseek.com/*", "https://api.openai.com/*"]) {
    if (!hostPermissions.includes(host)) {
      throw new Error(`Missing extension host permission: ${host}`);
    }
  }
  for (const host of hostPermissions) {
    if (host === "<all_urls>" || host.includes("*://") || host.includes("://*")) {
      throw new Error(`Broad extension host permission is not allowed for this release: ${host}`);
    }
  }

  if (manifest.side_panel?.default_path !== "sidepanel.html") {
    throw new Error("Manifest side panel default path must be sidepanel.html");
  }
  if (manifest.background?.service_worker !== "service-worker.js") {
    throw new Error("Manifest service worker must be service-worker.js");
  }
}
