# ESC Chinese 1.2.4

Vocabulary visual repair: full-width flip controls, bounded original artwork, navy-and-gold character cards for words without illustrations, and a readable fallback when an image is unavailable. Long Chinese words and pinyin wrap inside the cards. The same fix applies to practice flashcards.

ESC school branding, consistent navigation and controls, a school information page, accessible lesson selectors, improved phone layouts and a complete platform download center. Offline installation handles early browser prompts and unavailable storage; speech failures are explained instead of silently ignored. All original course content and rights notices remain in place.

ESC Chinese 1.2.4 packages the same public study interface with all ten Chinese 2 lessons, 249 vocabulary entries, lesson text, handwriting guides and the available course documents. Installed desktop and Android packages work on the first launch without an internet connection. No Node.js installation or account is needed for these native packages.

| Device                     | Download                                                  | Compatibility target                                                    |
| -------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| Windows PC                 | `win-x64.exe`                                             | Windows 10/11, 64-bit Intel/AMD                                         |
| Windows ARM laptop         | `win-arm64.exe`                                           | Windows 11 ARM64                                                        |
| Apple Silicon Mac          | `mac-arm64.dmg`                                           | macOS 13 or later                                                       |
| Intel Mac                  | `mac-x64.dmg`                                             | macOS 13 or later                                                       |
| Linux PC                   | `linux-x64.AppImage` or `.deb`                            | Ubuntu 24.04, x64; other distributions need compatible system libraries |
| Linux ARM                  | `linux-arm64.AppImage` or `.deb`                          | Ubuntu 24.04, ARM64                                                     |
| Android phone/tablet       | `android.apk`                                             | Android 7+, with Android System WebView/Chrome 107+                     |
| iPhone/iPad                | [Install the web app](https://chinese.ztvmm.live/offline) | Safari 16+; Share → Add to Home Screen, then download lessons           |
| Other desktop environments | `portable.zip`                                            | A compatible browser and Node.js 24–26                                  |

Choose the file matching your processor. Windows EXEs are installers, DMGs contain the Mac app (drag it into Applications), and Linux provides both AppImage and Debian packages. APKs include ARM and Intel Android support through the device WebView. Android offers the system share sheet for exports and course documents; install a PDF/Office reader to open those documents. Mandarin playback requires an installed device voice. Microphone access is requested only when recording.

Windows and macOS downloads are not publisher-signed/notarized; their operating systems may warn or block installation under managed policies. The Android release APK uses a dedicated, persistent release signing key. It is a direct GitHub download, not a Play Store listing. There is no signed iOS IPA or App Store release in this version. We do not claim compatibility with every historical OS version or physical device.

Native apps store their own progress locally. Export/import transfers progress between installations. Account backup and AI services belong to the live website and require online configuration. Updating the app preserves its storage; uninstalling or clearing app data may erase it. Export before changing installations. Native app updates are downloaded manually from this release page; there is no silent updater.

The release workflow gates publication on web tests, packaged desktop smoke tests on each listed processor architecture, Android lint/build/signature verification, and offline Android 15/16 emulator tests. Tests cover lesson navigation, bundled resources, handwriting data, responsive layout, exports on desktop, and progress persistence. Emulator/runner coverage is not physical-device certification. Version 1.2.4 adds visual regression checks across every vocabulary card, simulated image failures, and decoding of every referenced lesson/vocabulary image. Publication is gated on the full web and native workflow.

Every download has a SHA-256 entry in `SHA256SUMS`. Code is MIT; the existing course-content and stroke-data notices remain in effect. Source, contribution instructions, and build documentation are in the repository.

## Updating from Chinese Studio

The application display name is now **ESC Chinese**. Package filenames start with `esc-chinese-1.2.4-`. Android keeps `live.ztvmm.chinese` and the existing release key. Desktop retains its application ID, local origin and historical data directory; Linux keeps the executable/package identity. Browser progress keys and JSON backup structure are unchanged. Export progress before changing installations. The website and the apps use separate device storage.

A previously cached web installation can keep showing Chinese Studio while the new version waits for open sessions to close. Close all tabs and installed-app windows for this site, then reopen online after the update downloads. Do not clear site data to change the branding: that also removes local progress. ESC versions show an **Update ESC** action when a later web release is ready.
