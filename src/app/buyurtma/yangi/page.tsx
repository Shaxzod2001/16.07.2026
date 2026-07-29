import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import CreateOrderForm from "@/components/CreateOrderForm";

export const metadata = { title: "Buyurtma berish — Profi.uz" };

type SearchParams = Promise<{ category?: string }>;

export default async function NewOrderPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");
  if (user.role !== "CLIENT") redirect("/dashboard/mutaxassis");

  const { category } = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const defaultCategory = category
    ? categories.find((c) => c.slug === category)
    : undefined;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Buyurtma berish</h1>
      <p className="text-slate-500 mb-6 text-sm">
        Kerakli xizmatni tasvirlab bering — mos mutaxassislar sizga narx va shartlarini
        taklif qiladi.
      </p>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <CreateOrderForm
          categories={categories}
          defaultCategoryId={defaultCategory?.id}
          defaultCity={user.city}
        />
      </div>
    </div>
  );
}
