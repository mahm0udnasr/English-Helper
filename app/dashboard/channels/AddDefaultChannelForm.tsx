"use client";

import { useActionState, useRef } from "react";
import { FaPlus } from "react-icons/fa6";
import { addDefaultChannel, type AddDefaultChannelState } from "./actions";

export default function AddDefaultChannelForm({
  kind,
  categories,
}: {
  kind: "active" | "passive";
  categories: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<
    AddDefaultChannelState,
    FormData
  >(async (prev, formData) => {
    const result = await addDefaultChannel(prev, formData);
    if (result.ok) formRef.current?.reset();
    return result;
  }, {});

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="kind" value={kind} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="channel"
          required
          placeholder="@channelhandle or youtube.com/@channel"
          className="input flex-1"
        />
        {kind === "passive" && (
          <select
            name="category_id"
            required
            defaultValue=""
            aria-label="Category"
            className="input"
          >
            <option value="" disabled>
              Category…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <button type="submit" disabled={pending} className="btn-primary">
          <FaPlus />
          {pending ? "Adding…" : `Add to ${kind}`}
        </button>
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
    </form>
  );
}
