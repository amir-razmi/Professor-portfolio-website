"use client";

export default function AdminError({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
          خطا در فضای مدیریت
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-red-950">بارگذاری فضای مدیریت ممکن نشد.</h1>
        <p className="mt-3 text-sm leading-6 text-red-800">
          درخواست کامل نشد. اتصال پایگاه داده را بررسی و دوباره تلاش کنید.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 min-h-10 rounded-lg bg-red-900 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-900"
        >
          تلاش دوباره
        </button>
      </div>
    </div>
  );
}
