"use client";
import { useActionState } from "react";
import { submitContact } from "./actions";

const inputCls =
  "w-full rounded-field border border-ink-300 bg-ink-50 px-4 py-3 text-base text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-accent-200";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, { ok: false });

  if (state.ok) {
    return (
      <div className="flex min-h-[280px] max-w-md flex-col justify-center border-l-2 border-ink-900 pl-8">
        <p className="font-display text-4xl tracking-tight text-ink-900">
          Thank you.
        </p>
        <p className="mt-3 text-lg leading-relaxed text-ink-600">
          Your message has been sent. Natali reads every note personally and will
          reply soon.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="max-w-md space-y-6">
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-ink-500">
          Name
        </label>
        <input name="name" required placeholder="Your name" className={inputCls} />
      </div>

      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-ink-500">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-ink-500">
          Message
        </label>
        <textarea
          name="message"
          required
          rows={6}
          placeholder="A few words about your enquiry…"
          className={`${inputCls} resize-none`}
        />
      </div>

      {state.error && <p className="text-xs text-danger-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-btn bg-brand-900 px-7 py-3 text-sm tracking-wide text-ink-50 transition-colors hover:bg-brand-800 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
