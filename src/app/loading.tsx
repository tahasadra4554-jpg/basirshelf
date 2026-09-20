import LoadingBooks from "@/components/books/book-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingHome() {
  return (
    <>
      <div className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
          <div className="space-y-5">
            <Skeleton className="h-7 w-56 rounded-full" />
            <Skeleton className="h-12 w-full max-w-lg" />
            <Skeleton className="h-12 w-2/3 max-w-md" />
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-4/5 max-w-lg" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-12 w-44 rounded-full" />
              <Skeleton className="h-12 w-48 rounded-full" />
            </div>
            <div className="flex gap-6 pt-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-4 w-32 rounded-full" />
              ))}
            </div>
          </div>

          <Skeleton className="mx-auto h-80 w-full max-w-md rounded-2xl" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-10 max-w-2xl space-y-3">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <LoadingBooks />
      </div>
    </>
  );
}
