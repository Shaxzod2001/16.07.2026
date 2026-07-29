"use client";

import { useActionState, useState } from "react";
import { submitReviewAction } from "@/lib/actions/review";

export default function ReviewForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(submitReviewAction, undefined);
  const [rating, setRating] = useState(5);

  return (
    <form action={formAction} className="space-y-4 bg-white border border-slate-200 rounded-xl p-5">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="rating" value={rating} />
      <h3 className="font-semibold text-slate-900">Mutaxassisga sharh qoldiring</h3>
      <div className="flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={n <= rating ? "text-amber-500" : "text-slate-300"}
            aria-label={`${n} yulduz`}
          >
            ★
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-1">
          Fikringiz
        </label>
        <textarea
          id="comment"
          name="comment"
          required
          minLength={3}
          rows={3}
          placeholder="Xizmat sifati haqida fikringizni yozing"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
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
        {pending ? "Yuborilmoqda..." : "Sharh qoldirish"}
      </button>
    </form>
  );
}
