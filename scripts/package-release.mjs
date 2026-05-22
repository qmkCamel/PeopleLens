import { mkdir, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import packageJson from "../package.json" with { type: "json" };

const execFileAsync = promisify(execFile);
const releaseDir = resolve(".release");
const extensionZip = resolve(releaseDir, `peoplelens-extension-${packageJson.version}.zip`);

await mkdir(releaseDir, { recursive: true });
await rm(extensionZip, { force: true });

await execFileAsync("zip", ["-r", extensionZip, "."], {
  cwd: resolve("extension-dist"),
});

console.log(`Web release directory: ${resolve("dist")}`);
console.log(`Extension release package: ${extensionZip}`);
