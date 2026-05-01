import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border border-slate-200 bg-white/90 px-3 py-1 text-sm shadow-sm shadow-slate-900/[0.02] backdrop-blur-sm transition-colors",
        "placeholder:text-slate-400",
        "focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20",
        "hover:border-slate-300",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
