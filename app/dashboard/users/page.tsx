import type { Metadata } from "next";
import { requireAdmin } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Users · English Helper" };

export default async function UsersPage() {
  const { supabase, settings } = await requireAdmin();
  const { data, error } = await supabase.rpc("admin_list_users");
  const users = data ?? [];

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString("en", {
          dateStyle: "medium",
          timeZone: settings.timezone,
        })
      : "Never";

  return (
    <main>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">
        Users{" "}
        <span className="text-base font-normal text-muted">
          ({users.length})
        </span>
      </h1>

      {error ? (
        <p className="card text-sm text-red-500">{error.message}</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">
                  Provider
                </th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">
                  Timezone
                </th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">
                  Last sign-in
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.user_id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">
                    {u.display_name ?? <span className="text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="hidden px-4 py-3 capitalize md:table-cell">
                    {u.provider}
                  </td>
                  <td className="hidden px-4 py-3 text-muted md:table-cell">
                    {u.timezone}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="hidden px-4 py-3 whitespace-nowrap text-muted tabular-nums sm:table-cell">
                    {formatDate(u.last_sign_in_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
