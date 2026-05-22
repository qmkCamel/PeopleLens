import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";
import { generateExtensionIcons } from "./generate-extension-icons.mjs";

const outdir = resolve("extension-dist");

await generateExtensionIcons();
await rm(outdir, { force: true, recursive: true });
await mkdir(outdir, { recursive: true });
await cp(resolve("extension/icons"), resolve(outdir, "icons"), { recursive: true });

await Promise.all([
  copyFile(resolve("extension/manifest.json"), resolve(outdir, "manifest.json")),
  copyFile(resolve("extension/service-worker.js"), resolve(outdir, "service-worker.js")),
  copyFile(resolve("extension/sidepanel.html"), resolve(outdir, "sidepanel.html")),
]);

await build({
  bundle: true,
  entryNames: "[name]",
  entryPoints: [resolve("extension/sidepanel.tsx")],
  format: "esm",
  loader: {
    ".css": "css",
  },
  outdir,
  platform: "browser",
  sourcemap: false,
  splitting: false,
  target: ["chrome120"],
});

console.log(`Extension package ready: ${outdir}`);
