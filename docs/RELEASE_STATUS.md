# Release status · 1.1.0

## Included

Public Chinese 2 learning app with one responsive workflow, dark/light display, local progress, portable backups, full downloadable lesson pack and an installable web manifest. Ten classroom lessons, 485 slide-text pages, 249 vocabulary entries and 333 bundled stroke guides. MIT application license, contributor guide, third-party attribution, build/test CI and portable release packaging.

Live host: https://chinese.ztvmm.live (dedicated service on the existing AWS host, HTTPS, persistent account database outside release files). The public source and release are at https://github.com/Thiha-Lynn/chinese-studio.

## Verification

- TypeScript check and production build.
- Content counts and referenced resources; malformed progress imports; verified-domain account policy; pinyin ü normalization.
- Desktop Chromium, mobile Chromium emulation, Firefox and mobile WebKit emulation: lesson navigation, responsive width, themes, practice, local persistence and valid/invalid backup import/export.
- Offline pack: origin server is stopped after download, then lessons are reloaded, lazy handwriting opens and PDF range reads succeed. Chromium/Firefox also use simulated network disconnection. WebKit's simulated-offline mode rejects service-worker requests in this runner; stopping the origin verifies an actual unreachable server without relying on that emulation.
- OS build matrix passed in GitHub Actions for macOS, Windows and Linux on the release source. The portable release workflow completed and attached the ZIP and SHA-256 checksum.

Browser engine/mobile emulation is not physical-device certification. Real-device installation, microphone and device Mandarin voices still need acceptance checks on the intended macOS, Windows, Linux, Android and iOS devices. Version 1.1.0 adds Windows EXE, macOS DMG, Linux AppImage/Debian and Android APK packages with the complete available library bundled. Desktop packages cover x64 and ARM64; Android uses the device WebView. See [native compatibility and signing notes](NATIVE_RELEASE.md). App Store / Play Store listings and an iOS IPA are not included. Only the separate portable ZIP requires Node.js 24+.

## Remaining dependencies and scope

- Google sign-in and account backups are implemented. A dedicated Google Cloud project has been created; OAuth client creation and consent-screen publication await the owner’s approval of Google’s User Data Policy. Account backups use explicit save/load, not automatic multi-device merging.
- The tutor provider connection is configured server-side and a Mandarin reply was verified. Live tutor access requires Google sign-in, whose setup is still pending. It does not run offline.
- Chinese 1 awaits the authorized account/export previously requested.
- MDL story audio, video and official assessment banks are partial, not a complete portal clone. The source coverage screen records this. Some source downloads remain on the official portal.
- Original MFU resources are distributed on the project owner's permission confirmation and retain their original rights. They are not covered by the application’s MIT license.

## Native release validation

Pre-release validation passed for the installable packages:

- [Desktop installer run](https://github.com/Thiha-Lynn/chinese-studio/actions/runs/35061911191): Windows x64/ARM64 EXE installation; Intel/Apple Silicon Mac DMG installation; Linux x64/ARM64 Debian and AppImage payloads. Each installed app loaded all 529 offline resources, opened handwriting, exported progress, fit a narrow window and retained learned words after restarting.
- [Android run](https://github.com/Thiha-Lynn/chinese-studio/actions/runs/35061417083): lint, release signing verification, all 551 bundled web files checked by SHA-256, offline lesson/handwriting and progress instrumentation, rotation, and signed APK installation/launch on Android 15 and 16 emulators with Wi-Fi and mobile data disabled.
- [Web verification](https://github.com/Thiha-Lynn/chinese-studio/actions/runs/35061912682): Windows/macOS/Linux build matrix and the twelve browser checks.

The v1.1.0 tag repeats these required gates before publishing. Hardware microphone/voice availability and older supported operating-system versions have not been physically certified. Windows/macOS publisher signatures and Apple iOS provisioning remain outside this release.
