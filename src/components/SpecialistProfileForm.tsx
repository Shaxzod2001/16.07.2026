"use client";

import { useActionState } from "react";
import { updateSpecialistProfileAction } from "@/lib/actions/specialist";

type Category = { id: string; name: string; icon: string };

export default function SpecialistProfileForm({
  categories,
  bio,
  experienceYears,
  selectedCategoryIds,
}: {
  categories: Category[];
  bio: string;
  experienceYears: number;
  selectedCategoryIds: string[];
}) {
  const [state, formAction, pending] = useActionState(updateSpecialistProfileAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-1">
          O&apos;zingiz haqingizda
        </label>
        <textarea
          id="bio"
          name="bio"
          required
          minLength={10}
          rows={3}
          defaultValue={bio}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label htmlFor="experienceYears" className="block text-sm font-medium text-slate-700 mb-1">
          Tajriba (yil)
        </label>
        <input
          id="experienceYears"
          name="experienceYears"
          type="number"
          min={0}
          max={60}
          defaultValue={experienceYears}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <span className="block text-sm font-medium text-slate-700 mb-2">Xizmat kategoriyalari</span>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-2 text-sm rounded-lg border border-slate-200 px-3 py-2 cursor-pointer hover:border-blue-300"
            >
              <input
                type="checkbox"
                name="categoryIds"
                value={cat.id}
                defaultChecked={selectedCategoryIds.includes(cat.id)}
                className="accent-blue-600"
              />
              <span>
                {cat.icon} {cat.name}
              </span>
            </label>
          ))}
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
        className="rounded-lg bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-blue-700 transition disabled:opacity-60"
      >
        {pending ? "Saqlanmoqda..." : "Saqlash"}
      </button>
    </form>
  );
}
