export default function AdminLoading() {
  return (
    <div
      className="p-4 sm:p-6 lg:p-8"
      aria-busy="true"
      aria-label="Loading administration workspace"
    >
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="h-8 w-2/3 rounded bg-slate-200" />
        <div className="h-4 w-full max-w-2xl rounded bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-32 rounded-2xl bg-slate-200" />
          <div className="h-32 rounded-2xl bg-slate-200" />
          <div className="h-32 rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
