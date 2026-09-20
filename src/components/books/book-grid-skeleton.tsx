import { Skeleton } from "@/components/ui/skeleton";

/** Shown while the catalogue is being fetched. Mirrors the bento grid. */
export default function LoadingBooks() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading books…</span>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Skeleton className="h-12 w-full max-w-md rounded-full" />
        <Skeleton className="h-11 w-44 rounded-full" />
      </div>
      <Skeleton className="h-3 w-40" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-6">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft sm:flex-row lg:col-span-6">
          <Skeleton className="aspect-3/4 w-full rounded-none sm:w-[46%]" />
          <div className="flex-1 space-y-3 p-7">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft lg:col-span-3">
          <Skeleton className="aspect-3/4 w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft lg:col-span-3">
          <Skeleton className="aspect-3/4 w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
