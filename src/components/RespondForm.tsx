"use client";

import { useActionState } from "react";
import { respondToOrderAction } from "@/lib/actions/order";

export default function RespondForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(respondToOrderAction, undefined);

  return (
    <form action={formAction} className="space-y-4 bg-white border border-slate-200 rounded-xl p-5">
      <input type="hidden" name="orderId" value={orderId} />
      <h3 className="font-semibold text-slate-900">Taklif yuborish</h3>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
          Xabaringiz
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={5}
          rows={3}
          placeholder="O'zingizni tanishtiring, ishni qanday va qachon bajarishingiz haqida yozing"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1">
          Narxingiz (so&apos;m)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          required
          min={1000}
          placeholder="250000"
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
        {pending ? "Yuborilmoqda..." : "Taklif yuborish"}
      </button>
    </form>
  );
}
