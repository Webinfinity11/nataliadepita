"use client";
import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, action] = useActionState(login, null);
  return (
    <main className="mx-auto mt-24 max-w-sm px-6">
      <h1 className="font-display text-3xl mb-6">Admin</h1>
      <form action={action} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full border p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full border p-2"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-neutral-900 text-white p-2">Sign in</button>
      </form>
    </main>
  );
}
