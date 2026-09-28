import { Bar, SkeletonPage } from "@/app/components/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Bar className="h-8 w-44" />
        <Bar className="h-10 w-72 rounded-lg" />
      </div>
      <div className="card flex flex-col gap-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Bar className="h-4 w-6" />
            <Bar className="h-4 flex-1" />
            <Bar className="h-4 w-16" />
            <Bar className="h-4 w-12" />
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
