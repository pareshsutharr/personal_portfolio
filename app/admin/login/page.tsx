import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const nextRaw = typeof sp.next === "string" ? sp.next : "/admin";
  const next = nextRaw.startsWith("/admin") ? nextRaw : "/admin";

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-bg-950 grid-lines px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg-950 via-bg-950/70 to-transparent"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <span className="label-mono text-fg-300">Paresh Suthar / Admin</span>
          <span className="label-mono">Restricted</span>
        </div>
        <div className="rounded-md border border-line-800 bg-surface-900 shadow-panel">
          <div className="border-b border-line-800 px-6 py-5">
            <h1 className="font-display text-lg font-semibold tracking-tight text-fg-50">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-fg-500">Use your admin credentials to continue.</p>
          </div>
          <div className="px-6 py-5">
            <LoginForm next={next} />
          </div>
        </div>
        <p className="mt-6 text-center label-mono">
          Sessions are cookie-based and expire automatically
        </p>
      </div>
    </main>
  );
}
