import Link from "next/link";

export default function AdminForbidden() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
          Access restricted
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-amber-950">
          You do not have access to this area.
        </h1>
        <p className="mt-3 text-sm leading-6 text-amber-900">
          Your administrator role does not include the permission required for this page.
        </p>
        <Link
          href="/admin/dashboard"
          className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
