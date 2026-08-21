"use client";

export default function PublicError({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
        محتوا در دسترس نیست
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        بارگذاری پروفایل عمومی ممکن نشد.
      </h1>
      <p className="mt-4 text-base leading-7 text-muted">
        لحظاتی دیگر دوباره تلاش کنید. برای بررسی اتصال پایگاه داده و وضعیت محتوا می‌توانید از فضای
        مدیریت استفاده کنید.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-7 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        تلاش دوباره
      </button>
    </div>
  );
}
