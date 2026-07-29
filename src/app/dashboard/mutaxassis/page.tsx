import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import SpecialistProfileForm from "@/components/SpecialistProfileForm";

export const metadata = { title: "Mening profilim — Profi.uz" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Kutilmoqda",
  ACCEPTED: "Qabul qilindi",
  REJECTED: "Rad etildi",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-600",
};

export default async function SpecialistDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");
  if (user.role !== "SPECIALIST") redirect("/dashboard/mijoz");

  const [profile, categories] = await Promise.all([
    prisma.specialistProfile.findUnique({
      where: { userId: user.id },
      include: { categories: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-slate-500">Mutaxassis profili topilmadi.</p>
      </div>
    );
  }

  const myResponses = await prisma.orderResponse.findMany({
    where: { specialistId: user.id },
    orderBy: { createdAt: "desc" },
    include: { order: { include: { category: true } } },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-slate-900">Mening profilim</h1>
          <Link
            href="/buyurtmalar"
            className="rounded-lg bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-blue-700 transition"
          >
            Mos buyurtmalarni ko&apos;rish
          </Link>
        </div>
        <p className="text-slate-500 text-sm mb-4">
          Salom, {user.name} ·{" "}
          {profile.ratingCount > 0
            ? `★ ${profile.ratingAvg.toFixed(1)} (${profile.ratingCount} ta sharh)`
            : "Hali sharh yo'q"}
        </p>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <SpecialistProfileForm
            categories={categories}
            bio={profile.bio}
            experienceYears={profile.experienceYears}
            selectedCategoryIds={profile.categories.map((c) => c.categoryId)}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Mening takliflarim ({myResponses.length})
        </h2>
        {myResponses.length === 0 ? (
          <p className="text-slate-500 text-sm">Siz hali hech qanday buyurtmaga taklif yubormagansiz.</p>
        ) : (
          <div className="space-y-3">
            {myResponses.map((response) => (
              <Link
                key={response.id}
                href={`/buyurtma/${response.orderId}`}
                className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {response.order.category.icon} {response.order.title}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[response.status]}`}
                  >
                    {STATUS_LABEL[response.status]}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Sizning narxingiz: {response.price.toLocaleString("uz-UZ")} so&apos;m
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
