import {
  cpSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const name = `chinese-studio-${version}-portable`,
  dir = `release/${name}`;
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
cpSync("build/client", dir + "/web", { recursive: true });
cpSync("scripts/serve-portable.mjs", dir + "/serve.mjs");
for (const file of ["LICENSE", "THIRD_PARTY_NOTICES.md", "README.md"])
  cpSync(file, dir + "/" + file);
writeFileSync(
  dir + "/start.sh",
  '#!/bin/sh\ncd "$(dirname "$0")" || exit 1\nnode serve.mjs\n',
  { mode: 0o755 },
);
writeFileSync(
  dir + "/start.cmd",
  '@echo off\r\ncd /d "%~dp0"\r\nnode serve.mjs\r\npause\r\n',
);
writeFileSync(
  dir + "/START-HERE.txt",
  "Chinese Studio portable\nInstall Node.js 24+ once.\nWindows: double-click start.cmd\nmacOS/Linux: run sh start.sh in Terminal\nOpen http://127.0.0.1:4173/learn\nAll course files are bundled; no internet needed. Progress is stored in your browser, not this folder. Export before changing browsers.\n",
);
const zip = name + ".zip";
if (process.platform === "win32")
  execFileSync("powershell", [
    "-NoProfile",
    "-Command",
    `Compress-Archive -Path '${dir}' -DestinationPath 'release/${zip}' -Force`,
  ]);
else execFileSync("zip", ["-q", "-r", zip, name], { cwd: "release" });
writeFileSync(
  "release/SHA256SUMS",
  createHash("sha256")
    .update(readFileSync("release/" + zip))
    .digest("hex") +
    "  " +
    zip +
    "\n",
);
console.log("Created release/" + zip);
