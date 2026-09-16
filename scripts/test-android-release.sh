#!/usr/bin/env bash
set -euo pipefail
if adb shell pm path live.ztvmm.chinese | grep -q "^package:"; then
  adb uninstall live.ztvmm.chinese
fi
adb install android/app/build/outputs/apk/release/app-release.apk
adb shell svc wifi disable
adb shell svc data disable
adb shell am start -W -n live.ztvmm.chinese/.MainActivity
mkdir -p android/app/build/reports/release-smoke
for attempt in {1..15}; do
  adb shell uiautomator dump /sdcard/studio-window.xml >/dev/null
  adb pull /sdcard/studio-window.xml android/app/build/reports/release-smoke/window.xml >/dev/null
  if python3 -c "from pathlib import Path; s=Path('android/app/build/reports/release-smoke/window.xml').read_text(); assert 'Continue learning' in s and 'Chinese 2' in s"; then
    adb shell screencap -p /sdcard/studio-release.png
    adb pull /sdcard/studio-release.png android/app/build/reports/release-smoke/release.png
    echo 'PASS: signed release APK launches its lesson interface with Wi-Fi and mobile data disabled'
    exit 0
  fi
  sleep 2
done
adb logcat -d -s AndroidRuntime
exit 1
