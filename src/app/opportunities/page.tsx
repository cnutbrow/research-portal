"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CMU_COLLEGES, PAY_LABELS, PAY_COLORS, REMOTE_LABELS, REMOTE_COLORS } from "@/lib/constants";

interface Opportunity {
  id: string;
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
  createdAt: string;
  faculty: { name: string; department: string | null };
  _count: { applications: number };
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ college: "", remote: "", payType: "" });

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)          params.set("search",  search);
    if (filters.college) params.set("college", filters.college);
    if (filters.remote)  params.set("remote",  filters.remote);
    if (filters.payType) params.set("payType", filters.payType);

    const res = await fetch(`/api/opportunities?${params}`);
    setOpportunities(await res.json());
    setLoading(false);
  }, [search, filters]);

  useEffect(() => {
    const t = setTimeout(fetchOpportunities, 300);
    return () => clearTimeout(t);
  }, [fetchOpportunities]);

  function toggleFilter(key: keyof typeof filters, value: string) {
    setFilters(f => ({ ...f, [key]: f[key] === value ? "" : value }));
  }

  const activeCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Research Opportunities</h1>
        <p className="text-gray-500 mt-1">Undergraduate research positions at Carnegie Mellon University</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Sidebar filters ── */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              {activeCount > 0 && (
                <button
                  onClick={() => { setFilters({ college: "", remote: "", payType: "" }); setSearch(""); }}
                  className="text-xs text-cmu-red hover:underline"
                >
                  Clear ({activeCount})
                </button>
              )}
            </div>

            <input
              type="text" placeholder="Search positions…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent mb-5"
            />

            {/* College */}
            <FilterSection title="College">
              <select
                value={filters.college}
                onChange={e => setFilters(f => ({ ...f, college: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red bg-white"
              >
                <option value="">All colleges</option>
                {CMU_COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FilterSection>

            {/* Work format */}
            <FilterSection title="Work format">
              {Object.entries(REMOTE_LABELS).map(([val, label]) => (
                <FilterChip key={val} active={filters.remote === val} onClick={() => toggleFilter("remote", val)}>
                  {label}
                </FilterChip>
              ))}
            </FilterSection>

            {/* Compensation */}
            <FilterSection title="Compensation" last>
              {Object.entries(PAY_LABELS).map(([val, label]) => (
                <FilterChip key={val} active={filters.payType === val} onClick={() => toggleFilter("payType", val)}>
                  {label}
                </FilterChip>
              ))}
            </FilterSection>
          </div>
        </aside>

        {/* ── Results ── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-16 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : opportunities.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-14 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No results found</h2>
              <p className="text-gray-400">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                {opportunities.length} opportunit{opportunities.length !== 1 ? "ies" : "y"} found
              </p>
              {opportunities.map(opp => (
                <Link key={opp.id} href={`/opportunities/${opp.id}`} className="block group">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-cmu-red hover:shadow-md transition-all">

                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-cmu-red transition-colors">
                          {opp.title}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {opp.faculty.name} · {opp.department}
                        </p>
                      </div>
                      {opp.deadline && (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                          Due {new Date(opp.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{opp.description}</p>

                    <div className="flex flex-wrap gap-2 text-xs mb-3">
                      <span className={`px-2.5 py-1 rounded-full font-medium ${REMOTE_COLORS[opp.remote]}`}>
                        {REMOTE_LABELS[opp.remote]}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full font-medium ${PAY_COLORS[opp.payType]}`}>
                        {PAY_LABELS[opp.payType]}
                        {opp.payAmount ? ` · $${opp.payAmount}${opp.payType === "HOURLY" ? "/hr" : ""}` : ""}
                      </span>
                      {opp.hoursPerWeek && (
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                          {opp.hoursPerWeek} hrs/week
                        </span>
                      )}
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        {opp.positions} spot{opp.positions !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {opp.skills && (
                      <div className="flex flex-wrap gap-1.5">
                        {opp.skills.split(",").slice(0, 5).map(s => s.trim()).filter(Boolean).map(skill => (
                          <span key={skill} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                        {opp.skills.split(",").length > 5 && (
                          <span className="text-xs text-gray-400">+{opp.skills.split(",").length - 5} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={last ? "mt-5" : "mb-5 pb-5 border-b border-gray-100"}>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</h3>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
        active ? "border-cmu-red bg-red-50 text-cmu-red font-semibold" : "border-gray-200 text-gray-600 hover:border-gray-300"
      }`}
    >
      {children}
    </button>
  );
}
