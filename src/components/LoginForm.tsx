"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
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
        {pending ? "Kirilmoqda..." : "Kirish"}
      </button>

      <p className="text-xs text-slate-500 text-center">
        Demo hisob: telefon <code>901112233</code>, parol <code>parol123</code> (mutaxassis)
      </p>
    </form>
  );
}
