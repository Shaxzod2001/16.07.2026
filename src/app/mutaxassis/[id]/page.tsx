import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export default async function SpecialistProfilePage({ params }: { params: Params }) {
  const { id } = await params;

  const specialist = await prisma.specialistProfile.findUnique({
    where: { id },
    include: {
      user: true,
      categories: { include: { category: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { client: true },
      },
    },
  });

  if (!specialist) notFound();

  const firstCategorySlug = specialist.categories[0]?.category.slug;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl shrink-0">
            {specialist.user.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{specialist.user.name}</h1>
            <div className="text-sm text-slate-500">{specialist.user.city}</div>
            <div className="mt-1 text-sm text-amber-500 font-medium">
              {specialist.ratingCount > 0
                ? `★ ${specialist.ratingAvg.toFixed(1)} (${specialist.ratingCount} ta sharh)`
                : "Hali sharh yo'q"}
            </div>
          </div>
          {firstCategorySlug && (
            <Link
              href={`/buyurtma/yangi?category=${firstCategorySlug}`}
              className="shrink-0 rounded-lg bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-blue-700 transition"
            >
              Buyurtma berish
            </Link>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {specialist.categories.map((c) => (
            <span
              key={c.categoryId}
              className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full"
            >
              {c.category.icon} {c.category.name}
            </span>
          ))}
        </div>

        <p className="mt-5 text-slate-700 leading-relaxed">{specialist.bio}</p>
        <p className="mt-3 text-sm text-slate-500">
          Tajriba: {specialist.experienceYears} yil
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Sharhlar ({specialist.reviews.length})
        </h2>
        {specialist.reviews.length === 0 ? (
          <p className="text-slate-500 text-sm">Bu mutaxassis uchun hali sharh qoldirilmagan.</p>
        ) : (
          <div className="space-y-4">
            {specialist.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white border border-slate-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800 text-sm">
                    {review.client.name}
                  </span>
                  <span className="text-amber-500 text-sm">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
