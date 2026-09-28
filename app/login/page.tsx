import type { Metadata } from "next";
import { FaGraduationCap } from "react-icons/fa6";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in · English Helper" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="card w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <FaGraduationCap className="text-4xl text-accent" />
          <h1 className="text-2xl font-semibold">English Helper</h1>
          <p className="text-sm text-muted">
            Track Anki and immersion every day.
          </p>
        </div>
        <LoginForm googleFailed={error === "google"} />
      </div>
    </main>
  );
}
