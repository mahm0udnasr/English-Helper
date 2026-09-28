import {
  Bar,
  ChannelCardSkeleton,
  SkeletonPage,
} from "@/app/components/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Bar className="h-8 w-40" />
          <Bar className="h-4 w-64" />
        </div>
        <Bar className="h-10 w-52 rounded-lg" />
      </div>
      <Bar className="mt-4 h-6 w-36" />
      <div className="grid gap-3 sm:grid-cols-2">
        <ChannelCardSkeleton />
        <ChannelCardSkeleton />
      </div>
      <Bar className="mt-4 h-6 w-36" />
      <div className="card h-20" />
    </SkeletonPage>
  );
}
