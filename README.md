# Davomat nazorati (Yuz tanish orqali)

Windows va Linux'da ishlaydigan, xodimlarning ishga kelish/ketishini **yuzni
tanish** orqali avtomatik qayd qiluvchi desktop dastur. Electron + React +
TypeScript asosida qurilgan. Yuzni tanish to'liq **offline** (mahalliy)
ishlaydi — internet talab qilinmaydi, barcha ma'lumotlar (xodimlar, davomat
jurnali) kompyuterda SQLite bazasida saqlanadi.

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

## Build qilish

```bash
npm run build:win     # Windows uchun (.exe)
npm run build:linux   # Linux uchun (AppImage)
```

## Texnik eslatma

- Yuzni tanish GPU mavjud bo'lsa `webgl`, bo'lmasa avtomatik `cpu`
  backend'ga o'tadi (ish tezligi biroz sekinlashadi, lekin ishlayveradi).
- Moslik chegarasi (Euclidean distance threshold) `src/renderer/src/lib/face.ts`
  faylida `MATCH_THRESHOLD` orqali sozlanadi.
