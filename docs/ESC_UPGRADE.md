# ESC platform upgrade · 1.2.1

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
- Browser suite: 40 checks across Chromium desktop/mobile, Firefox and mobile WebKit, including all routes in both themes and offline operation with the source server stopped.
- Native release workflow builds and tests Windows/macOS/Linux on x64 and ARM64, release-signed Android APK on Android 15/16 emulators, and portable ZIP. Publication is gated on all jobs.
- Local results: all 40 browser checks passed (32 section/workflow/offline checks plus eight preference/install-prompt checks), as did five unit checks, TypeScript/build and metadata checks. The Apple Silicon DMG was mounted, its installed app launched and all 529 resources, handwriting, export and persistence after restart passed. Hosted platform results will be appended after release completion. These checks are not physical-device certification.

## Remaining platform limits

No iOS IPA/App Store distribution or Play Store listing is configured. iPhone/iPad use the installable web app. Windows/macOS publisher certificates and Apple notarization are not configured. Hardware microphone/voice support and all historical OS versions require device-specific acceptance testing. Chinese 1 and missing original MDL media remain unavailable; this release preserves those honest coverage states.

The unpublished 1.2.0 candidate was stopped during release review: Electron’s default user-data directory is based on the unchanged internal package name `chinese-studio-desktop`, not the display name. Version 1.2.1 retains that default; a direct Electron runtime check verified the legacy path. No 1.2.0 installer was published or deployed.
