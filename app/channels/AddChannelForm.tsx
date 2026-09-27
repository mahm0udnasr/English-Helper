"use client";

import { useActionState, useRef } from "react";
import { FaPlus } from "react-icons/fa6";
import { addChannel, type AddChannelState } from "./actions";

export default function AddChannelForm({
  kind,
}: {
  kind: "active" | "passive";
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<AddChannelState, FormData>(
    async (prev, formData) => {
      const result = await addChannel(prev, formData);
      if (result.ok) formRef.current?.reset();
      return result;
    },
    {},
  );

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
        <button type="submit" disabled={pending} className="btn-primary">
          <FaPlus />
          {pending ? "Adding…" : `Add to ${kind}`}
        </button>
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
    </form>
  );
}
