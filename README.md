# Davomat nazorati (Yuz tanish orqali)

Xodimlarning ishga kelish/ketishini **yuzni tanish** orqali avtomatik qayd
qiluvchi dastur. Electron + React + TypeScript asosida qurilgan va ikki
ko'rinishda ishlaydi:

- **Windows/Linux desktop dastur** (`.exe` / AppImage) — ma'lumotlar SQLite'da
- **Android/veb (PWA)** — telefon brauzerida ochilib, "Bosh ekranga
  qo'shish" orqali oddiy ilova kabi o'rnatiladi, ma'lumotlar IndexedDB'da

Yuzni tanish ikkala holatda ham to'liq **offline** (mahalliy) ishlaydi —
internet talab qilinmaydi.

## Qanday ishlaydi

1. **Xodimlar** bo'limida yangi xodim qo'shiladi: ism kiritiladi va kamera
   orqali 3 ta rasm olinadi (yuz "descriptor"i hisoblab, bazaga saqlanadi).
2. **Davomat** bo'limida xodim kamera oldiga kelib **Kirish** yoki
   **Chiqish** tugmasini bosadi — dastur yuzni taniydi va vaqtni avtomatik
   qayd qiladi.
3. **Jurnal** bo'limida barcha kirish/chiqish yozuvlari ko'rinadi.

Yuzni tanish uchun [@vladmandic/face-api](https://github.com/vladmandic/face-api)
(TensorFlow.js asosida) ishlatiladi; model fayllari ilova ichida
(`src/renderer/public/models`) mahalliy saqlanadi, hech qanday tashqi
serverga so'rov yubormaydi.

## Ishga tushirish

```bash
npm install
npm run dev
```

## Build qilish (desktop)

```bash
npm run build:win     # Windows uchun (.exe)
npm run build:linux   # Linux uchun (AppImage)
```

## Android'da ishlatish (PWA)

Bu dastur bir vaqtning o'zida veb-sayt sifatida ham build bo'ladi — alohida
Android loyihasi yoki APK yasash shart emas.

1. Build qiling (agar hali qilmagan bo'lsangiz):
   ```bash
   npm run build
   ```
   Natija `out/renderer/` papkasida tayyor bo'ladi (bu — to'liq PWA sayt:
   `index.html`, `manifest.webmanifest`, `sw.js`, model fayllari va boshqalar).

2. **Sinash uchun** (kompyuter va telefon bir xil Wi-Fi'da bo'lishi kerak):
   ```bash
   npx serve out/renderer -l 5173
   ```
   Terminalda chiqadigan kompyuter IP manzilini toping (`ip a` yoki
   `hostname -I`), so'ng telefon brauzerida (Chrome) shu manzilni oching:
   `http://<kompyuter-IP>:5173`

3. **Doimiy foydalanish uchun**: `out/renderer/` papkasini biror hosting
   xizmatiga (GitHub Pages, Netlify, Vercel va h.k.) joylashtiring — https
   manzil olasiz, uni istalgan joydan telefonda ochish mumkin bo'ladi.

4. Chrome'da sayt ochilgach, manyudan **"Bosh ekranga qo'shish" / "Add to
   Home Screen"**ni tanlang — dastur telefon ekraniga ilova sifatida
   o'rnatiladi va keyingi safar internetsiz ham ochiladi (model fayllari
   birinchi ochilishda keshlanadi).

Ma'lumotlar (xodimlar, davomat jurnali) bu holatda **shu telefon/brauzerda**
IndexedDB orqali saqlanadi — desktop versiyadagi SQLite bazasi bilan
sinxronlanmaydi, ular alohida-alohida ishlaydi.

## Texnik eslatma

- Yuzni tanish GPU mavjud bo'lsa `webgl`, bo'lmasa avtomatik `cpu`
  backend'ga o'tadi (ish tezligi biroz sekinlashadi, lekin ishlayveradi).
- Moslik chegarasi (Euclidean distance threshold) `src/renderer/src/lib/face.ts`
  faylida `MATCH_THRESHOLD` orqali sozlanadi.
- Ma'lumotlar qatlami avtomatik tanlanadi: Electron'da `window.api` (SQLite
  orqali IPC), veb/PWA'da IndexedDB (`src/renderer/src/lib/webApi.ts`) —
  ikkalasi ham bir xil `AttendanceApi` interfeysini bajaradi
  (`src/shared/types.ts`).
