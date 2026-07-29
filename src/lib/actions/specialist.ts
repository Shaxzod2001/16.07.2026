"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { ActionState } from "@/lib/actions/auth";

const updateProfileSchema = z.object({
  bio: z.string().trim().min(10, "Bio kamida 10 ta belgidan iborat bo'lsin"),
  experienceYears: z.coerce.number().int().min(0).max(60),
  categoryIds: z.array(z.string()).min(1, "Kamida bitta kategoriya tanlang"),
});

export async function updateSpecialistProfileAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "SPECIALIST") {
    return { error: "Ruxsat yo'q" };
  }

  const parsed = updateProfileSchema.safeParse({
    bio: formData.get("bio"),
    experienceYears: formData.get("experienceYears"),
    categoryIds: formData.getAll("categoryIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" };
  }

  const profile = await prisma.specialistProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return { error: "Profil topilmadi" };
  }

  await prisma.$transaction([
    prisma.specialistProfile.update({
      where: { id: profile.id },
      data: {
        bio: parsed.data.bio,
        experienceYears: parsed.data.experienceYears,
      },
    }),
    prisma.specialistCategory.deleteMany({ where: { specialistProfileId: profile.id } }),
    prisma.specialistCategory.createMany({
      data: parsed.data.categoryIds.map((categoryId) => ({
        specialistProfileId: profile.id,
        categoryId,
      })),
    }),
  ]);

  revalidatePath("/dashboard/mutaxassis");
  revalidatePath(`/mutaxassis/${profile.id}`);
  return { error: undefined };
}
