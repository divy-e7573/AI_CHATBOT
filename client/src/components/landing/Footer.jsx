import { ArrowRight } from "lucide-react";

import { Button } from "../ui/Button";
import { BrandLogo } from "./BrandLogo";

export function Footer({ onGetStarted }) {
  return (
    <footer className="bg-slate-100 px-5 pb-8 pt-20 sm:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-blue-600 px-6 py-12 text-center text-white shadow-2xl shadow-blue-600/20 sm:px-12">
        <h2 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
          Put your knowledge to work.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
          Start a conversation, add your context, and get useful answers in minutes.
        </p>
        <Button
          variant="dark"
          size="lg"
          onClick={onGetStarted}
          className="mt-7 text-black-700 hover:bg-black-600"
        >
          Get started free <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col items-center justify-between gap-5 border-t border-slate-200 pt-7 sm:flex-row">
        <BrandLogo />
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} AI Chat Assistant. Built for better conversations.
        </p>
        <div className="flex gap-5 text-xs font-medium text-slate-500">
          <a href="#features" className="hover:text-slate-900">Features</a>
          <a href="#pricing" className="hover:text-slate-900">Pricing</a>
          <a href="#about" className="hover:text-slate-900">About</a>
        </div>
      </div>
    </footer>
  );
}
