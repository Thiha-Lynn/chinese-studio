# ESC release status · 1.3.1

ESC Chinese 1.3.1 is published and live as of 24 September 2026. Chinese 1 lessons are prominent beside Chinese 2, and source activities accept all valid archived answers.

- [Live learning home](https://chinese.ztvmm.live/learn) · [Chinese 1](https://chinese.ztvmm.live/course/1)
- [App downloads and checksums](https://github.com/Thiha-Lynn/chinese-studio/releases/tag/v1.3.1)
- [Native release validation](https://github.com/Thiha-Lynn/chinese-studio/actions/runs/35957097240)
- [Final browser/portable validation](https://github.com/Thiha-Lynn/chinese-studio/actions/runs/35957237389)
- [Three-platform source checks](https://github.com/Thiha-Lynn/chinese-studio/actions/runs/35957240215)
- [Merged discovery and scoring changes](https://github.com/Thiha-Lynn/chinese-studio/pull/2)

## Published content and behavior

The learning home lists all ten Chinese 1 lessons beside all ten Chinese 2 lessons. A visible course chooser and primary Chinese 1 navigation link provide direct access on desktop and mobile. Chinese 1 includes 75 chapters, 1,152 source pages, 582 activity question records, 182 vocabulary cards, 1,205 recovered original media files including 30 videos, and seven Classroom originals. Source sentence activities accept all positively keyed alternatives; single-choice activities accept any one positively keyed choice.

Chinese 2 retains its ten lessons, 485 slide-text pages, 249 vocabulary entries, original decks, worksheets and oral rehearsal. Shared progress, handwriting, resources, source downloads, offline study and backup remain integrated.

## Verification evidence

Eight unit/content checks and all 76 browser checks passed across Firefox, mobile WebKit, desktop Chromium and mobile Chromium. Browser coverage includes both courses, all main sections, source-based activity scoring, lesson discovery, image decoding, progress persistence and offline resources.

All six desktop architecture jobs passed installed/extracted application tests: Windows x64/ARM64, macOS Intel/Apple Silicon and Linux x64/ARM64. Tests load the complete 1,869-resource library, exercise Chinese 1 activities/video, handwriting, export, narrow layouts and progress after restart. Signed Android APK checks passed on Android 15 and 16 with networking disabled. All 1,894 bundled Android web files match the source build by SHA-256. The existing Android signing identity is preserved.

Release application source: `c73759d19686cddd69973913a9447879884f7510`; merged integration: `8bba584eb49a05283d8d16af42320aa0628eba8e`. The later test commit changes navigation waits without changing application source. The deployed website's 1,894 files match the verified local build, with offline manifest `4cb8b83a48d17f1b`.

All ten public installers and SHA256SUMS return HTTP 200 with the expected sizes; every installer's GitHub SHA-256 digest matches the checksum manifest. Production serves release 1.3.1. The public HTML, Chinese 1 dataset and offline manifest match the release build exactly, and audio/video range requests return HTTP 206.

All 1,869 public resource URLs passed status, size and content-type checks with no remaining failures. The public browser verified all 13 main routes, all ten Chinese 1 lesson destinations and their 75 chapter links, with no console errors. The home displays 20 lesson cards and the primary Chinese 1 navigation link. Activating **Update ESC** from a cached prior build preserved existing progress. Version 1.3.0 remains available for rollback.

## Source and platform limits

[Chinese 1 coverage](chinese1-archive.md) records three MDL pages, one audio file and 49 Classroom attachments unavailable at their original sources. This is an independent study adaptation; it does not reproduce MFU's game engine, unlock state, authentication or graded submissions. Original university resources retain their original rights.

Windows/macOS publisher signing and Apple notarization are not configured. iPhone/iPad use the installable web app; there is no iOS IPA, App Store release or Play Store listing. Runner/emulator checks do not certify every physical device or historical operating-system version. Only the portable ZIP requires a separate Node.js installation. See [installation notes](NATIVE_RELEASE.md).

Google account backup and online tutoring retain their existing service configuration and requirements. Backups use explicit save/load, not automatic merging. Browser progress, application IDs, desktop storage, Android signing identity and the external production account database are preserved. The previous production release remains available for rollback. A cached browser can activate the new build with **Update ESC** without clearing saved progress.
