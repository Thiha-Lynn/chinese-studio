# ESC visual repair · 1.2.4

## Direction

The school's navy, gold, serif lettering and Chinese identity suggest a composed, welcoming classroom style. The learning library also contains playful illustrated material. Keep that original material intact, use consistent framing and restrained ESC colors around it, and use clear Chinese typography when an illustration is unavailable. Avoid unrelated decorative pictures for abstract vocabulary.

## Findings and changes

- Vocabulary used `mini-flip`, `mini-front` and `mini-back` markup without the corresponding base CSS. Only a mobile height rule existed, leaving native button styling, oversized images, hidden faces taking up layout space and duplicated fallback text. Explicit full-width buttons and positioned front/back panels now restore the card layout.
- There are 249 vocabulary entries. The 139 entries from lessons 1–5 include original illustration files; the 110 entries from lessons 6–10 never included original illustrations. The latter now display deliberate ESC character cards with pinyin, without duplicated visible characters.
- The initial audit checked 151 referenced branding, lesson and vocabulary images. The expanded audit downloaded all 164 packaged image files, including summary sheets and resource images, from production and matched their local SHA-256 hashes. One transient timeout in the initial audit passed on retry. There were no missing or corrupt deployed image files.
- Shared artwork handling in vocabulary and practice replaces a failed image with the same character card, preserves the learning text, and resets naturally when the word's image source changes.
- Long Chinese titles and pinyin wrap within the available card width. Original image proportions are preserved with `object-fit: contain`; no source artwork was repainted or cropped.
- Meaning remains on the reverse side. Keyboard flipping, learned state, audio and progress storage are unchanged.

## Verification

Twelve new checks (three per browser configuration) cover all 249 card bounds, flip visibility and keyboard operation, missing-image behavior in vocabulary and practice, and browser decoding of all 164 packaged images, including summary sheets and icons. The configurations are desktop Chromium, mobile Chromium, Firefox and mobile WebKit. Light/dark screenshots cover the character cards.

The complete browser suite passed all 56 checks locally, along with TypeScript, production build, release metadata checks and five unit tests. The expanded image-decoding check also passed in all four browser configurations. The native release pipeline packages the shared implementation for Android, macOS, Windows and Linux, then verifies the installed apps and offline resources before publishing. Platform compatibility and signing limitations remain in [NATIVE_RELEASE.md](NATIVE_RELEASE.md).

## Published release and deployment

[Version 1.2.4](https://github.com/Thiha-Lynn/chinese-studio/releases/tag/v1.2.4) is published from application commit `6128ddb382d54429e5882d244e5ef9a948c7b595`. [Every release gate passed](https://github.com/Thiha-Lynn/chinese-studio/actions/runs/35483955232): 56 hosted browser checks; all six desktop installer jobs; Android lint, release signing and bundled-file verification; Android 15/16 offline tests; portable packaging. The [tagged source build matrix](https://github.com/Thiha-Lynn/chinese-studio/actions/runs/35483955284) also passed.

All ten public downloads and SHA256SUMS returned HTTP 200 with correct sizes; GitHub SHA-256 asset digests matched the checksum manifest. The live site was switched to the verified 1.2.4 build, with all 551 deployed web-file hashes checked and the 1.2.3 release retained for rollback. The existing production account database was unchanged.

Public HTTPS health, course data, lesson routes, JavaScript, CSS and service-worker hashes passed after deployment. The existing browser's **Update ESC** button applied the update without clearing storage. Live lesson 1 illustrations and both flip states were verified; lesson 9 displayed the new character artwork for the words in the reported screenshot. Temporary test browsers and the local preview server were closed.
