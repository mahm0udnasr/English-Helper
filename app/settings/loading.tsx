import { Bar, SkeletonPage } from "@/app/components/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <Bar className="h-8 w-36" />
      <section className="card">
        <Bar className="mb-4 h-5 w-32" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-background" />
          ))}
        </div>
      </section>
      <div className="card h-64" />
      <div className="card h-32" />
    </SkeletonPage>
  );
}
