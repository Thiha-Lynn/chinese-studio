#!/usr/bin/env bash
set -euo pipefail
adb uninstall live.ztvmm.chinese
adb install android/app/build/outputs/apk/release/app-release.apk
adb shell svc wifi disable
adb shell svc data disable
adb shell am start -W -n live.ztvmm.chinese/.MainActivity
mkdir -p android/app/build/reports/release-smoke
for attempt in {1..15}; do
  adb shell uiautomator dump /sdcard/studio-window.xml >/dev/null
  adb pull /sdcard/studio-window.xml android/app/build/reports/release-smoke/window.xml >/dev/null
  if python3 -c "from pathlib import Path; s=Path('android/app/build/reports/release-smoke/window.xml').read_text(); assert 'My worlds' in s or 'Pick a world' in s"; then
    adb shell screencap -p /sdcard/studio-release.png
    adb pull /sdcard/studio-release.png android/app/build/reports/release-smoke/release.png
    echo 'PASS: signed release APK launches its lesson interface with Wi-Fi and mobile data disabled'
    exit 0
  fi
  sleep 2
done
adb logcat -d -s AndroidRuntime
exit 1
