import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "outline" | "ghost" | "secondary" | "destructive";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClass: Record<Variant, string> = {
  default:
    "bg-slate-900 text-white shadow-sm shadow-slate-900/10 hover:bg-slate-800 active:bg-slate-950 disabled:bg-slate-400 disabled:shadow-none",
  outline:
    "border border-slate-200 bg-white/80 text-slate-900 backdrop-blur-sm hover:bg-white hover:border-slate-300 disabled:opacity-60",
  ghost: "text-slate-700 hover:bg-slate-100/80 disabled:opacity-60",
  secondary:
    "bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:opacity-60",
  destructive:
    "bg-red-600 text-white shadow-sm shadow-red-900/10 hover:bg-red-700 disabled:bg-red-300",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-base gap-2",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          "disabled:cursor-not-allowed",
          "active:scale-[0.98]",
          variantClass[variant],
          sizeClass[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
