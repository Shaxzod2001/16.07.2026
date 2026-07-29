"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";
import { CITIES } from "@/lib/constants";

const phoneSchema = z
  .string()
  .regex(/^\d{9}$/, "Telefon raqam 9 ta raqamdan iborat bo'lishi kerak (masalan 901234567)");

export type ActionState = { error?: string } | undefined;

const registerSchema = z.object({
  role: z.enum(["CLIENT", "SPECIALIST"]),
  name: z.string().trim().min(2, "Ismingizni kiriting"),
  phone: phoneSchema,
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  city: z.enum(CITIES as unknown as [string, ...string[]], {
    message: "Shaharni tanlang",
  }),
  bio: z.string().trim().optional(),
  experienceYears: z.coerce.number().int().min(0).max(60).optional(),
  categoryIds: z.array(z.string()).optional(),
});

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    role: formData.get("role"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    city: formData.get("city"),
    bio: formData.get("bio") ?? undefined,
    experienceYears: formData.get("experienceYears") ?? undefined,
    categoryIds: formData.getAll("categoryIds"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" };
  }

  const data = parsed.data;
  const phone = `+998${data.phone}`;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return { error: "Bu telefon raqam bilan foydalanuvchi allaqachon ro'yxatdan o'tgan" };
  }

  if (data.role === "SPECIALIST" && (!data.categoryIds || data.categoryIds.length === 0)) {
    return { error: "Kamida bitta xizmat kategoriyasini tanlang" };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      phone,
      passwordHash,
      role: data.role,
      city: data.city,
      ...(data.role === "SPECIALIST"
        ? {
            specialistProfile: {
              create: {
                bio: data.bio?.trim() || "Tajribali mutaxassis.",
                experienceYears: data.experienceYears ?? 0,
                categories: {
                  create: (data.categoryIds ?? []).map((categoryId) => ({ categoryId })),
                },
              },
            },
          }
        : {}),
    },
  });

  await createSession({ userId: user.id, role: user.role });
  redirect(user.role === "SPECIALIST" ? "/dashboard/mutaxassis" : "/dashboard/mijoz");
}

const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Parolni kiriting"),
});

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" };
  }

  const phone = `+998${parsed.data.phone}`;
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return { error: "Telefon raqam yoki parol noto'g'ri" };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "Telefon raqam yoki parol noto'g'ri" };
  }

  await createSession({ userId: user.id, role: user.role });
  redirect(user.role === "SPECIALIST" ? "/dashboard/mutaxassis" : "/dashboard/mijoz");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
