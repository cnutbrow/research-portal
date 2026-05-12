"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Application {
  id: string;
  coverLetter: string;
  resumeText: string | null;
  status: string;
  createdAt: string;
  student: { name: string; email: string; bio: string | null };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  REVIEWING: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function FacultyApplicationsPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const { data: session, status } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch(`/api/applications?opportunityId=${opportunityId}`)
        .then(r => r.json())
        .then(data => { setApplications(data); setLoading(false); });
    }
  }, [status, opportunityId]);

  async function updateStatus(appId: string, newStatus: string) {
    await fetch(`/api/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
  }

  if (status === "loading" || loading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (!session || session.user.role !== "FACULTY") return <div className="p-8 text-center">Access denied.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/faculty/dashboard" className="text-sm text-cmu-red hover:underline mb-6 inline-block">
        ← Back to dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-500 mt-1">{applications.length} total applicant{applications.length !== 1 ? "s" : ""}</p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-xl font-semibold text-gray-800">No applications yet</h2>
          <p className="text-gray-500 mt-2">Applications will appear here when students apply.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === app.id ? null : app.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-cmu-red rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {app.student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{app.student.name}</p>
                    <p className="text-sm text-gray-500">{app.student.email} · Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[app.status]}`}>
                    {app.status.charAt(0) + app.status.slice(1).toLowerCase()}
                  </span>
                  <span className="text-gray-400 text-sm">{expanded === app.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {expanded === app.id && (
                <div className="border-t border-gray-100 p-5 space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Cover letter</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4">
                      {app.coverLetter}
                    </p>
                  </div>

                  {app.resumeText && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Resume / CV</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                        {app.resumeText}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-gray-600 font-medium">Update status:</span>
                    {["PENDING", "REVIEWING", "ACCEPTED", "REJECTED"].map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(app.id, s)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${
                          app.status === s
                            ? STATUS_COLORS[s] + " border-transparent"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </button>
                    ))}
                    <a
                      href={`mailto:${app.student.email}`}
                      className="ml-auto text-sm text-cmu-red hover:underline"
                    >
                      Email {app.student.name.split(" ")[0]} →
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
