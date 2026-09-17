import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (file) => readFileSync(file, "utf8");
const json = (file) => JSON.parse(read(file));
const pkg = json("package.json"),
  desktop = json("native/desktop/package.json");
const capacitor = json("capacitor.config.json"),
  manifest = json("public/manifest.webmanifest");
assert.equal(desktop.version, pkg.version, "Desktop version must match web");
assert.match(
  read("android/app/build.gradle"),
  new RegExp(`versionName "${pkg.version.replaceAll(".", "\\.")}"`),
);
assert.equal(
  capacitor.appId,
  desktop.build.appId,
  "Preserve installed application identity",
);
assert.equal(capacitor.appName, "ESC Chinese");
assert.equal(desktop.build.productName, "ESC Chinese");
assert.equal(manifest.short_name, "ESC Chinese");
assert.equal(
  desktop.name,
  "chinese-studio-desktop",
  "Preserve Electron's existing default data directory",
);
assert.equal(
  desktop.build.artifactName,
  "esc-chinese-${version}-${os}-${arch}.${ext}",
);
assert.ok(desktop.build.linux.target.includes("deb"));
assert.ok(desktop.build.linux.target.includes("AppImage"));
assert.ok(desktop.build.mac.target.includes("dmg"));
assert.ok(desktop.build.win.target.includes("nsis"));
assert.match(read("build/client/index.html"), /ESC Chinese/);
assert.equal(json("build/client/manifest.webmanifest").name, manifest.name);
console.log(
  `PASS: ESC ${pkg.version} branding, update identity, metadata and all desktop targets`,
);
