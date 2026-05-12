"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CMU_COLLEGES, PAY_LABELS, REMOTE_LABELS, DOC_REQ_LABELS } from "@/lib/constants";

export default function PostOpportunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "", description: "", department: "", subject: "",
    payType: "HOURLY", payAmount: "", remote: "IN_PERSON",
    prerequisites: "", hoursPerWeek: "",
    skills: "", positions: "1", deadline: "",
    cvRequirement: "OPTIONAL", transcriptRequirement: "UNAVAILABLE",
  });

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  if (status === "loading") return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (!session || session.user.role !== "FACULTY") {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Only faculty members can post opportunities.</p>
        <Link href="/login" className="text-cmu-red font-semibold hover:underline mt-2 inline-block">Sign in</Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        payAmount:    form.payAmount    ? parseFloat(form.payAmount)    : null,
        hoursPerWeek: form.hoursPerWeek ? parseInt(form.hoursPerWeek)   : null,
        positions:    parseInt(form.positions) || 1,
        deadline:     form.deadline || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to post opportunity");
      setLoading(false);
      return;
    }

    router.push("/faculty/dashboard");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Post Research Opportunity</h1>
        <p className="text-gray-500 mt-1">Fill in the details below to list your research position.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Position title *</label>
          <input
            type="text" required value={form.title} onChange={e => set("title", e.target.value)}
            placeholder="e.g., Machine Learning Research Assistant"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent"
          />
        </div>

        {/* College + Research area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">College *</label>
            <select
              required value={form.department} onChange={e => set("department", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent bg-white"
            >
              <option value="">Select college</option>
              {CMU_COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Research area *</label>
            <input
              type="text" required value={form.subject} onChange={e => set("subject", e.target.value)}
              placeholder="e.g., Natural Language Processing"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
          <textarea
            required value={form.description} onChange={e => set("description", e.target.value)}
            rows={6}
            placeholder="Describe the project, student responsibilities, what they will learn, and any other relevant details…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent resize-y"
          />
        </div>

        {/* Pay */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Compensation *</label>
            <select
              required value={form.payType} onChange={e => set("payType", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent bg-white"
            >
              {Object.entries(PAY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          {(form.payType === "HOURLY" || form.payType === "STIPEND") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {form.payType === "HOURLY" ? "Hourly rate ($)" : "Grant amount ($)"}
              </label>
              <input
                type="number" min="0" step="0.01" value={form.payAmount}
                onChange={e => set("payAmount", e.target.value)}
                placeholder={form.payType === "HOURLY" ? "e.g., 15.00" : "e.g., 3000"}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Remote / Positions / Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Work format *</label>
            <select
              required value={form.remote} onChange={e => set("remote", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent bg-white"
            >
              {Object.entries(REMOTE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Open positions</label>
            <input
              type="number" min="1" value={form.positions}
              onChange={e => set("positions", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hours per week <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="number" min="1" max="40" value={form.hoursPerWeek}
              onChange={e => set("hoursPerWeek", e.target.value)}
              placeholder="e.g., 10"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent"
            />
          </div>
        </div>

        {/* Prerequisites */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Prerequisites <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text" value={form.prerequisites} onChange={e => set("prerequisites", e.target.value)}
            placeholder="e.g., 15-122, 21-120, 36-200 — list required course numbers"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">List CMU course numbers students should have completed.</p>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Required skills / tools <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text" value={form.skills} onChange={e => set("skills", e.target.value)}
            placeholder="e.g., Python, PyTorch, Git, R — separate with commas"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent"
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Application deadline <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent"
          />
        </div>

        {/* Document requirements */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Application documents</label>
          <p className="text-xs text-gray-400 mb-3 -mt-2">
            Choose whether students must, may, or cannot submit each document type.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CV / Resume</label>
              <select
                value={form.cvRequirement} onChange={e => set("cvRequirement", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent bg-white"
              >
                {Object.entries(DOC_REQ_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Unofficial Transcript</label>
              <select
                value={form.transcriptRequirement} onChange={e => set("transcriptRequirement", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent bg-white"
              >
                {Object.entries(DOC_REQ_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit" disabled={loading}
            className="bg-cmu-red text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-cmu-dark transition-colors disabled:opacity-60"
          >
            {loading ? "Posting…" : "Post opportunity"}
          </button>
          <Link
            href="/faculty/dashboard"
            className="border border-gray-300 text-gray-700 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
