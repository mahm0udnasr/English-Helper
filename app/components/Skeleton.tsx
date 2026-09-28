// Grey placeholder blocks for loading.tsx screens.
export function Bar({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-border ${className}`} />;
}

export function SkeletonPage({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      aria-busy
      aria-label="Loading"
      className={`mx-auto flex w-full max-w-5xl flex-1 animate-pulse flex-col gap-6 px-4 py-8 ${className}`}
    >
      {children}
    </main>
  );
}

export function ChannelCardSkeleton() {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="size-12 shrink-0 rounded-full bg-border" />
      <Bar className="h-4 flex-1" />
    </div>
  );
}
