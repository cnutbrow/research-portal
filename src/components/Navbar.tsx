"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/")
      ? "text-white font-semibold underline underline-offset-4 decoration-white/60"
      : "text-red-100 hover:text-white transition-colors";

  return (
    <nav className="relative bg-cmu-red text-white shadow-md overflow-hidden">

      {/* Tartan plaid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent 0px, transparent 14px,
              #fff 14px, #fff 18px,
              transparent 18px, transparent 30px,
              #000 30px, #000 34px,
              transparent 34px, transparent 48px
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0px, transparent 14px,
              #fff 14px, #fff 18px,
              transparent 18px, transparent 30px,
              #000 30px, #000 34px,
              transparent 34px, transparent 48px
            )
          `,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo + nav links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center shadow-sm">
                <span className="text-cmu-red font-black text-sm leading-none">CMU</span>
              </div>
              <span className="font-bold text-lg hidden sm:block tracking-tight">Research Portal</span>
            </Link>

            <div className="hidden sm:flex items-center gap-6 text-sm">
              <Link href="/opportunities" className={isActive("/opportunities")}>Browse</Link>

              {session?.user.role === "FACULTY" && (
                <>
                  <Link href="/faculty/post"      className={isActive("/faculty/post")}>Post</Link>
                  <Link href="/faculty/dashboard" className={isActive("/faculty/dashboard")}>My Postings</Link>
                </>
              )}

              {session?.user.role === "STUDENT" && (
                <Link href="/student/applications" className={isActive("/student/applications")}>
                  My Applications
                </Link>
              )}
            </div>
          </div>

          {/* User info + sign out */}
          <div className="flex items-center gap-4 text-sm">
            {session ? (
              <>
                <span className="text-red-100 hidden md:block max-w-[180px] truncate">
                  {session.user.name}
                  <span className="text-red-200/70 ml-1.5 text-xs capitalize">
                    ({session.user.role.toLowerCase()})
                  </span>
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="bg-white/15 hover:bg-white/25 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors border border-white/20"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-white text-cmu-red font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
