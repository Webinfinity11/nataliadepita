"use client";
import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, action] = useActionState(login, null);
  return (
    <main className="admin-shell flex min-h-screen items-center justify-center bg-ink-50 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="font-display text-3xl tracking-tight text-ink-900">
            Natalia de Pita
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.28em] text-ink-400">
            Studio Admin
          </p>
        </div>

        <form
          action={action}
          className="mt-8 space-y-3 rounded-[10px] border border-ink-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(20,18,16,0.4)]"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-ink-500">
              Email
            </span>
            <input name="email" type="email" required className="w-full" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-ink-500">
              Password
            </span>
            <input name="password" type="password" required className="w-full" />
          </label>
          {error && <p className="text-sm text-danger-600">{error}</p>}
          <button className="mt-2 w-full rounded-[6px] bg-ink-900 px-4 py-2.5 text-sm font-medium text-ink-50 transition-colors hover:bg-ink-800">
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
