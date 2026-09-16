// electron-builder 26.15's newer 7z branch filters can silently lose PE files
// in the bundled NSIS decoder. Pin its supported single-stream BCJ filter.
// https://github.com/electron-userland/electron-builder/issues/9983
const { spawnSync } = require("node:child_process");
const result = spawnSync(
  process.execPath,
  [
    require.resolve("electron-builder/cli.js"),
    "--publish",
    "never",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    env: { ...process.env, ELECTRON_BUILDER_7Z_FILTER: "BCJ" },
  },
);
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
