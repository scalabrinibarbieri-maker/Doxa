#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
check_dir=$(mktemp -d)
trap 'rm -rf "$check_dir"' EXIT
java com.sun.tools.javac.Main -d "$check_dir" \
  app/src/main/java/com/doxa/android/LegacyImporter.java \
  app/src/main/java/com/doxa/android/ReaderMigration.java \
  app/src/main/java/com/doxa/android/PackageArchive.java \
  tools/ImporterCheck.java \
  tools/MigrationCheck.java \
  tools/RemotePackageCheck.java
java -cp "$check_dir" com.doxa.android.ImporterCheck "${@}"
java -cp "$check_dir" com.doxa.android.RemotePackageCheck
node --check app/src/main/assets/native-files.js
node tools/check-native-files.cjs
python3 tools/check-public-tree.py

java -cp "$check_dir" com.doxa.android.MigrationCheck
python3 tools/check-reader.py
