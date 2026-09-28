"use client";

import { useActionState, useRef } from "react";
import { FaPlus } from "react-icons/fa6";
import { addCategory, type FormState } from "./actions";

export default function AddCategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const result = await addCategory(prev, formData);
      if (result.ok) formRef.current?.reset();
      return result;
    },
    {},
  );

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="name"
          required
          maxLength={40}
          placeholder="Category name, e.g. Podcasts"
          className="input flex-1"
        />
        <button type="submit" disabled={pending} className="btn-primary">
          <FaPlus />
          {pending ? "Adding…" : "Add category"}
        </button>
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
    </form>
  );
}
