# ESC release status · 1.3.0

Chinese 1 integration is prepared for publication. Release validation and website deployment are in progress; the previously published 1.2.4 remains the rollback release.

See [Chinese 1 coverage and architecture](chinese1-archive.md) and [1.3.0 package notes](NATIVE_RELEASE.md). Exact release and deployment evidence will be recorded after the gates complete.

## Previous published release

ESC Chinese 1.2.4 is published and live at https://chinese.ztvmm.live. The release source is commit `6128ddb382d54429e5882d244e5ef9a948c7b595`; later commits expand image-test coverage and record verification results without changing the shipped application code.

- [Download apps and checksums](https://github.com/Thiha-Lynn/chinese-studio/releases/tag/v1.2.4)
- [Native release validation](https://github.com/Thiha-Lynn/chinese-studio/actions/runs/35483955232): all jobs passed.
- [Source build matrix](https://github.com/Thiha-Lynn/chinese-studio/actions/runs/35483955284): all jobs passed.
- [Visual repair audit and deployment evidence](VISUAL_REPAIR.md)

## Included and verified

Version 1.2.4 repairs vocabulary button layouts across all 249 words, adds ESC character cards for the 110 words without original illustrations, and handles unavailable images in vocabulary and practice. All 164 packaged image files were checked against production and decoded in all four browser configurations.

Navy-and-gold ESC identity across the website, PWA, Android and desktop apps; school information and Facebook links; consistent selected, expanded and disabled controls; keyboard/mobile navigation, theme and layout improvements; progress compatibility and a complete platform download center.

Ten Chinese 2 lessons, 485 slide-text pages, 249 vocabulary entries, 333 stroke guides and 529 offline resources retain their source attribution. The native apps include the available library for first-launch offline study.

All 56 browser checks and five unit checks passed. Desktop packages were installed/extracted and launched on Windows, macOS and Linux on both x64 and ARM64. Signed Android APK installation and offline study passed on Android 15 and 16 emulators. The portable ZIP and all ten public downloads were verified; release asset digests match SHA256SUMS. The live deployment's 551 web files match the local release build.

## Platform support and limits

Android APK; Windows x64/ARM64 EXE; Intel/Apple Silicon macOS DMG; Linux x64/ARM64 DEB and AppImage; portable ZIP; responsive web/PWA. iPhone/iPad use the installable web app. See [compatibility and installation notes](NATIVE_RELEASE.md) and [build instructions](NATIVE_BUILDS.md).

Windows/macOS publisher signing and Apple notarization are not configured. There is no signed iOS IPA, App Store release or Play Store listing. Physical-device microphone/voice availability and every historical operating-system version are not certified by runner/emulator tests. Only the portable ZIP needs a separate Node.js installation.

## Existing service and content dependencies

- Google sign-in and account backups are implemented, but OAuth client/consent-screen publication remains pending the owner's completion of Google's policy process. Account backups use explicit save/load rather than automatic multi-device merging.
- Tutor access needs the existing online provider configuration and Google sign-in. It is not an offline model.
- The 1.2.4 release predates the Chinese 1 archive; 1.3.0 supplies that content with explicit source gaps.
- MFU course resources and stroke data retain their original rights; the application MIT license does not relicense that material.

The upgrade preserves application IDs, Android signing identity, Electron storage, browser progress keys, backup schema and the external production account database. The preceding production release remains available for rollback.
