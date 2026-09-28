import type { Metadata } from "next";
import { requireAdmin } from "@/lib/supabase/server";
import AddCategoryForm from "./AddCategoryForm";
import CategoryActions from "./CategoryActions";

export const metadata: Metadata = { title: "Categories · English Helper" };

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, default_channels(count)")
    .order("sort_order")
    .order("name");

  const categories = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    channelCount: c.default_channels[0]?.count ?? 0,
  }));

  return (
    <main>
      <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Passive channels are grouped into these. Users pick at least one.
      </p>

      <div className="card mb-6">
        <AddCategoryForm />
      </div>

      {error ? (
        <p className="card text-sm text-red-500">{error.message}</p>
      ) : categories.length ? (
        <ul className="card divide-y divide-border p-0">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.name}</p>
                <p className="text-xs text-muted">
                  {c.channelCount} channel{c.channelCount === 1 ? "" : "s"}
                </p>
              </div>
              <CategoryActions
                id={c.id}
                name={c.name}
                channelCount={c.channelCount}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-12 text-center text-muted">
          No categories yet. Add one above.
        </p>
      )}
    </main>
  );
}
