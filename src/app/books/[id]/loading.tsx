import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingBook() {
  return (
    <>
      <div className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <Skeleton className="mb-7 h-4 w-56 rounded-full" />

          <div className="flex flex-col gap-9 sm:flex-row sm:items-start">
            <Skeleton className="aspect-3/4 w-36 shrink-0 rounded-xl sm:w-44" />

            <div className="flex-1 space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-36 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-12 w-72" />
              <Skeleton className="h-4 w-full max-w-2xl" />
              <Skeleton className="h-4 w-3/4 max-w-xl" />
              <div className="flex gap-8 pt-2">
                <Skeleton className="h-10 w-40 rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-xl" />
              </div>
              <Skeleton className="h-11 w-56 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        <div
          className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="sr-only">Loading units…</span>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center gap-5 p-5">
              <Skeleton className="size-11 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-9 w-32 rounded-full" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
