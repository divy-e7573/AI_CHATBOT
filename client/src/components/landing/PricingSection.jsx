import { Check } from "lucide-react";

import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { SectionHeading } from "./SectionHeading";

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Everything you need to start chatting smarter.",
    features: ["AI conversations", "Document and image uploads", "Saved chat history"],
    action: "Start free",
    active: true,
  },
  {
    name: "Pro",
    price: "Coming soon",
    description: "More capacity for focused individual workflows.",
    features: ["Everything in Starter", "Larger knowledge spaces", "Priority generation"],
    action: "Coming soon",
  },
  {
    name: "Team",
    price: "Coming soon",
    description: "Shared AI knowledge for collaborative teams.",
    features: ["Everything in Pro", "Shared workspaces", "Team administration"],
    action: "Coming soon",
  },
];

export function PricingSection({ onGetStarted }) {
  return (
    <section id="pricing" className="bg-[#0b0f19] py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Simple pricing"
          title="Start now. Scale when you need to."
          description="Try the complete core experience for free while expanded plans are being prepared."
          light
        />
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-white/10 bg-white/[0.04] text-white ${
                plan.active ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {plan.active && (
                <span className="absolute right-5 top-5 rounded-full bg-blue-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                  Available now
                </span>
              )}
              <CardContent className="p-7">
                <p className="text-sm font-semibold text-slate-300">{plan.name}</p>
                <p className="mt-4 text-3xl font-bold tracking-tight">{plan.price}</p>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">
                  {plan.description}
                </p>
                <div className="my-6 h-px bg-white/10" />
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 text-blue-300">
                        <Check className="h-3 w-3" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-7 w-full"
                  variant={plan.active ? "primary" : "secondary"}
                  disabled={!plan.active}
                  onClick={plan.active ? onGetStarted : undefined}
                >
                  {plan.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
