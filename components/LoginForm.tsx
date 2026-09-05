"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "הכניסה נכשלה");
        return;
      }
      router.replace(nextPath.startsWith("/") ? nextPath : "/");
      router.refresh();
    } catch {
      setError("שגיאת רשת");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/10 bg-ink-800/80 p-6 shadow-2xl shadow-black/40 backdrop-blur"
    >
      <label className="mb-4 block">
        <span className="mb-1.5 block text-xs font-medium text-zinc-400">
          אימייל מורשה
        </span>
        <input
          type="email"
          dir="ltr"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2.5 text-sm outline-none ring-emerald-400/40 placeholder:text-zinc-600 focus:ring-2"
        />
      </label>
      <div className="relative my-5 text-center text-[11px] uppercase tracking-widest text-zinc-500">
        <span className="relative z-10 bg-ink-800 px-2">או</span>
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
      </div>
      <label className="mb-5 block">
        <span className="mb-1.5 block text-xs font-medium text-zinc-400">
          סיסמה משותפת
        </span>
        <input
          type="password"
          dir="ltr"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2.5 text-sm outline-none ring-emerald-400/40 focus:ring-2"
        />
      </label>
      {error ? (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {pending ? "נכנס…" : "כניסה"}
      </button>
    </form>
  );
}
