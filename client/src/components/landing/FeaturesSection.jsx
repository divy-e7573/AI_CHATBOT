import {
  FileSearch,
  History,
  Image,
  LockKeyhole,
  MessageSquareText,
  Zap,
} from "lucide-react";

import { Card, CardContent } from "../ui/Card";
import { SectionHeading } from "./SectionHeading";

const features = [
  {
    icon: FileSearch,
    title: "RAG document chat",
    description:
      "Upload PDFs and text files, then receive answers grounded in the most relevant passages.",
    accent: "bg-blue-50 text-blue-600",
  },
  {
    icon: Zap,
    title: "Fast streaming answers",
    description:
      "See responses as they are generated, with resilient timeouts and helpful source context.",
    accent: "bg-amber-50 text-amber-600",
  },
  {
    icon: History,
    title: "Persistent history",
    description:
      "Pick up where you left off with saved conversations and context organized by chat.",
    accent: "bg-violet-50 text-violet-600",
  },
  {
    icon: MessageSquareText,
    title: "Natural voice input",
    description:
      "Turn speech into prompts hands-free with browser and on-device recognition support.",
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Image,
    title: "Image text recognition",
    description:
      "Extract useful text from screenshots and images with locally bundled OCR processing.",
    accent: "bg-cyan-50 text-cyan-600",
  },
  {
    icon: LockKeyhole,
    title: "Private by design",
    description:
      "Authentication, conversation ownership, and scoped retrieval keep each workspace isolated.",
    accent: "bg-rose-50 text-rose-600",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-slate-50 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Everything in one place"
          title="A smarter workspace for every conversation"
          description="Move from scattered information to clear, contextual answers with tools designed for focused work."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description, accent }) => (
            <Card
              key={title}
              className="group border-slate-200/80 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
            >
              <CardContent className="p-6">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-950">
                  {title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
