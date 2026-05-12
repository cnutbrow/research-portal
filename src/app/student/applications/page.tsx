"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { DocumentInput } from "@/components/DocumentInput";
import { DocumentViewer } from "@/components/DocumentViewer";

interface Application {
  id: string;
  coverLetter: string;
  resumeText: string | null;
  resumeFileName: string | null;
  transcriptText: string | null;
  transcriptFileName: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  opportunity: {
    id: string;
    title: string;
    department: string;
    remote: string;
    payType: string;
    payAmount: number | null;
    cvRequirement: string;
    transcriptRequirement: string;
    faculty: { name: string; department: string | null };
  };
}

type ApplicationStatus = "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED";

const STATUS_CONFIG: Record<ApplicationStatus, {
  label: string; color: string; dot: string; bg: string; message: string; icon: string;
}> = {
  PENDING:   {
    label: "Pending review",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dot: "bg-yellow-400", bg: "bg-yellow-50",
    icon: "⏳",
    message: "Your application has been received and is waiting to be reviewed.",
  },
  REVIEWING: {
    label: "Under review",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-500", bg: "bg-blue-50",
    icon: "👀",
    message: "The faculty member is actively reviewing your application.",
  },
  ACCEPTED:  {
    label: "Accepted",
    color: "bg-green-100 text-green-800 border-green-200",
    dot: "bg-green-500", bg: "bg-green-50",
    icon: "🎉",
    message: "Congratulations! You've been accepted. Expect an email from the faculty member.",
  },
  REJECTED:  {
    label: "Not selected",
    color: "bg-gray-100 text-gray-500 border-gray-200",
    dot: "bg-gray-300", bg: "bg-gray-50",
    icon: "📋",
    message: "The position was filled by another candidate. Keep applying!",
  },
};

const REMOTE_LABELS: Record<string, string> = {
  REMOTE: "Remote", IN_PERSON: "In-person", HYBRID: "Hybrid",
};
const PAY_LABELS: Record<string, string> = {
  HOURLY: "Hourly", STIPEND: "Grant", UNPAID: "Unpaid", CREDIT: "Course Credit",
};

// ── Inline edit form ──────────────────────────────────────────────────────────
function EditForm({
  app,
  onSave,
  onCancel,
}: {
  app: Application;
  onSave: (updated: Application) => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [coverLetter,        setCoverLetter]        = useState(app.coverLetter === "(No personal statement provided)" ? "" : app.coverLetter);
  const [resumeText,         setResumeText]         = useState(app.resumeText         ?? "");
  const [resumeFileName,     setResumeFileName]     = useState<string | null>(app.resumeFileName);
  const [transcriptText,     setTranscriptText]     = useState(app.transcriptText     ?? "");
  const [transcriptFileName, setTranscriptFileName] = useState<string | null>(app.transcriptFileName);

  const cvReq         = app.opportunity.cvRequirement;
  const transcriptReq = app.opportunity.transcriptRequirement;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (cvReq === "REQUIRED" && !resumeText) {
      setError("A CV / Resume is required for this position."); return;
    }
    if (transcriptReq === "REQUIRED" && !transcriptText) {
      setError("A transcript is required for this position."); return;
    }
    setSaving(true); setError("");

    const res = await fetch(`/api/applications/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coverLetter:        coverLetter        || "(No personal statement provided)",
        resumeText:         resumeText         || null,
        resumeFileName:     resumeFileName     || null,
        transcriptText:     transcriptText     || null,
        transcriptFileName: transcriptFileName || null,
      }),
    });

    if (!res.ok) { const d = await res.json(); setError(d.error || "Save failed"); setSaving(false); return; }
    const updated = await res.json();
    onSave({ ...app, ...updated });
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 pt-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Personal statement */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <label className="text-sm font-medium text-gray-700">Personal statement</label>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">optional</span>
        </div>
        <textarea
          value={coverLetter}
          onChange={e => setCoverLetter(e.target.value)}
          rows={6}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent resize-y"
        />
      </div>

      {/* CV */}
      {cvReq !== "UNAVAILABLE" && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-sm font-medium text-gray-700">CV / Resume</label>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${cvReq === "REQUIRED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
              {cvReq === "REQUIRED" ? "required" : "optional"}
            </span>
          </div>
          <DocumentInput
            textValue={resumeText}
            onChange={(content, fname) => { setResumeText(content); setResumeFileName(fname); }}
            label="CV"
            placeholder="Paste your CV or resume text here…"
          />
        </div>
      )}

      {/* Transcript */}
      {transcriptReq !== "UNAVAILABLE" && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-sm font-medium text-gray-700">Unofficial Transcript</label>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${transcriptReq === "REQUIRED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
              {transcriptReq === "REQUIRED" ? "required" : "optional"}
            </span>
          </div>
          <DocumentInput
            textValue={transcriptText}
            onChange={(content, fname) => { setTranscriptText(content); setTranscriptFileName(fname); }}
            label="transcript"
            placeholder="Paste your transcript text here…"
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit" disabled={saving}
          className="bg-cmu-red text-white font-semibold px-5 py-2 rounded-lg hover:bg-cmu-dark transition-colors disabled:opacity-60 text-sm"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button" onClick={onCancel}
          className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StudentApplicationsPage() {
  const { data: session, status } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/applications")
        .then(r => r.json())
        .then(data => { setApplications(Array.isArray(data) ? data : []); setLoading(false); });
    }
  }, [status]);

  const counts = useMemo(() => {
    const c = { PENDING: 0, REVIEWING: 0, ACCEPTED: 0, REJECTED: 0 };
    applications.forEach(a => { c[a.status] = (c[a.status] || 0) + 1; });
    return c;
  }, [applications]);

  const filtered = filterStatus === "ALL"
    ? applications
    : applications.filter(a => a.status === filterStatus);

  const canEdit = (status: ApplicationStatus) => status === "PENDING" || status === "REVIEWING";

  if (status === "loading" || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!session || session.user.role !== "STUDENT") {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Sign in as a student to see your applications.</p>
        <Link href="/login" className="text-cmu-red font-semibold hover:underline mt-2 inline-block">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-500 mt-1">Track every position you&apos;ve applied to</p>
        </div>
        <Link
          href="/opportunities"
          className="bg-cmu-red text-white font-semibold px-4 py-2 rounded-lg hover:bg-cmu-dark transition-colors text-sm"
        >
          + Browse more
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-5xl mb-4">🔭</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No applications yet</h2>
          <p className="text-gray-400 mb-6">Find a research opportunity that interests you and apply.</p>
          <Link href="/opportunities" className="bg-cmu-red text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-cmu-dark transition-colors">
            Browse opportunities
          </Link>
        </div>
      ) : (
        <>
          {/* Status overview cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {(["PENDING","REVIEWING","ACCEPTED","REJECTED"] as ApplicationStatus[]).map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(filterStatus === s ? "ALL" : s)}
                  className={`rounded-xl border p-4 text-left hover:shadow-sm transition-all ${cfg.bg} ${
                    filterStatus === s ? "border-cmu-red ring-1 ring-cmu-red" : "border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="text-xs text-gray-500 font-medium">{cfg.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{counts[s]}</p>
                </button>
              );
            })}
          </div>

          {/* Filter chip */}
          {filterStatus !== "ALL" && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">Showing:</span>
              <span className={`text-xs px-3 py-1 rounded-full border font-medium ${STATUS_CONFIG[filterStatus as ApplicationStatus].color}`}>
                {STATUS_CONFIG[filterStatus as ApplicationStatus].label}
              </span>
              <button onClick={() => setFilterStatus("ALL")} className="text-xs text-cmu-red hover:underline">
                Clear filter
              </button>
            </div>
          )}

          {/* Application cards */}
          <div className="space-y-3">
            {filtered.map(app => {
              const cfg    = STATUS_CONFIG[app.status];
              const isOpen = expanded === app.id;
              const isEditing = editing === app.id;

              return (
                <div
                  key={app.id}
                  className={`bg-white rounded-xl border transition-shadow overflow-hidden ${
                    isOpen ? "border-cmu-red shadow-md" : "border-gray-200 hover:shadow-sm"
                  }`}
                >
                  {/* Status accent bar */}
                  <div className={`h-1 w-full ${cfg.dot}`} />

                  {/* Summary row */}
                  <div
                    className="flex items-center gap-4 p-5 cursor-pointer"
                    onClick={() => { setExpanded(isOpen ? null : app.id); if (isOpen) setEditing(null); }}
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/opportunities/${app.opportunity.id}`}
                        onClick={e => e.stopPropagation()}
                        className="font-semibold text-gray-900 hover:text-cmu-red transition-colors block truncate"
                      >
                        {app.opportunity.title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">
                        {app.opportunity.faculty.name} · {app.opportunity.department}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {REMOTE_LABELS[app.opportunity.remote]}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {PAY_LABELS[app.opportunity.payType]}
                          {app.opportunity.payAmount ? ` · $${app.opportunity.payAmount}` : ""}
                        </span>
                        <span className="text-xs text-gray-400">
                          Applied {new Date(app.createdAt).toLocaleDateString()}
                          {app.updatedAt !== app.createdAt && (
                            <span className="ml-1 text-gray-300">· edited {new Date(app.updatedAt).toLocaleDateString()}</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <span className={`text-gray-400 text-sm transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className={`border-t border-gray-100 p-5 space-y-4 ${cfg.bg}`}>
                      {/* Status message */}
                      <div className="flex items-start gap-3 bg-white rounded-lg p-4 border border-gray-100">
                        <span className="text-xl mt-0.5">{cfg.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{cfg.label}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{cfg.message}</p>
                        </div>
                      </div>

                      {isEditing ? (
                        <EditForm
                          app={app}
                          onSave={updated => {
                            setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
                            setEditing(null);
                          }}
                          onCancel={() => setEditing(null)}
                        />
                      ) : (
                        <>
                          {/* Personal statement */}
                          <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Personal statement</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-white rounded-lg p-4 border border-gray-100 max-h-48 overflow-y-auto">
                              {app.coverLetter === "(No personal statement provided)"
                                ? <span className="italic text-gray-400">Not provided</span>
                                : app.coverLetter}
                            </p>
                          </div>

                          {/* CV */}
                          {app.opportunity.cvRequirement !== "UNAVAILABLE" && (
                            <div>
                              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">CV / Resume</h3>
                              <DocumentViewer content={app.resumeText} fileName={app.resumeFileName} />
                            </div>
                          )}

                          {/* Transcript */}
                          {app.opportunity.transcriptRequirement !== "UNAVAILABLE" && (
                            <div>
                              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Transcript</h3>
                              <DocumentViewer content={app.transcriptText} fileName={app.transcriptFileName} />
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-4 flex-wrap">
                            <Link
                              href={`/opportunities/${app.opportunity.id}`}
                              className="text-sm text-cmu-red font-semibold hover:underline"
                            >
                              View posting →
                            </Link>
                            {canEdit(app.status) && (
                              <button
                                onClick={() => setEditing(app.id)}
                                className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                              >
                                ✏️ Edit application
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
