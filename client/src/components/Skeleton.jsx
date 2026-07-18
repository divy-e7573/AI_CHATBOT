// Lightweight skeleton loaders (no extra deps — Tailwind's animate-pulse).

export function SidebarSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2 px-2" aria-label="Loading conversations">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-lg bg-gray-800" />
      ))}
    </div>
  );
}

export function MessagesSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading messages">
      <div className="flex justify-end">
        <div className="h-10 w-1/2 animate-pulse rounded-2xl rounded-br-sm bg-gray-200" />
      </div>
      <div className="flex justify-start">
        <div className="h-24 w-2/3 animate-pulse rounded-2xl rounded-bl-sm bg-gray-200" />
      </div>
      <div className="flex justify-end">
        <div className="h-10 w-2/5 animate-pulse rounded-2xl rounded-br-sm bg-gray-200" />
      </div>
    </div>
  );
}
