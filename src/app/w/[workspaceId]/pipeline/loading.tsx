export default function WorkspaceLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Stage skeleton */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="min-w-[240px] flex-1 rounded-2xl border-2 border-slate-200 bg-white p-4 space-y-3"
          >
            <div className="h-5 w-24 bg-slate-200 rounded-lg" />
            <div className="space-y-2">
              <div className="h-8 w-full bg-slate-100 rounded-lg" />
              <div className="h-8 w-full bg-slate-100 rounded-lg" />
              <div className="h-8 w-3/4 bg-slate-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
