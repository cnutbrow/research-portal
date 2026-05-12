import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CMU Undergraduate Research",
  description: "Carnegie Mellon University Undergraduate Research Opportunities",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="bg-cmu-red text-white text-center text-sm py-4 mt-auto">
            <p>© {new Date().getFullYear()} Carnegie Mellon University · Undergraduate Research Portal</p>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
