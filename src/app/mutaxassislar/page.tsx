import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CITIES } from "@/lib/constants";

export const metadata = { title: "Mutaxassislar — Profi.uz" };

type SearchParams = Promise<{ category?: string; city?: string }>;

export default async function SpecialistsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category, city } = await searchParams;

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  const specialists = await prisma.specialistProfile.findMany({
    where: {
      ...(category ? { categories: { some: { category: { slug: category } } } } : {}),
      ...(city ? { user: { city } } : {}),
    },
    orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
    include: { user: true, categories: { include: { category: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Mutaxassislar</h1>

      <form className="flex flex-wrap gap-3 mb-8 bg-white border border-slate-200 rounded-xl p-4">
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Barcha xizmatlar</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <select
          name="city"
          defaultValue={city ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Barcha shaharlar</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 text-white text-sm font-semibold px-4 py-2 hover:bg-blue-700 transition"
        >
          Filtrlash
        </button>
        {(category || city) && (
          <Link
            href="/mutaxassislar"
            className="text-sm text-slate-500 self-center hover:text-slate-700"
          >
            Tozalash
          </Link>
        )}
      </form>

      {specialists.length === 0 ? (
        <p className="text-slate-500">Ushbu filtr bo&apos;yicha mutaxassis topilmadi.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {specialists.map((sp) => (
            <Link
              key={sp.id}
              href={`/mutaxassis/${sp.id}`}
              className="rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-400 hover:shadow-sm transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                  {sp.user.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{sp.user.name}</div>
                  <div className="text-xs text-slate-500">{sp.user.city}</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600 line-clamp-2">{sp.bio}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {sp.categories.map((c) => (
                  <span
                    key={c.categoryId}
                    className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full"
                  >
                    {c.category.icon} {c.category.name}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-amber-500 font-medium">
                  {sp.ratingCount > 0
                    ? `★ ${sp.ratingAvg.toFixed(1)} (${sp.ratingCount})`
                    : "Hali sharh yo'q"}
                </span>
                <span className="text-slate-400">{sp.experienceYears} yillik tajriba</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
