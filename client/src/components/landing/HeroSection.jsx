import { ArrowRight, Play, ShieldCheck, Sparkles } from "lucide-react";

import { HeroHighlight } from "../aceternity/HeroHighlight";
import { Button } from "../ui/Button";
import { ChatPreview } from "./ChatPreview";

export function HeroSection({ onGetStarted }) {
  return (
    <HeroHighlight className="min-h-screen pb-24 pt-36 sm:pt-40" id="top">
      <div className="mx-auto max-w-7xl px-5 text-center sm:px-8">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-200">
          <Sparkles className="h-3.5 w-3.5" />
          AI answers grounded in your own context
        </div>

        <h1 className="mx-auto mt-7 max-w-5xl text-balance text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
          Your next-gen AI assistant,
          <span className="block bg-gradient-to-r from-blue-300 via-blue-500 to-cyan-300 bg-clip-text text-transparent">
            built around your knowledge.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-400 sm:text-lg">
          Chat naturally, upload documents and images, and get fast answers
          grounded in the information that matters to you.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={onGetStarted} className="group w-full sm:w-auto">
            Get started for free
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Button>
          <a href="#features" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full">
              <Play className="h-4 w-4 fill-current" /> See how it works
            </Button>
          </a>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Secure by default
          </span>
          <span>No credit card required</span>
          <span>Start in under a minute</span>
        </div>

        <ChatPreview />
      </div>
    </HeroHighlight>
  );
}
