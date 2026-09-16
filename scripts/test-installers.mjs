import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const output = path.resolve("release/desktop");
const work = await mkdtemp(path.join(tmpdir(), "studio-installer-"));
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    timeout: 180000,
    ...options,
  });
  if (result.error || result.status !== 0)
    throw result.error || Error(`${command} exited ${result.status}`);
}
const files = await readdir(output);
const artifact = (extension) =>
  path.join(
    output,
    files.find((f) => f.endsWith(extension)) || "missing-artifact",
  );
function test(executable) {
  console.log("Testing installed executable:", executable);
  run(process.execPath, ["scripts/test-desktop.mjs"], {
    env: { ...process.env, STUDIO_EXECUTABLE: executable },
  });
}
try {
  if (process.platform === "win32") {
    const destination = path.join(work, "installed");
    run(artifact(".exe"), ["/S", `/D=${destination}`]);
    test(path.join(destination, "Chinese Studio.exe"));
  } else if (process.platform === "darwin") {
    const mount = path.join(work, "mounted");
    run("hdiutil", [
      "attach",
      artifact(".dmg"),
      "-nobrowse",
      "-readonly",
      "-mountpoint",
      mount,
    ]);
    try {
      const app = path.join(work, "Chinese Studio.app");
      run("ditto", [path.join(mount, "Chinese Studio.app"), app]);
      test(path.join(app, "Contents/MacOS/Chinese Studio"));
    } finally {
      run("hdiutil", ["detach", mount]);
    }
  } else {
    run("dpkg-deb", ["--extract", artifact(".deb"), path.join(work, "deb")]);
    const names = await readdir(path.join(work, "deb/opt"));
    test(path.join(work, "deb/opt", names[0], "chinese-studio-desktop"));
    run("chmod", ["+x", artifact(".AppImage")]);
    run(artifact(".AppImage"), ["--appimage-extract"], { cwd: work });
    test(path.join(work, "squashfs-root/chinese-studio-desktop"));
  }
  console.log(
    "PASS: distributable installer payloads launch and pass offline application checks",
  );
} finally {
  await rm(work, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 1000,
  });
}
