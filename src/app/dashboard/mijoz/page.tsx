import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Mening buyurtmalarim — Profi.uz" };

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Ochiq",
  IN_PROGRESS: "Jarayonda",
  COMPLETED: "Yakunlangan",
  CANCELLED: "Bekor qilingan",
};

const STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-blue-50 text-blue-700",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default async function ClientDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");
  if (user.role !== "CLIENT") redirect("/dashboard/mutaxassis");

  const orders = await prisma.order.findMany({
    where: { clientId: user.id },
    orderBy: { createdAt: "desc" },
    include: { category: true, responses: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mening buyurtmalarim</h1>
          <p className="text-slate-500 text-sm">Salom, {user.name}</p>
        </div>
        <Link
          href="/buyurtma/yangi"
          className="rounded-lg bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-blue-700 transition"
        >
          + Yangi buyurtma
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500">Sizda hali buyurtmalar yo&apos;q.</p>
          <Link
            href="/buyurtma/yangi"
            className="mt-3 inline-block text-blue-600 font-medium hover:underline"
          >
            Birinchi buyurtmangizni bering →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/buyurtma/${order.id}`}
              className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  {order.category.icon} {order.category.name}
                </span>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[order.status]}`}
                >
                  {STATUS_LABEL[order.status]}
                </span>
              </div>
              <h2 className="mt-2 font-semibold text-slate-900">{order.title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {order.responses.length} ta taklif olindi
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
