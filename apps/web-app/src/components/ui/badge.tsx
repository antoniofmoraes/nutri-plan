import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] px-2 py-1 rounded-full leading-none",
  {
    variants: {
      variant: {
        default: "border border-line bg-surface text-ink",
        solid: "bg-ink text-bg border border-ink",
        accent: "bg-accent-soft text-accent border-transparent",
        good: "text-good border-transparent",
        warn: "text-warn border-transparent",
        cheat: "bg-accent text-accent-ink border-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
