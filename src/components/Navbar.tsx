import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-extrabold text-blue-600">Profi</span>
          <span className="text-xl font-extrabold text-slate-900">.uz</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-blue-600">
            Bosh sahifa
          </Link>
          <Link href="/mutaxassislar" className="hover:text-blue-600">
            Mutaxassislar
          </Link>
          {user?.role === "CLIENT" && (
            <Link href="/buyurtma/yangi" className="hover:text-blue-600">
              Buyurtma berish
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {!user && (
            <>
              <Link
                href="/kirish"
                className="text-sm font-medium text-slate-600 hover:text-blue-600"
              >
                Kirish
              </Link>
              <Link
                href="/royxatdan-otish"
                className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </>
          )}
          {user && (
            <>
              <Link
                href={user.role === "SPECIALIST" ? "/dashboard/mutaxassis" : "/dashboard/mijoz"}
                className="text-sm font-medium text-slate-700 hover:text-blue-600"
              >
                {user.name}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-sm font-medium text-slate-500 hover:text-red-600"
                >
                  Chiqish
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
