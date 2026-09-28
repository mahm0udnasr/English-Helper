import { Suspense } from "react";
import { requireAdmin } from "@/lib/supabase/server";
import Loading from "./loading";
import Sidebar from "./Sidebar";

// The admin check runs inside Suspense so the dashboard skeleton shows while
// it's pending, instead of the page freezing (or Home's loading screen).
async function AdminOnly({ children }: { children: React.ReactNode }) {
  // Pages check again: layouts don't re-render on client navigation.
  await requireAdmin();
  return (
    <>
      <Sidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:flex-row">
      <Suspense
        fallback={
          <div className="min-w-0 flex-1 sm:pl-54">
            <Loading />
          </div>
        }
      >
        <AdminOnly>{children}</AdminOnly>
      </Suspense>
    </div>
  );
}
