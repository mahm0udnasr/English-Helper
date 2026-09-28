import { Bar } from "@/app/components/Skeleton";

// Shown next to the sidebar while a dashboard page loads, and by the layout
// while it checks the admin role.
export default function Loading() {
  return (
    <div
      aria-busy
      aria-label="Loading"
      className="flex animate-pulse flex-col gap-6"
    >
      <Bar className="h-8 w-40" />
      <div className="card flex flex-col gap-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Bar className="h-4 flex-1" />
            <Bar className="h-4 w-24" />
            <Bar className="h-4 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
