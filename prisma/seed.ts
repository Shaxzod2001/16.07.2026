import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { CATEGORIES } from "../src/lib/constants";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon },
      create: cat,
    });
  }
  console.log(`${CATEGORIES.length} ta kategoriya tayyor.`);

  const demoPassword = await bcrypt.hash("parol123", 10);

  const santexnikCat = await prisma.category.findUniqueOrThrow({
    where: { slug: "santexnik" },
  });
  const elektrikCat = await prisma.category.findUniqueOrThrow({
    where: { slug: "elektrik" },
  });
  const repetitorCat = await prisma.category.findUniqueOrThrow({
    where: { slug: "repetitor" },
  });

  const specialistsData = [
    {
      name: "Aziz Karimov",
      phone: "+998901112233",
      city: "Toshkent",
      bio: "10 yildan ortiq tajribaga ega santexnik. Kran, quvur, isitish tizimlarini o'rnatish va ta'mirlash.",
      experienceYears: 10,
      categories: [santexnikCat.id],
    },
    {
      name: "Bekzod Yusupov",
      phone: "+998901112234",
      city: "Toshkent",
      bio: "Malakali elektrik. Uy va ofis elektr tarmoqlarini o'rnatish, avariya holatlarini bartaraf etish.",
      experienceYears: 7,
      categories: [elektrikCat.id],
    },
    {
      name: "Dilnoza Rashidova",
      phone: "+998901112235",
      city: "Samarqand",
      bio: "Matematika va fizikadan repetitor, 8 yillik tajriba, abituriyentlarni tayyorlash.",
      experienceYears: 8,
      categories: [repetitorCat.id],
    },
  ];

  for (const s of specialistsData) {
    const user = await prisma.user.upsert({
      where: { phone: s.phone },
      update: {},
      create: {
        name: s.name,
        phone: s.phone,
        passwordHash: demoPassword,
        role: "SPECIALIST",
        city: s.city,
        specialistProfile: {
          create: {
            bio: s.bio,
            experienceYears: s.experienceYears,
            categories: {
              create: s.categories.map((categoryId) => ({ categoryId })),
            },
          },
        },
      },
    });
    console.log(`Mutaxassis tayyor: ${user.name}`);
  }

  await prisma.user.upsert({
    where: { phone: "+998907778899" },
    update: {},
    create: {
      name: "Test Mijoz",
      phone: "+998907778899",
      passwordHash: demoPassword,
      role: "CLIENT",
      city: "Toshkent",
    },
  });
  console.log("Demo mijoz tayyor.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
