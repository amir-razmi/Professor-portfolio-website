"use client";

import { useState } from "react";

type UnlockResponse = {
  downloadUrl?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
};

export function PasswordUnlockForm({
  downloadUrl,
  fileName,
  unlockUrl,
}: Readonly<{
  downloadUrl: string;
  fileName: string;
  unlockUrl: string;
}>) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(unlockUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json().catch(() => null)) as UnlockResponse | null;

      if (!response.ok || !payload?.downloadUrl) {
        setMessage(
          payload?.fieldErrors?.password?.[0] ?? payload?.message ?? "گذرواژه نادرست است.",
        );
        return;
      }

      setPassword("");
      setUnlocked(true);
      setMessage("دسترسی فایل باز شد؛ اکنون می‌توانید آن را دریافت کنید.");
    } catch {
      setMessage("باز کردن دسترسی فایل ممکن نشد. دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  }

  if (unlocked) {
    return (
      <div className="space-y-3">
        <p role="status" className="text-sm text-emerald-800">
          {message}
        </p>
        <a
          href={downloadUrl}
          download
          className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          دریافت فایل <span aria-hidden="true">↓</span>
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={unlock} className="space-y-3">
      <label htmlFor={`unlock-${unlockUrl}`} className="block text-sm font-semibold text-slate-900">
        برای دریافت فایل، گذرواژه را وارد کنید
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={`unlock-${unlockUrl}`}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="off"
          required
          minLength={12}
          maxLength={128}
          aria-describedby={message ? `unlock-message-${unlockUrl}` : undefined}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "در حال بررسی…" : "باز کردن دسترسی"}
        </button>
      </div>
      {message ? (
        <p id={`unlock-message-${unlockUrl}`} role="alert" className="text-sm text-red-700">
          {message}
        </p>
      ) : null}
      <p className="text-xs leading-5 text-muted">
        این دسترسی کوتاه‌مدت فقط برای «{fileName}» در همین مرورگر معتبر است.
      </p>
    </form>
  );
}
