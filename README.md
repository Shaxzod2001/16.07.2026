# Profi.uz

O'zbekiston uchun moslashtirilgan xizmat mutaxassislari platformasi (profi.ru uslubida). Mijozlar
xizmat buyurtma qiladi, mutaxassislar (santexnik, elektrik, repetitor va h.k.) narx va shartlarini
taklif qiladi, mijoz eng mos taklifni tanlaydi va ish tugagach sharh qoldiradi.

## Texnologiyalar

- Next.js 16 (App Router, TypeScript, Server Actions)
- PostgreSQL + Prisma ORM 7 (driver adapter: `@prisma/adapter-pg`)
- Tailwind CSS 4
- Sessiya asosidagi autentifikatsiya (JWT cookie, `jose` + `bcryptjs`)

## Boshlash

1. `.env` faylida `DATABASE_URL` va `SESSION_SECRET` ni sozlang (`.env` namunasi repo ichida bor).
2. Bog'liqliklarni o'rnating:

   ```bash
   npm install
   ```

3. Migratsiyalarni qo'llang va namunaviy ma'lumotlarni yuklang:

   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. Dev serverni ishga tushiring:

   ```bash
   npm run dev
   ```

   [http://localhost:3000](http://localhost:3000) manzilida oching.

### Demo hisoblar (seed orqali yaratilgan)

- Mutaxassis (santexnik): tel. `+998901112233`, parol `parol123`
- Mutaxassis (elektrik): tel `+998901112234`, parol `parol123`
- Mutaxassis (repetitor): tel `+998901112235`, parol `parol123`
- Mijoz: tel `+998907778899`, parol `parol123`

## Asosiy oqim

1. Mijoz ro'yxatdan o'tadi (`/royxatdan-otish`) va buyurtma beradi (`/buyurtma/yangi`).
2. Mos kategoriyadagi mutaxassislar buyurtmani `/buyurtmalar` sahifasida ko'radi va taklif yuboradi.
3. Mijoz takliflarni ko'rib, birini qabul qiladi — bu bosqichda ikki tomonning aloqa ma'lumotlari ochiladi.
4. Ish yakunlangach, mijoz buyurtmani "yakunlandi" deb belgilaydi va mutaxassisga sharh/reyting qoldiradi.
5. Sharh mutaxassisning ochiq profilida (`/mutaxassis/[id]`) va reytingida aks etadi.
