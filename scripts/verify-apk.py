"""Verify the actual release APK includes every generated offline resource."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile
root = Path('build/client')
# Android ZIP writers may omit the UTF-8 flag on non-ASCII asset names.
with ZipFile('android/app/build/outputs/apk/release/app-release.apk', metadata_encoding='utf-8') as apk:
    count = 0
    for source in root.rglob('*'):
        if source.is_file():
            packaged = apk.read('assets/public/' + source.relative_to(root).as_posix())
            assert hashlib.sha256(packaged).digest() == hashlib.sha256(source.read_bytes()).digest(), str(source)
            count += 1
print(f'PASS: release APK contains all {count} web files with matching SHA-256 hashes')
