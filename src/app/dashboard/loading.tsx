export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse text-left">
      {/* Header Skeleton */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-3 w-full max-w-md">
          <div className="h-5 w-32 bg-slate-200 rounded-full" />
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-4 w-96 max-w-full bg-slate-100 rounded-lg" />
        </div>
        <div className="h-11 w-36 bg-slate-200 rounded-2xl" />
      </div>

      {/* Stats / Metric Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-white border border-slate-200/90 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded-xl bg-slate-100" />
            </div>
            <div className="h-7 w-28 bg-slate-200 rounded-lg" />
            <div className="h-3 w-36 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Body Skeleton */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded-lg" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="h-12 w-full bg-slate-50 border border-slate-100 rounded-2xl flex items-center px-4 justify-between"
            >
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-4 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
