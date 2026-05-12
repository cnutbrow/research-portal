"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PAY_LABELS, REMOTE_LABELS } from "@/lib/constants";
import { DocumentInput } from "@/components/DocumentInput";
import { DocumentViewer } from "@/components/DocumentViewer";

interface Opportunity {
  id: string;
  facultyId: string;
  title: string;
  department: string;
  subject: string;
  description: string;
  payType: string;
  payAmount: number | null;
  remote: string;
  prerequisites: string | null;
  hoursPerWeek: number | null;
  skills: string;
  positions: number;
  deadline: string | null;
  cvRequirement: string;
  transcriptRequirement: string;
  createdAt: string;
  faculty: { name: string; email: string; department: string | null; bio: string | null };
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

function DocBadge({ req }: { req: string }) {
  if (req === "UNAVAILABLE") return null;
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
      req === "REQUIRED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"
    }`}>
      {req === "REQUIRED" ? "required" : "optional"}
    </span>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);

  // Application form state
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [personalStatement, setPersonalStatement] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptFileName, setTranscriptFileName] = useState<string | null>(null);
  const [appError, setAppError] = useState("");

  // Faculty applicants panel (only for the posting owner)
  const [apps, setApps] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsFetched, setAppsFetched] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [openAppId, setOpenAppId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/opportunities/${id}`)
      .then(r => r.json())
      .then(data => { setOpp(data); setLoading(false); });
  }, [id]);

  // Already-applied check for students
  useEffect(() => {
    if (session?.user.role === "STUDENT") {
      fetch(`/api/applications?check=${id}`)
        .then(r => r.json())
        .then(data => { if (data.applied) setAlreadyApplied(true); });
    }
  }, [id, session]);

  const isStudent = session?.user.role === "STUDENT";
  const isFaculty = session?.user.role === "FACULTY";
  const isOwner   = isFaculty && opp?.facultyId === (session?.user as { id?: string })?.id;

  const fetchApplicants = useCallback(async () => {
    if (appsFetched) return;
    setAppsLoading(true);
    const res  = await fetch(`/api/applications?opportunityId=${id}`);
    const data = await res.json();
    setApps(Array.isArray(data) ? data : []);
    setAppsFetched(true);
    setAppsLoading(false);
  }, [id, appsFetched]);

  function toggleApplicants() {
    if (!appsOpen) fetchApplicants();
    setAppsOpen(o => !o);
    setOpenAppId(null);
  }

  async function updateStatus(appId: string, newStatus: AppStatus) {
    await fetch(`/api/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!session) { router.push("/login"); return; }
    if (!opp) return;

    // Validate required documents
    if (opp.cvRequirement === "REQUIRED" && !resumeText) {
      setAppError("A CV / Resume is required for this position."); return;
    }
    if (opp.transcriptRequirement === "REQUIRED" && !transcriptText) {
      setAppError("An unofficial transcript is required for this position."); return;
    }

    setApplying(true);
    setAppError("");

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opportunityId:      id,
        coverLetter:        personalStatement || "(No personal statement provided)",
        resumeText:         resumeText         || null,
        resumeFileName:     resumeFileName     || null,
        transcriptText:     transcriptText     || null,
        transcriptFileName: transcriptFileName || null,
      }),
    });

    if (res.status === 409) { setAlreadyApplied(true); setShowForm(false); setApplying(false); return; }
    if (!res.ok) { const d = await res.json(); setAppError(d.error || "Failed to submit"); setApplying(false); return; }

    setApplied(true);
    setShowForm(false);
    setApplying(false);
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>;
  if (!opp)   return <div className="p-8 text-center text-gray-500">Opportunity not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/opportunities" className="text-sm text-cmu-red hover:underline mb-6 inline-flex items-center gap-1">
        ← Back to opportunities
      </Link>

      <div className="grid lg:grid-cols-3 gap-8 mt-4">

        {/* ── Main content ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{opp.title}</h1>
            <p className="text-gray-400 mb-6">{opp.faculty.name} · {opp.department}</p>

            <div className="flex flex-wrap gap-2 mb-6 text-sm">
              <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">{REMOTE_LABELS[opp.remote]}</span>
              <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-medium">
                {PAY_LABELS[opp.payType]}{opp.payAmount ? ` · $${opp.payAmount}${opp.payType === "HOURLY" ? "/hr" : ""}` : ""}
              </span>
              {opp.hoursPerWeek && (
                <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">{opp.hoursPerWeek} hrs / week</span>
              )}
              <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                {opp.positions} open position{opp.positions !== 1 ? "s" : ""}
              </span>
              {opp.deadline && (
                <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full">
                  Deadline: {new Date(opp.deadline).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="text-sm text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">{opp.description}</div>

            {opp.prerequisites && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Prerequisites</h3>
                <div className="flex flex-wrap gap-2">
                  {opp.prerequisites.split(",").map(c => c.trim()).filter(Boolean).map(course => (
                    <span key={course} className="text-sm font-mono bg-red-50 text-cmu-red border border-red-100 px-3 py-1 rounded-lg">
                      {course}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {opp.skills && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Skills / tools</h3>
                <div className="flex flex-wrap gap-2">
                  {opp.skills.split(",").map(s => s.trim()).filter(Boolean).map(skill => (
                    <span key={skill} className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Application form ── */}
          {isStudent && !applied && !alreadyApplied && (
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Apply for this position</h2>
              <p className="text-sm text-gray-400 mb-5">Your application goes directly to {opp.faculty.name}.</p>

              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-cmu-red text-white font-semibold px-6 py-3 rounded-lg hover:bg-cmu-dark transition-colors"
                >
                  Start application
                </button>
              ) : (
                <form onSubmit={handleApply} className="space-y-6">
                  {appError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{appError}</div>}

                  {/* Personal statement */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <label className="text-sm font-medium text-gray-700">Personal statement</label>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">optional</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      Tell the professor why you&apos;re interested and what makes you a good fit.
                    </p>
                    <textarea
                      value={personalStatement}
                      onChange={e => setPersonalStatement(e.target.value)}
                      rows={7}
                      placeholder="e.g. I'm a junior in SCS with a strong interest in AI safety…"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent resize-y"
                    />
                  </div>

                  {/* CV / Resume */}
                  {opp.cvRequirement !== "UNAVAILABLE" && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <label className="text-sm font-medium text-gray-700">CV / Resume</label>
                        <DocBadge req={opp.cvRequirement} />
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
                  {opp.transcriptRequirement !== "UNAVAILABLE" && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <label className="text-sm font-medium text-gray-700">Unofficial Transcript</label>
                        <DocBadge req={opp.transcriptRequirement} />
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
                      type="submit" disabled={applying}
                      className="bg-cmu-red text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-cmu-dark transition-colors disabled:opacity-60"
                    >
                      {applying ? "Submitting…" : "Submit application"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="border border-gray-300 text-gray-600 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {isStudent && applied && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4">
              <span className="text-3xl">✅</span>
              <div>
                <p className="font-semibold text-green-800">Application submitted!</p>
                <p className="text-sm text-green-700 mt-0.5">
                  {opp.faculty.name} will review it and reach out if interested.{" "}
                  <Link href="/student/applications" className="underline">Track your applications →</Link>
                </p>
              </div>
            </div>
          )}

          {isStudent && alreadyApplied && !applied && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-center gap-4">
              <span className="text-3xl">📋</span>
              <div>
                <p className="font-semibold text-blue-800">You&apos;ve already applied to this position.</p>
                <p className="text-sm text-blue-700 mt-0.5">
                  <Link href="/student/applications" className="underline">View your applications →</Link>
                </p>
              </div>
            </div>
          )}

          {isFaculty && !isOwner && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-400 text-center">
              Faculty accounts cannot apply to opportunities.
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Faculty contact</h3>
            <p className="font-medium text-gray-900">{opp.faculty.name}</p>
            {opp.faculty.department && <p className="text-sm text-gray-400 mt-0.5">{opp.faculty.department}</p>}
            <a href={`mailto:${opp.faculty.email}`} className="text-sm text-cmu-red hover:underline mt-2 block">
              {opp.faculty.email}
            </a>
            {opp.faculty.bio && <p className="text-sm text-gray-500 mt-3 leading-relaxed">{opp.faculty.bio}</p>}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              <Detail label="Research area"  value={opp.subject} />
              <Detail label="College"        value={opp.department} />
              <Detail label="Compensation"   value={`${PAY_LABELS[opp.payType]}${opp.payAmount ? ` · $${opp.payAmount}${opp.payType === "HOURLY" ? "/hr" : ""}` : ""}`} />
              <Detail label="Work format"    value={REMOTE_LABELS[opp.remote]} />
              {opp.hoursPerWeek && <Detail label="Hours / week" value={`${opp.hoursPerWeek} hrs`} />}
              <Detail label="Open positions" value={String(opp.positions)} />
              {opp.deadline && <Detail label="Deadline" value={new Date(opp.deadline).toLocaleDateString()} />}
              <Detail label="Applications"   value={String(opp._count.applications)} />
              <Detail label="Posted"         value={new Date(opp.createdAt).toLocaleDateString()} />
            </dl>
          </div>
        </div>
      </div>

      {/* ── Faculty applicants panel (owner only) ── */}
      {isOwner && (
        <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={toggleApplicants}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Applicants</h2>
              <span className="text-sm bg-cmu-red text-white px-2.5 py-0.5 rounded-full font-medium">
                {opp._count.applications}
              </span>
            </div>
            <span className={`text-gray-400 transition-transform ${appsOpen ? "rotate-180" : ""}`}>▼</span>
          </button>

          {appsOpen && (
            <div className="border-t border-gray-100">
              {appsLoading ? (
                <div className="p-8 text-center text-gray-400 text-sm">Loading applicants…</div>
              ) : apps.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No applications yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {apps.map(app => {
                    const cfg    = STATUS_CONFIG[app.status];
                    const appOpen = openAppId === app.id;

                    return (
                      <div key={app.id} className="bg-white">
                        {/* Applicant row */}
                        <div
                          className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setOpenAppId(appOpen ? null : app.id)}
                        >
                          <div className="w-9 h-9 rounded-full bg-cmu-red flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {app.student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{app.student.name}</p>
                            <p className="text-xs text-gray-400">
                              {app.student.email}
                              <span className="mx-1.5">·</span>
                              Applied {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 hidden sm:inline ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className={`text-gray-400 text-xs transition-transform shrink-0 ${appOpen ? "rotate-180" : ""}`}>▼</span>
                        </div>

                        {/* Applicant detail */}
                        {appOpen && (
                          <div className="px-6 pb-6 space-y-5 bg-gray-50 border-t border-gray-100">
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

                            {opp.transcriptRequirement !== "UNAVAILABLE" && (
                              <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Transcript</h4>
                                <DocumentViewer content={app.transcriptText} fileName={app.transcriptFileName} />
                              </div>
                            )}

                            {app.student.bio && (
                              <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Student bio</h4>
                                <p className="text-sm text-gray-600">{app.student.bio}</p>
                              </div>
                            )}

                            <div className="flex items-center justify-between flex-wrap gap-3 pt-1 border-t border-gray-100">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-500 font-medium">Status:</span>
                                {(["PENDING","REVIEWING","ACCEPTED","REJECTED"] as AppStatus[]).map(s => (
                                  <button
                                    key={s}
                                    onClick={() => updateStatus(app.id, s)}
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
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-800">{value}</dd>
    </div>
  );
}
