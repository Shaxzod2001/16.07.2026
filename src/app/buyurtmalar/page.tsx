import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Mos buyurtmalar — Profi.uz" };

export default async function OrdersFeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");
  if (user.role !== "SPECIALIST") redirect("/dashboard/mijoz");

  const specialistProfile = await prisma.specialistProfile.findUnique({
    where: { userId: user.id },
    include: { categories: true },
  });

  const categoryIds = specialistProfile?.categories.map((c) => c.categoryId) ?? [];

  const orders = await prisma.order.findMany({
    where: {
      status: "OPEN",
      categoryId: { in: categoryIds },
    },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      client: true,
      responses: { where: { specialistId: user.id } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Sizga mos buyurtmalar</h1>
      <p className="text-slate-500 mb-6 text-sm">
        Sizning kategoriyalaringiz bo&apos;yicha ochiq buyurtmalar
      </p>

      {orders.length === 0 ? (
        <p className="text-slate-500">Hozircha mos buyurtmalar yo&apos;q.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/buyurtma/${order.id}`}
              className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  {order.category.icon} {order.category.name}
                </span>
                <span className="text-xs text-slate-400">{order.city}</span>
              </div>
              <h2 className="mt-2 font-semibold text-slate-900">{order.title}</h2>
              <p className="mt-1 text-sm text-slate-600 line-clamp-2">{order.description}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  {order.budgetMin || order.budgetMax
                    ? `Byudjet: ${order.budgetMin ?? "?"} - ${order.budgetMax ?? "?"} so'm`
                    : "Byudjet ko'rsatilmagan"}
                </span>
                {order.responses.length > 0 ? (
                  <span className="text-green-600 font-medium">Siz taklif yubordingiz</span>
                ) : (
                  <span className="text-blue-600 font-medium">Taklif yuborish →</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
