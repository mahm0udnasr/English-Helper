"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

export default function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signInPending] = useActionState<
    AuthState,
    FormData
  >(signIn, {});
  const [signUpState, signUpAction, signUpPending] = useActionState<
    AuthState,
    FormData
  >(signUp, {});

  const isSignUp = mode === "signup";
  const state = isSignUp ? signUpState : signInState;
  const pending = isSignUp ? signUpPending : signInPending;

  return (
    <form
      action={(formData) => {
        if (!isSignUp) return signInAction(formData);
        formData.set(
          "timezone",
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        );
        return signUpAction(formData);
      }}
      className="flex flex-col gap-4"
    >
      {isSignUp && (
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            name="display_name"
            required
            maxLength={30}
            autoComplete="name"
            placeholder="Shown on the leaderboard"
            className="input"
          />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className="input"
        />
      </label>

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.message && (
        <p className="text-sm text-done">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
      </button>

      <button
        type="button"
        onClick={() => setMode(isSignUp ? "signin" : "signup")}
        className="text-sm text-muted hover:underline"
      >
        {isSignUp
          ? "Already have an account? Sign in"
          : "No account yet? Create one"}
      </button>
    </form>
  );
}
