import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Kirish — Profi.uz" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "SPECIALIST" ? "/dashboard/mutaxassis" : "/dashboard/mijoz");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Kirish</h1>
      <p className="text-slate-500 mb-6 text-sm">Hisobingizga kiring</p>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <LoginForm />
      </div>
      <p className="text-sm text-slate-500 text-center mt-4">
        Hisobingiz yo&apos;qmi?{" "}
        <Link href="/royxatdan-otish" className="text-blue-600 font-medium hover:underline">
          Ro&apos;yxatdan o&apos;tish
        </Link>
      </p>
    </div>
  );
}
