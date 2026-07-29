"use client";

import { useActionState } from "react";
import { createOrderAction } from "@/lib/actions/order";
import { CITIES } from "@/lib/constants";

type Category = { id: string; name: string; icon: string };

export default function CreateOrderForm({
  categories,
  defaultCategoryId,
  defaultCity,
}: {
  categories: Category[];
  defaultCategoryId?: string;
  defaultCity?: string;
}) {
  const [state, formAction, pending] = useActionState(createOrderAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 mb-1">
          Xizmat turi
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={defaultCategoryId ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="" disabled>
            Xizmat turini tanlang
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
          Buyurtma sarlavhasi
        </label>
        <input
          id="title"
          name="title"
          required
          minLength={5}
          placeholder="Masalan: Hammomda kran almashtirish kerak"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
          Batafsil tavsif
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={10}
          rows={4}
          placeholder="Ishning tafsilotlarini yozing: qachon, qanday muammo, qanday natija kutilmoqda"
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
          defaultValue={defaultCity ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="" disabled>
            Shaharni tanlang
          </option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="budgetMin" className="block text-sm font-medium text-slate-700 mb-1">
            Byudjet, dan (so&apos;m)
          </label>
          <input
            id="budgetMin"
            name="budgetMin"
            type="number"
            min={0}
            placeholder="100000"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label htmlFor="budgetMax" className="block text-sm font-medium text-slate-700 mb-1">
            Byudjet, gacha (so&apos;m)
          </label>
          <input
            id="budgetMax"
            name="budgetMax"
            type="number"
            min={0}
            placeholder="300000"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

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
        {pending ? "Yuborilmoqda..." : "Buyurtma berish"}
      </button>
    </form>
  );
}
