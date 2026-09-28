import { requireAdmin } from "@/lib/supabase/server";
import Sidebar from "./Sidebar";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  // Pages check again: layouts don't re-render on client navigation.
  await requireAdmin();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:flex-row">
      <Sidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
