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
        Content unavailable
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        The public profile could not be loaded.
      </h1>
      <p className="mt-4 text-base leading-7 text-muted">
        Please try again in a moment. The administration workspace can be used to check the database
        connection and content state.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-7 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Try again
      </button>
    </div>
  );
}
