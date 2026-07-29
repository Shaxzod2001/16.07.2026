"use client";

import { useActionState, useState } from "react";
import { registerAction } from "@/lib/actions/auth";
import { CITIES } from "@/lib/constants";

type Category = { id: string; name: string; icon: string };

export default function RegisterForm({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(registerAction, undefined);
  const [role, setRole] = useState<"CLIENT" | "SPECIALIST">("CLIENT");

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Siz kim sifatida ro&apos;yxatdan o&apos;tmoqchisiz?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("CLIENT")}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
              role === "CLIENT"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            Mijoz
            <div className="text-xs font-normal text-slate-500 mt-1">
              Xizmat buyurtma qilmoqchiman
            </div>
          </button>
          <button
            type="button"
            onClick={() => setRole("SPECIALIST")}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
              role === "SPECIALIST"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            Mutaxassis
            <div className="text-xs font-normal text-slate-500 mt-1">
              Xizmat ko&apos;rsatib, buyurtma olmoqchiman
            </div>
          </button>
        </div>
        <input type="hidden" name="role" value={role} />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
          To&apos;liq ismingiz
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          placeholder="Masalan: Aziz Karimov"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
          Telefon raqam
        </label>
        <div className="flex">
          <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-3 text-slate-600 text-sm">
            +998
          </span>
          <input
            id="phone"
            name="phone"
            required
            pattern="\d{9}"
            maxLength={9}
            placeholder="901234567"
            className="w-full rounded-r-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
          Parol
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Kamida 6 ta belgi"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">
          Shahar
        </label>
        <select
          id="city"
          name="city"
          required
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="" disabled>
            Shaharni tanlang
          </option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {role === "SPECIALIST" && (
        <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-1">
              O&apos;zingiz haqingizda qisqacha
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              placeholder="Tajribangiz, ko'nikmalaringiz haqida yozing"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="experienceYears"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Necha yillik tajribangiz bor?
            </label>
            <input
              id="experienceYears"
              name="experienceYears"
              type="number"
              min={0}
              max={60}
              defaultValue={0}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-2">
              Qaysi xizmatlarni ko&apos;rsatasiz?
            </span>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2 text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 cursor-pointer hover:border-blue-300"
                >
                  <input type="checkbox" name="categoryIds" value={cat.id} className="accent-blue-600" />
                  <span>
                    {cat.icon} {cat.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 text-white font-semibold py-2.5 hover:bg-blue-700 transition disabled:opacity-60"
      >
        {pending ? "Yuborilmoqda..." : "Ro'yxatdan o'tish"}
      </button>
    </form>
  );
}
