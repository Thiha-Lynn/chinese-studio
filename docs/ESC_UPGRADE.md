# ESC platform upgrade · 1.2.3

## Identity and compatibility

Brand reference: user-provided ESC Chinese Language Training Center Facebook screenshot and https://www.facebook.com/profile.php?id=100064139972956. Navy, gold, English and Chinese school names inform an original ESC wordmark; this is not an extracted reproduction of the school’s circular logo. The May 2026 class schedules and prices remain reference material, not current offers. Facebook could not be fetched automatically.

Display branding changes across web metadata, PWA icons, app navigation, tutor, backup filenames, portable launchers, desktop packages, Android labels, icons and splash screens. Course source text/artwork, copyright notices and original course names remain attributed. This update does not convert imported MFU coursework into a claimed ESC HSK syllabus.

Existing application IDs, Android key alias, Electron protocol/user-data directory, Linux package identity, service/database paths, PWA ID, browser keys and backup shape stay stable. Old exports import successfully; installed learners keep their progress when updating with the same identity/key. Account services still require the existing online configuration.

## Section audit

| Section                  | Changes and checks                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| School                   | New school page; online/on-campus class information; direct ESC Facebook link; no stale schedules or invented contacts                                       |
| Learning dashboard       | ESC hero, school navigation, lesson overview, consistent cards, light/dark colors and phone layouts                                                          |
| Ten lesson views         | All six section selectors, source slides, assignment notes, resource links and practice entry points exercised                                               |
| Vocabulary               | Accessible flip state, hidden reverse face, learned state, search/filter/pagination; clamp page after filtered results shrink                                |
| Six practice modes       | Answer entry, disabled states, card flips, sentence clear, review empty state and completed round history                                                    |
| Oral practice            | Expandable preparation answers, reading cards, reveal/hide help state and ten-question self-rated rehearsal                                                  |
| Handwriting              | Character selection state, outline toggle, animation, quiz/restart; responsive canvas                                                                        |
| Resources                | Filter by lesson, labelled viewer, close/download actions and touch targets                                                                                  |
| Progress                 | Export/restore, legacy backup compatibility, clear/cancel controls, local persistence and account-backup availability                                        |
| Tutor                    | ESC identity, availability-based controls; offline/unconfigured suggestions are visibly disabled                                                             |
| Offline/install          | Startup capture of PWA install prompt, bounded offline readiness, storage/removal error handling; direct DEB links alongside APK, DMG, EXE, AppImage and ZIP |
| Navigation/accessibility | Consistent selected states, arrow-key selectors, mobile focus trap/Escape/return focus, hidden offscreen menu, reduced motion and safe-area spacing          |
| Sources/privacy/terms    | Retain original attribution, privacy practices and material availability; ESC platform identity                                                              |

## Verification

- TypeScript and production build; five content/progress/identity/pinyin/native-protocol tests.
- Release metadata check aligns web, Android and desktop version/name while preserving update identities.
- Browser suite: 44 checks across Chromium desktop/mobile, Firefox and mobile WebKit, including all routes in both themes and offline operation with the source server stopped.
- All 44 browser checks passed locally and on the hosted Linux runner, along with five unit checks, TypeScript/build, clean dependency installs and release metadata validation.
- [Native release run](https://github.com/Thiha-Lynn/chinese-studio/actions/runs/35221686557) passed every gate for commit `61e3ee58bdf4fadd2a8882f89943d51112632b95`: six desktop architecture jobs, signed Android lint/build/signature and bundled-file verification, Android 15/16 offline emulator tests, web tests and portable packaging.
- Desktop installer tests launched the installed Windows/macOS/Linux apps on x64 and ARM64, loaded all 529 resources, exercised handwriting and export, checked narrow windows, and verified persistence after restart. The local Apple Silicon DMG independently passed these checks.
- [Source verification](https://github.com/Thiha-Lynn/chinese-studio/actions/runs/35221686571) passed the Windows/macOS/Linux build matrix.
- [Version 1.2.3](https://github.com/Thiha-Lynn/chinese-studio/releases/tag/v1.2.3) is published with ten downloads and SHA256SUMS. Every public asset returned HTTP 200 with the expected size; GitHub asset SHA-256 digests matched the checksum manifest.
- The live website was switched to the same 1.2.3 build after checking all 551 deployed web files by SHA-256. HTTPS health, the `a940d8de7abd9f14` offline manifest, ten lessons, 249 vocabulary entries, school/lesson/offline pages, icons and resource delivery passed. The previous release and external account database remain available for rollback.
- The public ESC dashboard, school page and all ten versioned download links were checked in the browser. A legacy cached browser session held the new worker in its waiting state; activating that verified worker preserved storage and normal reload then opened ESC.
- Runner, emulator and browser checks are not physical-device certification.

## Remaining platform limits

No iOS IPA/App Store distribution or Play Store listing is configured. iPhone/iPad use the installable web app. Windows/macOS publisher certificates and Apple notarization are not configured. Hardware microphone/voice support and all historical OS versions require device-specific acceptance testing. Chinese 1 was unavailable in this historical 1.2 release. Version 1.3 adds the recovered Chinese 1 archive; see [current coverage and source gaps](chinese1-archive.md).

## Upgrade safeguards

Electron retains its default data directory based on the unchanged internal name `chinese-studio-desktop`; a direct runtime check confirmed the legacy path. Application version changes leave dependency versions and resolved lock entries intact, verified by fresh `npm ci` installs.

Oral preparation and reading panels use keyboard-accessible buttons with controlled expanded state; browser tests assert expansion before answer entry. The web updater requires an existing controller, clears activated workers, and displays a dismissible floating notice that cannot shift lesson controls. A fresh-install regression test covers all four browser configurations.
