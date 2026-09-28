import { Bar, SkeletonPage } from "@/app/components/Skeleton";

// Home's loading screen. Other routes have their own loading.tsx, and the
// dashboard layout has its own Suspense boundary, so only Home shows this.
export default function Loading() {
  return (
    <SkeletonPage>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Bar className="h-4 w-40" />
          <Bar className="h-8 w-52" />
        </div>
        <Bar className="h-9 w-56 rounded-full" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-border" />
            <Bar className="h-5 w-48" />
          </div>
          <Bar className="h-4 w-3/4" />
        </div>
      ))}
    </SkeletonPage>
  );
}
