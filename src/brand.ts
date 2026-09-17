import { version } from "../package.json";

export const brand = {
  name: "ESC Chinese",
  fullName: "ESC Chinese Language Training Center",
  chineseName: "ESC 汉语培训中心",
  facebook: "https://www.facebook.com/profile.php?id=100064139972956",
  website: "https://chinese.ztvmm.live",
  releases: "https://github.com/Thiha-Lynn/chinese-studio/releases",
  version,
};

export const installers = [
  {
    platform: "Android",
    detail: "Phone & tablet · Android 7+",
    options: [["APK", "android.apk"]],
  },
  {
    platform: "macOS",
    detail: "macOS 13 or later",
    options: [
      ["Apple Silicon · DMG", "mac-arm64.dmg"],
      ["Intel · DMG", "mac-x64.dmg"],
    ],
  },
  {
    platform: "Windows",
    detail: "Windows 10+ · ARM requires Windows 11",
    options: [
      ["Intel / AMD · EXE", "win-x64.exe"],
      ["ARM · EXE", "win-arm64.exe"],
    ],
  },
  {
    platform: "Linux",
    detail: "Ubuntu 24.04 · Intel / AMD or ARM",
    options: [
      ["Intel / AMD · DEB", "linux-x64.deb"],
      ["ARM · DEB", "linux-arm64.deb"],
      ["Intel / AMD · AppImage", "linux-x64.AppImage"],
      ["ARM · AppImage", "linux-arm64.AppImage"],
    ],
  },
];
export const releaseFile = (file: string) =>
  `${brand.releases}/download/v${brand.version}/esc-chinese-${brand.version}-${file}`;
