import { ArrowUpRight, CheckCircle2, FileText, Sparkles } from "lucide-react";

import { Button } from "../ui/Button";

const steps = [
  "Start a private conversation",
  "Add a PDF, text file, or readable image",
  "Ask questions and get grounded answers",
];

export function AboutSection({ onGetStarted }) {
  return (
    <section id="about" className="overflow-hidden bg-white py-24 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
        <div className="relative order-2 lg:order-1">
          <div className="absolute -left-12 -top-12 h-52 w-52 rounded-full bg-blue-100 blur-3xl" />
          <div className="relative rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-xl shadow-slate-950/5 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Knowledge workspace</p>
                <p className="mt-1 text-lg font-bold text-slate-950">Project Atlas</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["Research.pdf", "Meeting notes.txt", "Dashboard.png"].map(
                (file, index) => (
                  <div
                    key={file}
                    className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 ${
                      index === 2 ? "sm:col-span-2" : ""
                    }`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800">{file}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">Ready for questions</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                )
              )}
            </div>
            <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-xs font-semibold text-blue-300">Grounded response</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Your documents stay connected to the conversation, making every follow-up more useful.
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
            Simple by design
          </p>
          <h2 className="mt-4 max-w-xl text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
            From upload to insight in a few natural steps.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            AI Chat Assistant combines conversational AI with retrieval, so you can work with your information without learning a complex tool.
          </p>
          <div className="mt-7 space-y-4">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-slate-800">{step}</span>
              </div>
            ))}
          </div>
          <Button variant="dark" size="lg" onClick={onGetStarted} className="mt-9">
            Build your workspace <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
