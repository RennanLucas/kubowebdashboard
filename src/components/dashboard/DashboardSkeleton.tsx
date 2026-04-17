import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="glass-card p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Skeleton className="h-8 w-48" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 glass-card p-5">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="glass-card p-5">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
