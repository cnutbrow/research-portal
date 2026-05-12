"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const DEV_ACCOUNTS = [
  { label: "Faculty — Dr. Jane Smith", email: "faculty@cmu.edu", password: "password123", role: "Faculty" },
  { label: "Student — Alice Chen", email: "student@andrew.cmu.edu", password: "password123", role: "Student" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/opportunities";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOpen, setDevOpen] = useState(false);

  async function devLogin(email: string, password: string) {
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Dev login failed — have you run the seed script?");
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

        {/* ── PRIMARY: CMU SSO ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <button
            disabled
            className="w-full flex items-center justify-center gap-3 bg-cmu-red text-white font-semibold py-3 rounded-lg opacity-60 cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L3 7v6c0 5 4 9 9 10 5-1 9-5 9-10V7L12 2z" />
            </svg>
            Sign in with CMU SSO
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            Andrew ID single sign-on — coming soon
          </p>
        </div>

        {/* ── DEV BYPASS — remove before deploy ── */}
        <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 overflow-hidden">
          <button
            onClick={() => setDevOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">🚧</span>
              Dev bypass — remove before deploy
            </span>
            <span className="text-amber-500">{devOpen ? "▲" : "▼"}</span>
          </button>

          {devOpen && (
            <div className="px-4 pb-4 space-y-2 border-t border-amber-200">
              <p className="text-xs text-amber-700 pt-3 mb-3">
                One-click login with seeded test accounts. This panel will be removed when CMU SSO is wired up.
              </p>
              {DEV_ACCOUNTS.map(acct => (
                <button
                  key={acct.email}
                  onClick={() => devLogin(acct.email, acct.password)}
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
            </div>
          )}
        </div>

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
