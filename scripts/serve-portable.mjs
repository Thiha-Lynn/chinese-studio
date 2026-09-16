import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(process.env.STUDIO_WEB_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), "web"));
const types = {
  ".txt": "text/plain; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    let pathname = decodeURIComponent(url.pathname);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-cache");
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }
    if (pathname === "/api/session") {
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          user: null,
          authReady: false,
          aiReady: false,
          mode: "portable",
        }),
      );
      return;
    }
    if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error:
            "This portable app works locally. Account and AI services are available only on a configured online host.",
        }),
      );
      return;
    }
    let file = path.resolve(root, "." + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    let info;
    try {
      info = await stat(file);
    } catch {
      if (
        path.extname(file) ||
        pathname.startsWith("/library/") ||
        pathname.startsWith("/assets/")
      ) {
        res.writeHead(404);
        res.end();
        return;
      }
    }
    if (!info || info.isDirectory()) {
      file = path.join(root, "index.html");
      info = await stat(file);
    }
    res.setHeader(
      "Content-Type",
      types[path.extname(file)] || "application/octet-stream",
    );
    res.setHeader("Accept-Ranges", "bytes");
    let start = 0,
      end = info.size - 1,
      status = 200;
    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!m) {
        res.writeHead(416);
        res.end();
        return;
      }
      start = m[1] ? Number(m[1]) : Math.max(0, info.size - Number(m[2]));
      end = m[1] && m[2] ? Math.min(Number(m[2]), end) : end;
      if (start > end || start >= info.size) {
        res.writeHead(416, { "Content-Range": `bytes */${info.size}` });
        res.end();
        return;
      }
      status = 206;
      res.setHeader("Content-Range", `bytes ${start}-${end}/${info.size}`);
    }
    res.writeHead(status, { "Content-Length": String(end - start + 1) });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(file, { start, end })
      .on("error", () => res.destroy())
      .pipe(res);
  } catch {
    res.writeHead(400);
    res.end("Could not read this resource.");
  }
});
server.listen(Number(process.env.PORT || 4173), "127.0.0.1", () =>
  console.log(
    `Chinese Studio: http://127.0.0.1:${server.address().port}/learn\nKeep this window open while studying. Press Ctrl+C to stop.`,
  ),
);
