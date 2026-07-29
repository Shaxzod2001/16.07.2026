import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  const topSpecialists = await prisma.specialistProfile.findMany({
    take: 6,
    orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
    include: { user: true, categories: { include: { category: true } } },
  });

  return (
    <div>
      <section className="bg-gradient-to-b from-blue-600 to-blue-500 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            O&apos;zbekistondagi ishonchli mutaxassislarni toping
          </h1>
          <p className="mt-4 text-blue-100 max-w-xl mx-auto">
            Santexnik, elektrik, repetitor, go&apos;zallik ustasi va boshqa xizmatlar —
            bir joyda, sharh va reyting bilan.
          </p>
          <form action="/mutaxassislar" className="mt-8 max-w-xl mx-auto flex gap-2">
            <select
              name="category"
              defaultValue=""
              className="flex-1 rounded-lg px-4 py-3 text-slate-900 outline-none"
            >
              <option value="">Barcha xizmatlar</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-white text-blue-700 font-semibold px-5 py-3 hover:bg-blue-50 transition"
            >
              Qidirish
            </button>
          </form>
          <div className="mt-6">
            <Link
              href="/buyurtma/yangi"
              className="inline-block rounded-lg border border-white/40 px-5 py-2.5 text-sm font-medium hover:bg-white/10 transition"
            >
              Buyurtma bering, mutaxassislar sizga taklif yuborsin →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Xizmat turlari</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/mutaxassislar?category=${cat.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-4 text-center hover:border-blue-400 hover:shadow-sm transition"
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="text-sm font-medium text-slate-700">{cat.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {topSpecialists.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Eng yaxshi mutaxassislar</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topSpecialists.map((sp) => (
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
                  {sp.categories.slice(0, 3).map((c) => (
                    <span
                      key={c.categoryId}
                      className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full"
                    >
                      {c.category.icon} {c.category.name}
                    </span>
                  ))}
                </div>
                <div className="mt-3 text-sm text-amber-500 font-medium">
                  {sp.ratingCount > 0
                    ? `★ ${sp.ratingAvg.toFixed(1)} (${sp.ratingCount})`
                    : "Hali sharh yo'q"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
