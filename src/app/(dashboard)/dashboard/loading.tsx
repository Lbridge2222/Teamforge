export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-slate-200 rounded-lg" />
          <div className="h-4 w-64 bg-slate-100 rounded-lg mt-2" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl" />
      </div>

      {/* Workspace grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border-2 border-slate-200 bg-white p-6 space-y-3"
          >
            <div className="h-5 w-32 bg-slate-200 rounded-lg" />
            <div className="h-3 w-full bg-slate-100 rounded-lg" />
            <div className="h-3 w-2/3 bg-slate-100 rounded-lg" />
            <div className="flex gap-2 mt-4">
              <div className="h-6 w-16 bg-slate-100 rounded-full" />
              <div className="h-6 w-16 bg-slate-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
