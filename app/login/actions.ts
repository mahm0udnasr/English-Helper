"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidTimezone } from "@/lib/today";

export type AuthState = { error?: string; message?: string };

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) return { error: "Please enter your name." };
  if (displayName.length > 30)
    return { error: "Name must be 30 characters or fewer." };
  if (password.length < 6)
    return { error: "Password must be at least 6 characters." };

  const timezone = String(formData.get("timezone") ?? "");
  const supabase = await createClient();
  // The on_auth_user_created trigger copies this metadata into user_settings.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        timezone: isValidTimezone(timezone) ? timezone : "UTC",
      },
    },
  });
  if (error) return { error: error.message };

  // No session means email confirmation is on in Supabase Auth.
  if (!data.session) {
    return {
      message: "Check your email to confirm your account, then sign in.",
    };
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
