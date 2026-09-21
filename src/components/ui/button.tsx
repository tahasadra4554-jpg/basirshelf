import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-[#F59E0B] active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#0A1628] font-bold shadow-[0_4px_14px_rgba(245,158,11,0.3)] hover:brightness-105 hover:shadow-[0_6px_22px_rgba(245,158,11,0.45)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90",
        outline:
          "border border-amber-500/40 bg-transparent text-[#FCD34D] shadow-soft hover:bg-amber-500/10 hover:border-amber-400 hover:text-[#FDFBF7]",
        secondary:
          "bg-[#1A365D] text-[#FBBF24] border border-amber-500/30 hover:bg-[#24476B]",
        ghost:
          "text-[#FEF3C7] hover:bg-amber-500/10 hover:text-[#FCD34D]",
        link:
          "text-[#FBBF24] underline-offset-4 hover:text-[#FCD34D] hover:underline",
        success:
          "bg-success text-success-foreground hover:bg-success/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-[13px]",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "size-10",
        "icon-sm": "size-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
