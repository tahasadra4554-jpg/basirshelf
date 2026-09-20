import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 min-h-[44px] w-full min-w-0 rounded-xl border border-input bg-card px-3.5 py-2 text-base sm:text-sm shadow-soft transition-all duration-200",
        "placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground",
        "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/25",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
