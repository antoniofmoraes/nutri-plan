import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-[background,border-color,color,transform] duration-[120ms] cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:translate-y-[0.5px]",
  {
    variants: {
      variant: {
        pri: "bg-ink text-bg border border-transparent hover:bg-ink-2",
        acc: "bg-accent text-accent-ink border border-transparent hover:brightness-[.96]",
        sec: "bg-surface text-ink border border-line hover:bg-surface-alt",
        ghost: "bg-transparent text-ink border border-transparent hover:bg-surface-alt",
        danger: "bg-transparent text-danger border border-line hover:border-danger",
        link: "text-ink underline-offset-4 hover:underline border-0 bg-transparent",
      },
      size: {
        default: "h-9 px-3.5 text-[13.5px] gap-2 rounded-[var(--r-md)]",
        sm: "h-[30px] px-2.5 text-[12.5px] gap-1.5 rounded-lg",
        xs: "h-[26px] px-2 text-[11.5px] gap-1 rounded-sm",
        lg: "h-11 px-4 text-[14px] gap-2 rounded-[var(--r-md)]",
        icon: "h-9 w-9 rounded-[var(--r-md)]",
        "icon-sm": "h-[30px] w-[30px] rounded-lg",
        "icon-xs": "h-[26px] w-[26px] rounded-sm",
      },
    },
    defaultVariants: {
      variant: "sec",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
