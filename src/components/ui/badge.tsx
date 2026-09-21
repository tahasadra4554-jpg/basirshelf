import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-amber-500/40 bg-amber-500/15 text-[#FBBF24]",
        secondary: "border-amber-500/30 bg-[#1A365D] text-[#FDFBF7]",
        destructive:
          "border-destructive/40 bg-destructive/15 text-destructive",
        success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
        outline: "border-amber-500/30 text-[#FEF3C7]",
        soft: "border-amber-500/40 bg-amber-500/15 text-[#FBBF24]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
