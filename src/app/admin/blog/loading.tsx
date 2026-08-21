export default function AdminBlogLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8" aria-busy="true" aria-label="Loading blog workspace">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-9 w-2/3 rounded bg-slate-200" />
        <div className="h-5 w-full max-w-2xl rounded bg-slate-200" />
        <div className="h-64 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}
