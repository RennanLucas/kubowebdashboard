export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="glass-card p-5 sm:p-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-muted/70 shimmer" />
            <div className="space-y-2">
              <div className="h-4 w-40 rounded bg-muted/70 shimmer" />
              <div className="h-3 w-28 rounded bg-muted/60 shimmer" />
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-9 w-36 rounded-lg bg-muted/70 shimmer" />
            <div className="h-9 w-24 rounded-lg bg-muted/70 shimmer" />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-muted/70 shimmer" />
              <div className="h-7 w-7 rounded-lg bg-muted/60 shimmer" />
            </div>
            <div className="h-7 w-24 rounded bg-muted/70 shimmer" />
            <div className="h-4 w-28 rounded bg-muted/60 shimmer" />
          </div>
        ))}
      </div>

      {/* Chart + side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 glass-card p-5 sm:p-6">
          <div className="h-4 w-40 rounded bg-muted/70 shimmer mb-2" />
          <div className="h-3 w-56 rounded bg-muted/60 shimmer mb-5" />
          <div className="h-64 w-full rounded-lg bg-muted/60 shimmer" />
        </div>
        <div className="glass-card p-5 sm:p-6">
          <div className="h-4 w-32 rounded bg-muted/70 shimmer mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 w-full rounded-md bg-muted/60 shimmer" />
            ))}
          </div>
        </div>
      </div>

      {/* Two cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass-card p-5 sm:p-6 space-y-3">
            <div className="h-4 w-32 rounded bg-muted/70 shimmer" />
            <div className="h-3 w-48 rounded bg-muted/60 shimmer mb-2" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-10 w-full rounded-md bg-muted/60 shimmer" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
