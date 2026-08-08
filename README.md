# Mijozlar CRM (Desktop)

Windows va Linux'da ishlaydigan, mijozlarni boshqarish (CRM) uchun desktop ilova.
Electron + React + TypeScript asosida qurilgan, ma'lumotlar kompyuterda lokal
SQLite bazasida saqlanadi (internet talab qilinmaydi).

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

## Xususiyatlar

- Mijozlar ro'yxati: ism, telefon, email, kompaniya, izoh
- Qidirish
- Qo'shish / tahrirlash / o'chirish
- Ma'lumotlar faqat lokal kompyuterda (SQLite) saqlanadi
