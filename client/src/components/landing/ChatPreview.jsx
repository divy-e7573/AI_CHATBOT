import {
  Bot,
  Check,
  FileText,
  Mic,
  Paperclip,
  Search,
  Send,
  Sparkles,
} from "lucide-react";

export function ChatPreview() {
  return (
    <div className="landing-float relative mx-auto mt-16 w-full max-w-5xl">
      <div className="absolute -inset-1 rounded-[1.7rem] bg-gradient-to-r from-blue-600/50 via-cyan-400/20 to-blue-500/50 blur-xl" />
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/15 bg-slate-950/85 p-2 shadow-2xl shadow-blue-950/60 backdrop-blur-xl sm:p-3">
        <div className="flex h-8 items-center gap-2 border-b border-white/10 px-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 flex-1 rounded-md bg-white/5 py-1 text-center text-[9px] text-slate-500">
            assistant.ai/chat
          </span>
        </div>

        <div className="grid min-h-[370px] grid-cols-1 sm:grid-cols-[190px_1fr]">
          <aside className="hidden border-r border-white/10 p-4 sm:block">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Bot className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold">AI Assistant</span>
            </div>
            <div className="rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-medium">
              + New conversation
            </div>
            <p className="mt-5 px-1 text-[9px] uppercase tracking-[0.18em] text-slate-600">
              Recent
            </p>
            {["Product research", "Q3 report notes", "Project roadmap"].map(
              (label, index) => (
                <div
                  key={label}
                  className={`mt-2 truncate rounded-lg px-2.5 py-2 text-[10px] ${
                    index === 0
                      ? "bg-white/10 text-white"
                      : "text-slate-500"
                  }`}
                >
                  {label}
                </div>
              )
            )}
          </aside>

          <div className="flex min-w-0 flex-col bg-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-800">
                  Research assistant
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[8px] text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Context ready
                </p>
              </div>
              <Search className="h-4 w-4 text-slate-400" />
            </div>

            <div className="flex-1 space-y-3 p-4 sm:p-5">
              <div className="ml-auto max-w-[78%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-[10px] leading-relaxed text-white shadow-sm">
                Summarize the key findings in this report and highlight the main
                growth drivers.
              </div>
              <div className="flex max-w-[88%] gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-[10px] leading-relaxed text-slate-600 shadow-sm">
                  <p className="font-semibold text-slate-900">Executive summary</p>
                  <p className="mt-1.5">
                    Revenue grew 24% year over year, led by stronger enterprise
                    adoption and improved customer retention [1].
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-blue-50 px-2 py-1.5 text-[8px] font-medium text-blue-700">
                    <FileText className="h-3 w-3" /> Q3-report.pdf · 4 sources
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 pt-0">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                <Paperclip className="h-4 w-4 text-slate-400" />
                <span className="flex-1 text-[9px] text-slate-400">
                  Ask anything about your documents...
                </span>
                <Mic className="h-4 w-4 text-slate-400" />
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Send className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-3 top-20 hidden items-center gap-2 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-[10px] text-slate-200 shadow-xl backdrop-blur lg:flex">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <Check className="h-3 w-3" />
        </span>
        Document indexed
      </div>
    </div>
  );
}
