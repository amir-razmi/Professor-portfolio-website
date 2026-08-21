import Link from "next/link";

import { Container } from "@/components/ui/container";

export default function BlogPostNotFound() {
  return (
    <Container className="py-20 sm:py-28">
      <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">یادداشت‌ها</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          یادداشت پیدا نشد
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          این یادداشت ممکن است پیش‌نویس باشد، منتشر نشده باشد یا دیگر در دسترس نباشد.
        </p>
        <Link
          href="/blog"
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          مرور یادداشت‌های منتشرشده
        </Link>
      </div>
    </Container>
  );
}
