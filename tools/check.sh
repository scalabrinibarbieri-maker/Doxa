#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
check_dir=$(mktemp -d)
trap 'rm -rf "$check_dir"' EXIT
javac -d "$check_dir" app/src/main/java/com/doxa/android/LegacyImporter.java tools/ImporterCheck.java
java -cp "$check_dir" com.doxa.android.ImporterCheck "${@}"
node --check app/src/main/assets/native-files.js
node tools/check-native-files.cjs
python3 tools/check-public-tree.py
