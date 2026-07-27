import { forwardRef } from "react";

import { cn } from "../../lib/utils";

const variants = {
  primary:
    "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 hover:shadow-blue-500/30",
  secondary:
    "border border-white/15 bg-white/5 text-white hover:border-white/25 hover:bg-white/10",
  outline:
    "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
  dark: "bg-slate-950 text-white hover:bg-slate-800",
};

const sizes = {
  sm: "h-9 rounded-lg px-4 text-sm",
  md: "h-11 rounded-xl px-5 text-sm",
  lg: "h-12 rounded-xl px-6 text-base",
  icon: "h-10 w-10 rounded-xl",
};

export const Button = forwardRef(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    type = "button",
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
