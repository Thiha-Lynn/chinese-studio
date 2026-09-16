# Chinese Studio

A responsive Chinese learning app with public lessons, vocabulary cards, oral rehearsal, six practice modes and stroke-order writing. One interface works in desktop and mobile browsers, with an installable web app and downloadable offline lessons.

**[Live app](https://chinese.ztvmm.live) · [Releases](https://github.com/Thiha-Lynn/chinese-studio/releases) · [Contribute](CONTRIBUTING.md)**

## Course coverage

- Chinese 2: ten classroom lessons, 485 extracted slide pages, 249 vocabulary entries (139 captured MDL cards for Lessons 1–5 and 110 classroom entries for Lessons 6–10).
- All ten original PowerPoint decks and twenty writing/homework worksheets. Lessons 1–5 also include deck PDF conversions. Lessons 6–10 have the original PowerPoint downloads and in-app slide text.
- Oral Test 1: 30 reading items, 14 question families, 43 question variations and self-rated 15-point rehearsal.
- Chinese 1 is pending an authorized account/export. MDL audio, video, story sequences and assessed activity banks are not fully archived. Independent drills do not submit grades or assignments to MFU.

## Use on any device

Open the live app without signing in. Under **Offline & install**, download the lesson pack while connected, then reopen the app without a network. Installation options depend on the browser: Chrome/Edge install menus, iPhone/iPad Share → Add to Home Screen, or supported Safari versions Add to Dock on Mac. Browsers without installation support can use the same website.

Local progress saves in this browser. Export/restore JSON backups to transfer between devices. Optional Google account backups are manual: **Save device progress to account**, then **Load account backup** on another device. They do not automatically merge two devices. Google sign-in, account backup, AI tutoring and official portal links need a network. Synthesized speech needs a compatible Mandarin device voice, which may require an initial download. Recordings never leave the device unless the learner downloads/shares them.

Browsers can evict offline storage; export progress regularly. Remove saved resources in Offline & install. This release is a web/PWA release, not native App Store, APK, DMG or MSI packages. Physical-device verification status is recorded in [RELEASE_STATUS.md](docs/RELEASE_STATUS.md).

## Run locally

Requires Node.js 24 LTS (or compatible Node 25/26).

```sh
npm ci
npm run build
npm start
```

Open `http://127.0.0.1:4173`. No Google account or API key is needed for public lessons. For frontend development use `npm run dev`; optionally run `npm run dev:server` in a second terminal for account/AI endpoints. Generated course assets are included; no private parent workspace is required to build.

For a prebuilt portable release, extract its ZIP, install Node.js 24+, and run `start.cmd` on Windows or `sh start.sh` on macOS/Linux. Open the displayed localhost address. The portable package contains all study material and does not need internet after Node is installed.

## Verify and release

```sh
npm test
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
npm run release:portable
```

CI checks build/content on macOS, Windows and Linux. Tagging a version runs the release workflow to attach the portable build with a SHA-256 checksum. See [deployment](docs/DEPLOYMENT.md), [architecture](docs/ARCHITECTURE.md) and [contribution guide](CONTRIBUTING.md).

## License and attribution

Application code and original contributions: **MIT**. Original MFU course content/artwork and Make Me a Hanzi stroke data retain separate rights; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Inclusion in this repository does not grant MIT rights to third-party resources.

## Desktop and Android apps

The [release downloads](https://github.com/Thiha-Lynn/chinese-studio/releases) include native Windows installers, macOS disk images, Linux AppImage/Debian packages and a release-signed Android APK from v1.1.0 onward. All included lessons ship inside each app. See [supported platforms and installation notes](docs/NATIVE_RELEASE.md) and [native build instructions](docs/NATIVE_BUILDS.md). iPhone/iPad use the installable web app. Windows/macOS publisher signing and an iOS IPA are not included.
