#!/usr/bin/env bash
# Builds dist/obed-control.apk from the HTML app in assets/index.html,
# without needing Android Studio or the full Android SDK.
#
# Requires: apt packages `aapt` + `android-framework-res`, a JDK (javac/keytool/jarsigner).
#
# Usage: ./build.sh
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE="$HERE/.cache"
OUT="$HERE/out"
DIST="$HERE/../dist"
KEYSTORE="$HERE/obed.keystore"
FRAMEWORK_RES="/usr/share/android-framework-res/framework-res.apk"

mkdir -p "$CACHE" "$OUT/classes" "$OUT/dex" "$OUT/apk"

# 1. Compile-time Android API stub jar (used only by javac, not shipped in the APK)
if [ ! -f "$CACHE/android.jar" ]; then
  curl -sS -o "$CACHE/android.jar" \
    "https://repo1.maven.org/maven2/com/google/android/android/4.1.1.4/android-4.1.1.4.jar"
fi

# 2. D8 dexer (com.android.tools.r8.D8), used to turn .class files into classes.dex
if [ ! -f "$CACHE/r8.jar" ]; then
  curl -sS -o "$CACHE/r8.jar" \
    "https://storage.googleapis.com/download/storage/v1/b/r8-releases/o/raw%2Fmain%2F00054e52ddc3a2260dbc05a6e0d820112e1cea7b%2Fr8.jar?generation=1719898414030891&alt=media"
fi

if ! command -v aapt >/dev/null; then
  echo "aapt not found. Install with: apt-get install -y aapt android-framework-res" >&2
  exit 1
fi

echo "== javac =="
javac -source 8 -target 8 -classpath "$CACHE/android.jar" -d "$OUT/classes" \
  "$HERE/src/com/obedcontrol/app/MainActivity.java"

echo "== d8 (dex) =="
java -cp "$CACHE/r8.jar" com.android.tools.r8.D8 --release --min-api 21 \
  --output "$OUT/dex" "$OUT/classes/com/obedcontrol/app/MainActivity.class"

echo "== aapt package =="
rm -f "$OUT/apk/unsigned.apk" "$OUT/apk/signed.apk"
rm -rf "$OUT/apk/assets" "$OUT/apk/AndroidManifest.xml" "$OUT/apk/classes.dex"
aapt package -f -M "$HERE/AndroidManifest.xml" -A "$HERE/assets" \
  -I "$FRAMEWORK_RES" -F "$OUT/apk/unsigned.apk" "$OUT/apk"

cp "$OUT/dex/classes.dex" "$OUT/apk/classes.dex"
(cd "$OUT/apk" && zip -j unsigned.apk classes.dex)

echo "== sign =="
if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -keystore "$KEYSTORE" -alias obedkey -keyalg RSA -keysize 2048 \
    -validity 10000 -storepass obed12345 -keypass obed12345 \
    -dname "CN=Obed Control, OU=Dev, O=Obed, L=Tashkent, S=Tashkent, C=UZ"
fi
cp "$OUT/apk/unsigned.apk" "$OUT/apk/signed.apk"
jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore "$KEYSTORE" \
  -storepass obed12345 "$OUT/apk/signed.apk" obedkey

mkdir -p "$DIST"
cp "$OUT/apk/signed.apk" "$DIST/obed-control.apk"
echo "Built: $DIST/obed-control.apk"
