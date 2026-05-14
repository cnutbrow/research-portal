"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const IS_DEV = process.env.NODE_ENV !== "production";

const DEV_ACCOUNTS = [
  { label: "Faculty — Dr. Jane Smith", email: "faculty@cmu.edu", role: "Faculty" },
  { label: "Student — Alice Chen", email: "student@andrew.cmu.edu", role: "Student" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/opportunities";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOpen, setDevOpen] = useState(false);

  async function devLogin(email: string) {
    setLoading(true);
    setError("");
    const res = await signIn("dev-bypass", { email, redirect: false });
    if (res?.error) {
      setError("Dev login failed — has this account been seeded in Turso?");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-cmu-red rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-black text-xl">CMU</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sign in</h1>
          <p className="mt-1 text-gray-500">CMU Undergraduate Research Portal</p>
        </div>

        {/* ── CMU SSO ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <button
            onClick={() => signIn("shibboleth", { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 bg-cmu-red text-white font-semibold py-3 rounded-lg hover:bg-red-800 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L3 7v6c0 5 4 9 9 10 5-1 9-5 9-10V7L12 2z" />
            </svg>
            Sign in with CMU Andrew ID
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            You will be redirected to CMU&apos;s single sign-on
          </p>
        </div>

        {/* ── DEV BYPASS — only rendered outside production ── */}
        {IS_DEV && (
          <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 overflow-hidden">
            <button
              onClick={() => setDevOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="text-base">🚧</span>
                Dev bypass
              </span>
              <span className="text-amber-500">{devOpen ? "▲" : "▼"}</span>
            </button>

            {devOpen && (
              <div className="px-4 pb-4 space-y-2 border-t border-amber-200">
                <p className="text-xs text-amber-700 pt-3 mb-3">
                  One-click login with seeded accounts. Not shown in production.
                </p>
                {DEV_ACCOUNTS.map(acct => (
                  <button
                    key={acct.email}
                    onClick={() => devLogin(acct.email)}
                    disabled={loading}
                    className="w-full flex items-center justify-between bg-white border border-amber-200 rounded-lg px-3 py-2.5 text-sm hover:bg-amber-50 transition-colors disabled:opacity-60 text-left"
                  >
                    <span>
                      <span className="font-semibold text-gray-800">{acct.label}</span>
                      <span className="text-gray-400 ml-2">{acct.email}</span>
                    </span>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                      {acct.role}
                    </span>
                  </button>
                ))}
                {error && <p className="text-xs text-red-600 pt-1">{error}</p>}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// Wrap in Suspense because useSearchParams() requires it in Next.js app router
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
