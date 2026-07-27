import { cn } from "../../lib/utils";

export function Tabs({ value, onValueChange, tabs, className }) {
  return (
    <div
      className={cn("grid grid-cols-2 rounded-xl bg-slate-100 p-1", className)}
      role="tablist"
      aria-label="Authentication method"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onValueChange(tab.value)}
          className={cn(
            "rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            value === tab.value
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
