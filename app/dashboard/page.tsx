import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";

export default async function DashboardPage() {
  await requireAdmin();
  redirect("/dashboard/users");
}
