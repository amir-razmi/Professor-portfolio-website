export default function PublicBlogLoading() {
  return (
    <div
      className="mx-auto w-full max-w-6xl animate-pulse px-5 py-16 sm:px-8 sm:py-20"
      aria-busy="true"
    >
      <div className="h-10 w-2/3 rounded bg-slate-200" />
      <div className="mt-4 h-5 w-full max-w-2xl rounded bg-slate-200" />
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="h-64 rounded-2xl bg-slate-200" />
        <div className="h-64 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}
