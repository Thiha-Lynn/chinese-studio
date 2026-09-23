import {
  cpSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
} from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
const root = path.resolve("build/client");
cpSync("content/course.json", path.join(root, "course.json"));
cpSync("content/chinese1.json", path.join(root, "chinese1.json"));
const chinese1 = JSON.parse(readFileSync("content/chinese1.json", "utf8"));
cpSync(
  "native/ANDROID_NOTICES.txt",
  path.join(root, "NATIVE_SOFTWARE_NOTICES.txt"),
);
cpSync("library", path.join(root, "library"), { recursive: true });
const course = JSON.parse(readFileSync("content/course.json", "utf8"));
const characters = new Set(
  [...course.vocab, ...chinese1.vocab].flatMap(
    (w) => w.hanzi.match(/[\u3400-\u9fff]/g) || [],
  ),
);
mkdirSync(path.join(root, "library/glyphs"), { recursive: true });
let missing = [];
for (const c of characters) {
  const from = path.join("node_modules/hanzi-writer-data", c + ".json");
  if (existsSync(from))
    cpSync(from, path.join(root, "library/glyphs", c + ".json"));
  else missing.push(c);
}
cpSync(
  "node_modules/hanzi-writer-data/ARPHICPL.TXT",
  path.join(root, "library/glyphs/LICENSE"),
);
const notices = [
  "react",
  "react-dom",
  "scheduler",
  "lucide-react",
  "hanzi-writer",
  "zod",
  "@capacitor/core",
  "@capacitor/filesystem",
  "@capacitor/share",
]
  .map((pkg) => {
    const dir = path.join("node_modules", pkg);
    const file = readdirSync(dir).find((n) => /^license(\.|$)/i.test(n));
    if (!file) throw new Error("Missing license: " + pkg);
    return pkg + "\n" + readFileSync(path.join(dir, file), "utf8");
  })
  .join("\n\n----------------------------------------\n\n");
writeFileSync(path.join(root, "THIRD_PARTY_SOFTWARE_LICENSES.txt"), notices);
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(root)
  .filter((f) => !f.endsWith("/sw.js"))
  .map((p) => ({
    url:
      "/" +
      path.relative(root, p).split(path.sep).map(encodeURIComponent).join("/"),
    bytes: statSync(p).size,
    hash: createHash("sha256").update(readFileSync(p)).digest("hex"),
  }));
const version = createHash("sha256")
  .update(JSON.stringify(files))
  .digest("hex")
  .slice(0, 16);
const core = files
  .filter((f) => !f.url.startsWith("/library/"))
  .map((f) => f.url);
const manifest = {
  version,
  core,
  videos: files
    .filter((f) => /\.(mp4|webm)$/i.test(f.url))
    .map(({ url, bytes }) => ({ url, bytes })),
  files: files
    .filter(
      (f) => f.url.startsWith("/library/") && !/\.(mp4|webm)$/i.test(f.url),
    )
    .map(({ url, bytes }) => ({ url, bytes })),
};
writeFileSync(
  path.join(root, "offline-manifest.json"),
  JSON.stringify(manifest),
);
const sw = readFileSync("scripts/service-worker.js", "utf8")
  .replace("__VERSION__", version)
  .replace("__CORE__", JSON.stringify([...core, "/offline-manifest.json"]));
writeFileSync(path.join(root, "sw.js"), sw);
console.log(
  `Offline build: ${version}; ${characters.size - missing.length} stroke guides; ${manifest.files.length} resources; missing guides: ${missing.join(" ") || "none"}`,
);
