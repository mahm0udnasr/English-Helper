import type { Metadata } from "next";
import { getAppSettings } from "@/lib/app-settings";
import { requireAdmin } from "@/lib/supabase/server";
import TranscriptsSwitch from "./TranscriptsSwitch";

export const metadata: Metadata = { title: "Settings · English Helper" };

export default async function DashboardSettingsPage() {
  const { supabase } = await requireAdmin();
  const settings = await getAppSettings(supabase);

  return (
    <main>
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 mb-6 text-sm text-muted">These apply to every user.</p>

      <div className="card">
        <TranscriptsSwitch on={settings.transcripts_enabled} />
      </div>
    </main>
  );
}
