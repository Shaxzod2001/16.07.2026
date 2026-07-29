import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import RegisterForm from "@/components/RegisterForm";

export const metadata = { title: "Ro'yxatdan o'tish — Profi.uz" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "SPECIALIST" ? "/dashboard/mutaxassis" : "/dashboard/mijoz");
  }

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Ro&apos;yxatdan o&apos;tish</h1>
      <p className="text-slate-500 mb-6 text-sm">
        Profi.uz orqali ishonchli mutaxassislarni toping yoki o&apos;z xizmatingizni taklif qiling.
      </p>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <RegisterForm categories={categories} />
      </div>
      <p className="text-sm text-slate-500 text-center mt-4">
        Hisobingiz bormi?{" "}
        <Link href="/kirish" className="text-blue-600 font-medium hover:underline">
          Kirish
        </Link>
      </p>
    </div>
  );
}
