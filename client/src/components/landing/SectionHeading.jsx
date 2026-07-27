export function SectionHeading({ eyebrow, title, description, light = false }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
        {eyebrow}
      </p>
      <h2
        className={`mt-4 text-3xl font-bold tracking-[-0.03em] sm:text-4xl ${
          light ? "text-white" : "text-slate-950"
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-4 text-base leading-7 ${
          light ? "text-slate-400" : "text-slate-600"
        }`}
      >
        {description}
      </p>
    </div>
  );
}
