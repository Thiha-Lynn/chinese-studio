// Restore the immutable, checksum-pinned original-media archive for fresh clones/CI.
import {
  readFileSync,
  existsSync,
  statSync,
  createReadStream,
  createWriteStream,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { execFileSync } from "node:child_process";
const manifest = JSON.parse(
  readFileSync("library/chinese1/media-manifest.json", "utf8"),
);
const files = [
  ...new Map(
    manifest.filter((r) => r.status === "downloaded").map((r) => [r.file, r]),
  ).values(),
];
const root = path.resolve("library/chinese1");
const complete = () =>
  files.every(
    (r) =>
      existsSync(path.join(root, "media", r.file)) &&
      statSync(path.join(root, "media", r.file)).size === r.bytes,
  );
async function hash(file) {
  const h = createHash("sha256");
  for await (const chunk of createReadStream(file)) h.update(chunk);
  return h.digest("hex");
}
if (!complete()) {
  const source = JSON.parse(
    readFileSync("content/chinese1-media-archive.json", "utf8"),
  );
  const dir = mkdtempSync(path.join(tmpdir(), "chinese1-media-"));
  try {
    console.log(
      "Restoring original Chinese 1 media archive (approximately 1.3 GB)…",
    );
    const response = await fetch(source.url);
    if (!response.ok || !response.body)
      throw Error(`Media archive download failed: HTTP ${response.status}`);
    const archive = path.join(dir, "media.tar.gz");
    await pipeline(Readable.fromWeb(response.body), createWriteStream(archive));
    if ((await hash(archive)) !== source.sha256)
      throw Error("Media archive checksum mismatch");
    execFileSync("tar", ["-xzf", archive, "-C", root]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
for (const file of files) {
  if ((await hash(path.join(root, "media", file.file))) !== file.sha256)
    throw Error("Original media checksum mismatch: " + file.file);
}
console.log(
  `Verified ${files.length} original media files (${manifest.length} source references).`,
);
