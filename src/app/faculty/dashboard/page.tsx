"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PAY_LABELS, REMOTE_LABELS } from "@/lib/constants";
import { DocumentViewer } from "@/components/DocumentViewer";

interface Opportunity {
  id: string;
  title: string;
  department: string;
  subject: string;
  payType: string;
  payAmount: number | null;
  remote: string;
  hoursPerWeek: number | null;
  positions: number;
  deadline: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { applications: number };
}

type AppStatus = "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED";

interface Application {
  id: string;
  coverLetter: string;
  resumeText: string | null;
  resumeFileName: string | null;
  transcriptText: string | null;
  transcriptFileName: string | null;
  status: AppStatus;
  createdAt: string;
  student: { name: string; email: string; bio: string | null };
}

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string }> = {
  PENDING:   { label: "Pending",      color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  REVIEWING: { label: "Reviewing",    color: "bg-blue-100 text-blue-800 border-blue-200" },
  ACCEPTED:  { label: "Accepted",     color: "bg-green-100 text-green-800 border-green-200" },
  REJECTED:  { label: "Not selected", color: "bg-gray-100 text-gray-500 border-gray-200" },
};

export default function FacultyDashboardPage() {
  const { data: session, status } = useSession();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // Which opportunity's applicant list is open
  const [openOppId, setOpenOppId] = useState<string | null>(null);
  // Cached applications per opportunity
  const [appCache, setAppCache] = useState<Record<string, Application[]>>({});
  const [appLoading, setAppLoading] = useState(false);
  // Which individual applicant is expanded
  const [openAppId, setOpenAppId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/opportunities?myPostings=true")
        .then(r => r.json())
        .then(data => { setOpportunities(data); setLoading(false); });
    }
  }, [status]);

  const toggleApplicants = useCallback(async (oppId: string) => {
    if (openOppId === oppId) {
      setOpenOppId(null);
      setOpenAppId(null);
      return;
    }
    setOpenOppId(oppId);
    setOpenAppId(null);
    if (!appCache[oppId]) {
      setAppLoading(true);
      const res = await fetch(`/api/applications?opportunityId=${oppId}`);
      const data = await res.json();
      setAppCache(c => ({ ...c, [oppId]: data }));
      setAppLoading(false);
    }
  }, [openOppId, appCache]);

  const updateStatus = useCallback(async (appId: string, oppId: string, newStatus: AppStatus) => {
    await fetch(`/api/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setAppCache(c => ({
      ...c,
      [oppId]: c[oppId].map(a => a.id === appId ? { ...a, status: newStatus } : a),
    }));
  }, []);

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/opportunities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, isActive: !current } : o));
  }

  async function deleteOpportunity(id: string) {
    if (!confirm("Delete this opportunity? This cannot be undone.")) return;
    await fetch(`/api/opportunities/${id}`, { method: "DELETE" });
    setOpportunities(prev => prev.filter(o => o.id !== id));
    setAppCache(c => { const n = { ...c }; delete n[id]; return n; });
  }

  if (status === "loading" || loading) return <div className="p-8 text-center text-gray-400">Loading…</div>;
  if (!session || session.user.role !== "FACULTY") return <div className="p-8 text-center">Access denied.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Postings</h1>
          <p className="text-gray-500 mt-1">Manage your research opportunities</p>
        </div>
        <Link href="/faculty/post" className="bg-cmu-red text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-cmu-dark transition-colors">
          + New opportunity
        </Link>
      </div>

      {opportunities.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-14 text-center">
          <div className="text-4xl mb-4">🔬</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No postings yet</h2>
          <p className="text-gray-400 mb-6">Post your first undergraduate research opportunity.</p>
          <Link href="/faculty/post" className="bg-cmu-red text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-cmu-dark transition-colors">
            Post opportunity
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map(opp => {
            const isOpen = openOppId === opp.id;
            const apps   = appCache[opp.id] ?? [];

            return (
              <div key={opp.id} className={`bg-white rounded-xl border overflow-hidden transition-shadow ${isOpen ? "border-cmu-red shadow-md" : "border-gray-200"}`}>

                {/* ── Posting header ── */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h2 className="text-lg font-semibold text-gray-900">{opp.title}</h2>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${opp.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {opp.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{opp.department} · {opp.subject}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{REMOTE_LABELS[opp.remote]}</span>
                        <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                          {PAY_LABELS[opp.payType]}{opp.payAmount ? ` · $${opp.payAmount}${opp.payType === "HOURLY" ? "/hr" : ""}` : ""}
                        </span>
                        {opp.hoursPerWeek && <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{opp.hoursPerWeek} hrs/week</span>}
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{opp.positions} position{opp.positions !== 1 ? "s" : ""}</span>
                        {opp.deadline && <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">Due {new Date(opp.deadline).toLocaleDateString()}</span>}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                      {/* Applicants toggle */}
                      <button
                        onClick={() => toggleApplicants(opp.id)}
                        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                          isOpen
                            ? "bg-cmu-red text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        <span>{opp._count.applications} applicant{opp._count.applications !== 1 ? "s" : ""}</span>
                        <span className={`text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => toggleActive(opp.id, opp.isActive)}
                          className="text-xs border border-gray-300 text-gray-600 px-2.5 py-1 rounded hover:bg-gray-50 transition-colors">
                          {opp.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button onClick={() => deleteOpportunity(opp.id)}
                          className="text-xs border border-red-200 text-red-600 px-2.5 py-1 rounded hover:bg-red-50 transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Inline applicants panel ── */}
                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    {appLoading ? (
                      <div className="p-6 text-center text-gray-400 text-sm">Loading applicants…</div>
                    ) : apps.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-400 text-sm">No applications yet for this posting.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {apps.map(app => {
                          const cfg    = STATUS_CONFIG[app.status];
                          const appOpen = openAppId === app.id;

                          return (
                            <div key={app.id} className="bg-white">
                              {/* Applicant summary row */}
                              <div
                                className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setOpenAppId(appOpen ? null : app.id)}
                              >
                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full bg-cmu-red flex items-center justify-center text-white font-bold text-sm shrink-0">
                                  {app.student.name.charAt(0).toUpperCase()}
                                </div>

                                {/* Name + email + date */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm">{app.student.name}</p>
                                  <p className="text-xs text-gray-400">
                                    {app.student.email}
                                    <span className="mx-1.5">·</span>
                                    Applied {new Date(app.createdAt).toLocaleDateString()}
                                  </p>
                                </div>

                                {/* Status badge */}
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 hidden sm:inline ${cfg.color}`}>
                                  {cfg.label}
                                </span>

                                {/* Chevron */}
                                <span className={`text-gray-400 text-xs transition-transform shrink-0 ${appOpen ? "rotate-180" : ""}`}>▼</span>
                              </div>

                              {/* Expanded applicant detail */}
                              {appOpen && (
                                <div className="px-6 pb-6 space-y-5 bg-gray-50 border-t border-gray-100">

                                  {/* Personal statement + resume side by side */}
                                  <div className="grid sm:grid-cols-2 gap-4 pt-4">
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Personal Statement</h4>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-white rounded-lg p-4 border border-gray-100 max-h-52 overflow-y-auto">
                                        {app.coverLetter || <span className="italic text-gray-400">Not provided</span>}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">CV / Resume</h4>
                                      <DocumentViewer content={app.resumeText} fileName={app.resumeFileName} />
                                    </div>
                                  </div>

                                  {/* Transcript (if submitted) */}
                                  {app.transcriptText && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Transcript</h4>
                                      <DocumentViewer content={app.transcriptText} fileName={app.transcriptFileName} />
                                    </div>
                                  )}

                                  {/* Bio if present */}
                                  {app.student.bio && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Student bio</h4>
                                      <p className="text-sm text-gray-600">{app.student.bio}</p>
                                    </div>
                                  )}

                                  {/* Status controls + email */}
                                  <div className="flex items-center justify-between flex-wrap gap-3 pt-1 border-t border-gray-100">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs text-gray-500 font-medium">Status:</span>
                                      {(["PENDING","REVIEWING","ACCEPTED","REJECTED"] as AppStatus[]).map(s => (
                                        <button
                                          key={s}
                                          onClick={() => updateStatus(app.id, opp.id, s)}
                                          className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${
                                            app.status === s
                                              ? STATUS_CONFIG[s].color + " border-transparent"
                                              : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white"
                                          }`}
                                        >
                                          {STATUS_CONFIG[s].label}
                                        </button>
                                      ))}
                                    </div>
                                    <a
                                      href={`mailto:${app.student.email}?subject=Your application for: ${encodeURIComponent(opp.title)}`}
                                      className="text-sm text-cmu-red font-semibold hover:underline"
                                    >
                                      Email {app.student.name.split(" ")[0]} →
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
