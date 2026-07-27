import { Bot, Sparkles } from "lucide-react";

export function BrandLogo({ dark = false, compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
        <Bot className="h-5 w-5" strokeWidth={2} />
        <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-blue-200" />
      </div>
      {!compact && (
        <div className="leading-none">
          <span
            className={`text-sm font-bold tracking-tight ${
              dark ? "text-white" : "text-slate-950"
            }`}
          >
            AI Chat
          </span>
          <span className="ml-1 text-sm font-bold tracking-tight text-blue-500">
            Assistant
          </span>
        </div>
      )}
    </div>
  );
}
