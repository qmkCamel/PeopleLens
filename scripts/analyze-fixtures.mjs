import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const outfile = resolve(".tmp/fixtures-analyze/analyze-fixtures-entry.mjs");

await mkdir(resolve(".tmp/fixtures-analyze"), { recursive: true });
await build({
  bundle: true,
  entryPoints: [resolve("scripts/analyze-fixtures-entry.ts")],
  format: "esm",
  logLevel: "silent",
  outfile,
  platform: "node",
  target: "node20",
});

await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`);
