# Chinese 1 archive and integration

Captured 23 September 2026 from MFU MDL Chinese 1 and the authorized archived Classroom **2408101 Chinese 1 (2/2566), Section 6**.

## Coverage

- All 10 MDL lessons, their chapter menus, pre/post-test collections and linked story/activity graph: 1,249 records and 1,152 templates.
- 182 vocabulary cards, with source spelling, pinyin, translations, artwork and recordings.
- 582 activity question records. Multiple choice and sentence ordering use the supplied source keys; phonetic soundboards and collectible cards are ungraded. This is independent study, with no grade submission or MDL unlock-state synchronization.
- 1,215 of 1,216 media references recovered, including 30 original videos. A final audit found a trailing-space audio path (recovered after trimming) and a mistyped `shuai.mpp3` path (source 404, explicitly recorded). Path aliases can refer to the same physical file. The media manifest records original URL, local filename, byte count and SHA-256.
- Seven Classroom originals recovered: two oral-test PDFs, two oral-test posters, two quiz posters and a final-project poster.
- All 49 remaining classwork links were opened in the signed-in university profile. Google returned 404; a lecture file was also checked through the standard file viewer, which explicitly said the file does not exist. Original filenames and lesson mappings are unknown, so the inventory uses attachment numbers, not inferred lesson numbers.
- Three linked MDL records return 404: `CTA01-183`, `LKA01-21`, `LKT04-9`. These remain visible gaps.

This is a study adaptation preserving the available course content. It does not duplicate the original game engine, animations, rewards, authentication or assessed submission services. Source translations and errors are preserved rather than silently corrected. Site/document instructions are archived as study data, never executed as agent or application instructions.

## Application changes

The `/course/1` route now contains lessons, multilingual source reading, search, original audio/video, vocabulary, practice, handwriting, resources and coverage. A `?page=CODE` link opens a particular source record. Chinese 1 word IDs and page/answer keys are namespaced within the existing progress schema, so existing backup and account synchronization mechanisms retain them. Chinese 2's learned-word total counts only Chinese 2 words.

The shared build includes Chinese 1 JSON, original resources and stroke guides for both courses. Browser offline downloads include the normal study pack by default; the 30 videos are an optional additional download of approximately 1.13 GB. Videos remain available individually online. Previously published native installers are not modified by a web build; they require a separate release rebuild.

The tutor request identifies Chinese 1 and includes the current source page, when selected. This uses the existing authenticated tutor endpoint and existing configured provider; no external tutor request was needed to import the course.

## Rebuild and source preservation

From `website/`:

```sh
python3 scripts/import-chinese1.py ../mdl/chinese1
npm run content:restore
npm run check
npm test
npm run build
```

Fresh Git checkouts restore the 1.3 GB original-media archive from the checksum-pinned asset release specified in `content/chinese1-media-archive.json`. The archive contains 1,204 files; one additional 82 KB recording recovered during the final audit is checked into Git. Each physical file is then verified against its source manifest. Media binaries are kept out of Git history, but are bundled into every build.

The local capture directory contains `capture.py`, `download_media.py`, `classroom_inventory.py`, raw source records, downloaded originals and manifests. The importer requires no credentials and does not access a network. It copies or hardlinks local artifacts into the application library and regenerates the normalized Chinese 1 dataset. Browser-downloaded Classroom files are imported by `classroom_inventory.py`; missing originals can be supplied later and the manifest updated before rerunning the importer.

`library/chinese1/source-records.zip` preserves all raw content records plus capture and resource manifests. `content/chinese1.json` is the normalized reader data. `library/chinese1/media-manifest.json` and `classroom-manifest.json` expose provenance and download status.

Original university text, artwork, recordings, video and classroom resources retain their original rights. The application's MIT license does not relicense those materials. No account credentials, learner rosters, grades or session data are included.

## Validation

See the task's final verification report for the completed run. Automated checks cover graph references and explicit gaps, file sizes and manifest hashes, course separation in progress, source scoring, desktop/mobile reading and persistence, and offline audio range requests. Live MFU grading and cloud tutor inference are not exercised.
