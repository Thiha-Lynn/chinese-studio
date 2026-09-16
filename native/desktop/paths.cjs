const path = require("node:path");
function resolveResource(root, input) {
  const url = new URL(input);
  if (url.protocol !== "studio:" || url.hostname !== "app")
    throw Error("Unknown origin");
  const pathname = decodeURIComponent(url.pathname);
  const file = path.resolve(root, "." + pathname);
  if (
    pathname.includes("\\") ||
    pathname.includes("\0") ||
    (file !== root && !file.startsWith(root + path.sep))
  )
    throw Error("Invalid path");
  if (pathname.startsWith("/api/") || pathname.startsWith("/auth/"))
    return null;
  return !path.extname(file) && !pathname.startsWith("/library/")
    ? path.join(root, "index.html")
    : file;
}
module.exports = { resolveResource };
