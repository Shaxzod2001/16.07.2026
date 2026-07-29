"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CITIES } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/auth";

const createOrderSchema = z.object({
  categoryId: z.string().min(1, "Xizmat turini tanlang"),
  title: z.string().trim().min(5, "Sarlavha kamida 5 ta belgidan iborat bo'lsin"),
  description: z.string().trim().min(10, "Tavsifni batafsilroq yozing (kamida 10 ta belgi)"),
  city: z.enum(CITIES as unknown as [string, ...string[]], { message: "Shaharni tanlang" }),
  budgetMin: z.coerce.number().int().min(0).optional().or(z.literal("").transform(() => undefined)),
  budgetMax: z.coerce.number().int().min(0).optional().or(z.literal("").transform(() => undefined)),
});

export async function createOrderAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") {
    return { error: "Buyurtma berish uchun mijoz sifatida kiring" };
  }

  const parsed = createOrderSchema.safeParse({
    categoryId: formData.get("categoryId"),
    title: formData.get("title"),
    description: formData.get("description"),
    city: formData.get("city"),
    budgetMin: formData.get("budgetMin") ?? "",
    budgetMax: formData.get("budgetMax") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" };
  }

  const data = parsed.data;
  const order = await prisma.order.create({
    data: {
      clientId: user.id,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description,
      city: data.city,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
    },
  });

  redirect(`/buyurtma/${order.id}`);
}

const respondSchema = z.object({
  orderId: z.string().min(1),
  message: z.string().trim().min(5, "Xabar kamida 5 ta belgidan iborat bo'lsin"),
  price: z.coerce.number().int().min(1000, "Narxni to'g'ri kiriting"),
});

export async function respondToOrderAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "SPECIALIST") {
    return { error: "Taklif yuborish uchun mutaxassis sifatida kiring" };
  }

  const parsed = respondSchema.safeParse({
    orderId: formData.get("orderId"),
    message: formData.get("message"),
    price: formData.get("price"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri" };
  }

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order || order.status !== "OPEN") {
    return { error: "Bu buyurtma taklif qabul qilmayapti" };
  }

  const already = await prisma.orderResponse.findUnique({
    where: {
      orderId_specialistId: { orderId: parsed.data.orderId, specialistId: user.id },
    },
  });
  if (already) {
    return { error: "Siz bu buyurtmaga allaqachon taklif yuborgansiz" };
  }

  await prisma.orderResponse.create({
    data: {
      orderId: parsed.data.orderId,
      specialistId: user.id,
      message: parsed.data.message,
      price: parsed.data.price,
    },
  });

  revalidatePath(`/buyurtma/${parsed.data.orderId}`);
  revalidatePath("/buyurtmalar");
  return { error: undefined };
}

export async function acceptResponseAction(orderId: string, responseId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") {
    throw new Error("Ruxsat yo'q");
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.clientId !== user.id || order.status !== "OPEN") {
    throw new Error("Bu amalni bajarib bo'lmaydi");
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "IN_PROGRESS", acceptedResponseId: responseId },
    }),
    prisma.orderResponse.update({
      where: { id: responseId },
      data: { status: "ACCEPTED" },
    }),
    prisma.orderResponse.updateMany({
      where: { orderId, id: { not: responseId } },
      data: { status: "REJECTED" },
    }),
  ]);

  revalidatePath(`/buyurtma/${orderId}`);
}

export async function completeOrderAction(orderId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") {
    throw new Error("Ruxsat yo'q");
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.clientId !== user.id || order.status !== "IN_PROGRESS") {
    throw new Error("Bu amalni bajarib bo'lmaydi");
  }

  await prisma.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } });
  revalidatePath(`/buyurtma/${orderId}`);
}
