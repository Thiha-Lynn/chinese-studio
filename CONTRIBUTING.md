# Contributing

Chinese Studio welcomes Mandarin corrections, accessible teaching material, interface improvements, offline reliability fixes and translations.

1. Open an issue with the lesson, word or workflow and the expected behavior. For language corrections, include characters, tone-marked pinyin, a concise gloss and a trustworthy source or lecturer review.
2. Fork the repository and create a focused branch. Install Node.js 24 LTS, then run `npm ci` and `npm run dev`.
3. Edit course data in `content/course.json`, UI in `src/`, or optional online services in `server/`. Preserve source text; put corrected explanations in annotations. Keep Chinese 1 marked pending until an authorized export is supplied.
4. Run `npm test` and `npm run build`. For UI or offline changes, run `npx playwright install chromium firefox webkit` and `npm run test:e2e`. Check narrow screens, keyboard navigation, light/dark themes, and offline reload.
5. Submit a pull request describing the learner-facing behavior, source provenance, validation and any limitations.

Original code and documentation contributions are accepted under MIT. You must have authority to submit them. Third-party teaching resources keep their own terms: record the rights holder, source, permission/license scope and modifications in `THIRD_PARTY_NOTICES.md`. Permission to view a course alone is not a contribution license. Never add login sessions, API keys, `.env` files, student records, recordings or private account data.

No tracking, compulsory login for public lessons, or new paid service dependency without discussing it first. Keep the same core navigation and practice workflow on desktop and mobile. AI, sign-in and account backup require a connection; ensure local lessons continue to work without them.

Treat learners and contributors respectfully. Critique work, not people; avoid harassment, discriminatory language and disclosure of personal information. Maintainers may remove harmful content and restrict participation.
