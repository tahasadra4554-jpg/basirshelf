import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
  id,
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "mx-auto w-full max-w-7xl scroll-mt-20 px-4 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </section>
  );
}
