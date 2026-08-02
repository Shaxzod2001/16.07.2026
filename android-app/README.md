# Контроль обеда — Android APK

Wraps the single-page HTML app (`assets/index.html`) in a minimal native
WebView shell so it installs and runs as a normal Android app.

The page itself is untouched — it still talks to the same Firebase Realtime
Database and loads the same Google Fonts / qrcode.js / Firebase CDN scripts
at runtime, so the device needs internet access when the app is used
(`android.permission.INTERNET` is declared in the manifest).

## What's here

- `AndroidManifest.xml` — single launcher activity, `INTERNET` +
  `ACCESS_NETWORK_STATE` permissions, `minSdkVersion 21` / `targetSdkVersion 28`.
- `src/com/obedcontrol/app/MainActivity.java` — one `Activity` that creates a
  full-screen `WebView` with JavaScript/DOM storage enabled and loads
  `file:///android_asset/index.html`.
- `assets/index.html` — the original site, copied as-is.
- `obed.keystore` — self-signed debug-style signing key (password `obed12345`,
  alias `obedkey`) used to sign the APK so Android will install it.
- `build.sh` — builds `../dist/obed-control.apk` from source.

## Building

```
apt-get install -y aapt android-framework-res   # if not already installed
./build.sh
```

The script compiles `MainActivity.java` with `javac`, dexes it with D8
(`com.android.tools.r8.D8`, downloaded once into `.cache/`), packages
resources/assets with `aapt`, and signs the result with the checked-in
keystore. No Android Studio or full Android SDK install is required.

## Installing

Copy `dist/obed-control.apk` to an Android phone and open it (enable
"install unknown apps" for the source you use). It has not been aligned with
`zipalign` or v2/v3-signed — fine for direct sideloading, but re-sign with a
proper release key (and run it through Android Studio/`bundletool`) before
any Play Store submission.

## Notes / things to double check before real use

- The Firebase config and the admin PIN (`darkstor`) are embedded in
  `assets/index.html` exactly as provided — anyone with the APK can extract
  them, same as with the original web page.
- Not tested on a physical device/emulator in this environment (no Android
  emulator available here) — verify the WebView loads and Firebase reads/writes
  work on a real phone before relying on it.
