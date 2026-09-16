# Credits and license scope

The root MIT license applies to Chinese Studio application code, original documentation and original project contributions. It does **not** replace third-party rights in bundled course resources, extracted course text, artwork, or stroke data.

| Material | Source / credit | Terms |
| --- | --- | --- |
| Original vocabulary artwork in `library/assets` and `public/art` | MFU Learning Innovation Institute; MDL Chinese 2 | Original rights retained. Reproduced on the project owner's confirmation of authorization. No MIT grant for these assets is asserted. Downstream users must obtain any required permission from the rights holder. |
| Classroom slide decks, worksheets, announcements, oral preparation, extracted slide text and course-derived content | MFU Chinese 2 instructors, including Peng Liu | Original rights retained; same permission scope as above. Source files are preserved. Attribution is not a blanket relicensing grant. |
| Added explanations, pinyin/gloss normalization, grammar examples and original study tooling | Chinese Studio contributors | Original contributions MIT; embedded source excerpts retain source rights. |
| Hanzi Writer engine | David Chanin and contributors, [Hanzi Writer](https://github.com/chanind/hanzi-writer) | MIT, see the package LICENSE. |
| Character stroke data, generated into `library/glyphs` in builds | [Make Me a Hanzi](https://github.com/skishore/makemeahanzi), through hanzi-writer-data | Arphic Public License. Full license shipped as `library/glyphs/LICENSE` in each build. |
| React, Vite, Express and other software dependencies | Respective maintainers | Their package licenses apply. `package-lock.json` records exact versions; retain dependency license files when distributing the server. |
| Lucide icons | Lucide contributors | ISC, see lucide-react/LICENSE. |

Original course portals: [MFU MDL](https://mdl.mfu.ac.th/) and MFU Google Classroom. This is an independent study companion, not an official replacement, gradebook, answer key, or institutional endorsement.

Do not contribute course exports, images, audio, student information, or assessments unless you have permission to publish them. Report attribution or permission concerns through a repository issue without attaching private material; maintainers can remove disputed resources while resolving scope.

Native distributions additionally use Electron/Chromium (desktop), Capacitor and AndroidX/Cordova/Kotlin (Android). Electron's runtime license files must remain with desktop distributions. Capacitor MIT and Android dependency Apache 2.0 notices are bundled as `NATIVE_SOFTWARE_NOTICES.txt`; web-library notices are in `THIRD_PARTY_SOFTWARE_LICENSES.txt`. These notices do not change the course-resource licensing above.
