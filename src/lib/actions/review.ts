"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { ActionState } from "@/lib/actions/auth";

const reviewSchema = z.object({
  orderId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3, "Sharh matnini kiriting"),
});

export async function submitReviewAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") {
    return { error: "Ruxsat yo'q" };
  }

  const parsed = reviewSchema.safeParse({
    orderId: formData.get("orderId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" };
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { review: true },
  });
  if (!order || order.clientId !== user.id || order.status !== "COMPLETED") {
    return { error: "Bu buyurtma uchun sharh qoldirib bo'lmaydi" };
  }
  if (order.review) {
    return { error: "Bu buyurtma uchun sharh allaqachon qoldirilgan" };
  }
  if (!order.acceptedResponseId) {
    return { error: "Qabul qilingan taklif topilmadi" };
  }

  const acceptedResponse = await prisma.orderResponse.findUnique({
    where: { id: order.acceptedResponseId },
  });
  if (!acceptedResponse) {
    return { error: "Qabul qilingan taklif topilmadi" };
  }

  const specialistProfile = await prisma.specialistProfile.findUnique({
    where: { userId: acceptedResponse.specialistId },
  });
  if (!specialistProfile) {
    return { error: "Mutaxassis profili topilmadi" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        orderId: order.id,
        clientId: user.id,
        specialistProfileId: specialistProfile.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    });

    const newCount = specialistProfile.ratingCount + 1;
    const newAvg =
      (specialistProfile.ratingAvg * specialistProfile.ratingCount + parsed.data.rating) /
      newCount;

    await tx.specialistProfile.update({
      where: { id: specialistProfile.id },
      data: { ratingAvg: newAvg, ratingCount: newCount },
    });
  });

  revalidatePath(`/buyurtma/${order.id}`);
  revalidatePath(`/mutaxassis/${specialistProfile.id}`);
  return { error: undefined };
}
