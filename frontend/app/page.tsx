"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Library,
  Activity,
  Settings,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  GitBranch,
  ShieldCheck,
  Zap,
  ChevronRight,
  Database,
  Terminal,
  Container,
  Trello,
  Maximize2,
  Minimize2,
  X,
  ExternalLink,
  MoreVertical,
  Filter,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles
} from "lucide-react";

// --- Types ---
interface Repository {
  id: string;
  url: string;
  name: string | null;
  status: "pending" | "cloning" | "completed" | "failed";
  local_path: string | null;
  analysis_results?: {
    static_scan: {
      stack: string[];
      standards: Record<string, boolean>;
      testing: {
        detected: boolean;
        frameworks: string[];
      };
    };
    structural_evaluation: {
      patterns_detected: string[];
      modularity_score: number;
      concerns_separation: string;
    };
    architectural_critique: string;
    maturity_label: string;
    score_breakdown: Record<string, number>;
    actionable_roadmap: {
      title: string;
      description: string;
      action: string;
      guide: string;
    }[];
    security_findings: {
      type: string;
      severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
      label: string;
      file: string;
      description: string;
    }[];
  };
  overall_score: number;
  created_at: string;
}

type ViewType = "dashboard" | "fleet" | "activity" | "settings";

export default function Dashboard() {
  // --- App State ---
  const [view, setView] = useState<ViewType>("dashboard");
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [apiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");

  const selectedRepo = useMemo(() =>
    repositories.find(r => r.id === selectedRepoId) || null,
    [repositories, selectedRepoId]);

  // --- Data Fetching ---
  const fetchRepositories = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/repositories/`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRepositories(data);
        setBackendStatus("connected");
      }
    } catch (error) {
      setBackendStatus("disconnected");
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchRepositories();
    const interval = setInterval(fetchRepositories, 5000);
    return () => clearInterval(interval);
  }, [fetchRepositories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/repositories/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl }),
      });
      if (res.ok) {
        setRepoUrl("");
        fetchRepositories();
      }
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const total = repositories.length;
    const completed = repositories.filter(r => r.status === "completed").length;
    const avgScore = completed > 0
      ? Math.round(repositories.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / repositories.length)
      : 0;
    const productionGrade = repositories.filter(r => r.analysis_results?.maturity_label === "Production" || r.analysis_results?.maturity_label === "Enterprise").length;
    const totalThreats = repositories.reduce((acc, curr) => acc + (curr.analysis_results?.security_findings?.length || 0), 0);

    return { total, completed, avgScore, productionGrade, totalThreats };
  }, [repositories]);

  return (
    <div className="flex h-screen bg-[#05070a] text-slate-300 font-sans overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      {/* --- Sidebar --- */}
      <aside className="w-20 lg:w-64 flex flex-col border-r border-slate-800/50 bg-[#070912]/80 backdrop-blur-xl z-20 transition-all">
        <div className="p-6 mb-8 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-900/40 shrink-0">
            <Cpu className="text-white w-6 h-6" />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-black tracking-tighter text-white uppercase">Archon</h1>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Intel Core v2</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem active={view === "dashboard"} onClick={() => setView("dashboard")} icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem active={view === "fleet"} onClick={() => setView("fleet")} icon={<Library size={20} />} label="Project Fleet" />
          <NavItem active={view === "activity"} onClick={() => setView("activity")} icon={<Activity size={20} />} label="Activity" />
          <NavItem active={view === "settings"} onClick={() => setView("settings")} icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <div className={`flex items-center gap-3 p-3 rounded-2xl bg-slate-900/50 border transition-colors ${backendStatus === "connected" ? "border-emerald-500/20" : "border-rose-500/20"}`}>
            <div className={`h-2 w-2 rounded-full ${backendStatus === "connected" ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_emerald]" : "bg-rose-400 shadow-[0_0_8px_rose]"}`} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">
              {backendStatus === "connected" ? "Node Online" : "Node Offline"}
            </span>
          </div>
        </div>
      </aside>

      {/* --- Main Section --- */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-slate-800/50 flex items-center justify-between px-8 bg-[#070912]/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 capitalize">{view}</span>
            <ChevronRight size={14} className="text-slate-700" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">Main Canvas</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input type="text" placeholder="Search projects..." className="bg-slate-900/50 border border-slate-800 rounded-xl px-10 py-2 text-xs outline-none focus:border-blue-500/50 transition-colors w-64" />
            </div>
            <button className="h-10 px-4 bg-white text-black font-black text-[11px] uppercase rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 flex items-center gap-2">
              <PlusCircle size={16} />
              <span>Deploy Analysis</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {view === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                {/* Stats Ribbon */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard icon={<Layers className="text-blue-400" />} label="Monitored Repos" value={stats.total} detail="+2 this week" />
                  <StatCard icon={<Cpu className="text-purple-400" />} label="Analysis Mean" value={`${stats.avgScore}%`} detail="Health Index" />
                  <StatCard icon={<ShieldCheck className="text-emerald-400" />} label="Production Ready" value={stats.productionGrade} detail="Maturity Alpha" />
                  <StatCard
                    icon={<AlertCircle className={stats.totalThreats > 0 ? "text-rose-400 animate-pulse" : "text-slate-400"} />}
                    label="Active Threats"
                    value={stats.totalThreats}
                    detail={stats.totalThreats > 0 ? "Action Required" : "Nodes Secured"}
                  />
                </div>

                {/* Sub-Header */}
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">System Overview</h2>
                    <p className="text-slate-500 text-sm">Real-time status of your engineering fleet.</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors">7 Days</button>
                    <button className="px-3 py-1.5 rounded-lg bg-blue-600 border border-blue-500 text-[10px] font-black uppercase text-white shadow-lg shadow-blue-900/20">30 Days</button>
                  </div>
                </div>

                {/* Main Action Card */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {repositories.slice(0, 4).map(repo => (
                        <RepoCardSmall key={repo.id} repo={repo} onClick={() => setSelectedRepoId(repo.id)} />
                      ))}
                    </div>
                  </div>

                  {/* New Project Form (Quick-Access) */}
                  <div className="lg:col-span-4 p-8 rounded-[2rem] bg-gradient-to-br from-indigo-900/20 to-blue-900/10 border border-slate-800/50 backdrop-blur-xl space-y-6">
                    <div className="h-12 w-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                      <Zap className="text-blue-400" size={24} />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Quick Deploy</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <input
                        type="url"
                        placeholder="Git Repo URL"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 transition-all"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isSubmitLoading}
                        className="w-full py-3 bg-blue-600 rounded-xl text-xs font-black uppercase text-white hover:bg-blue-500 transition-all disabled:opacity-50"
                      >
                        {isSubmitLoading ? "Initializing..." : "Engage Ingestion"}
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {view === "fleet" && (
              <motion.div key="fleet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase">Fleet Status</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                      <select className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-4 py-1.5 text-[10px] font-black uppercase outline-none focus:border-blue-500 appearance-none">
                        <option>All Stacks</option>
                        <option>Production Only</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {repositories.map(repo => (
                    <RepoCardDetailed key={repo.id} repo={repo} onClick={() => setSelectedRepoId(repo.id)} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* --- Detail Overlay (Drawer) --- */}
      <AnimatePresence>
        {selectedRepoId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRepoId(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[#0a0d18] border-l border-slate-800 z-50 shadow-2xl overflow-y-auto custom-scrollbar"
            >
              {selectedRepo && (
                <div className="flex flex-col h-full">
                  <div className="p-8 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#0a0d18]/90 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <GitBranch className="text-blue-400" size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white truncate max-w-xs">{selectedRepo.url.split("/").pop()}</h2>
                        <p className="text-[10px] text-slate-500 font-mono italic">{selectedRepo.id}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedRepoId(null)} className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-8 space-y-12">
                    {/* Score Circle Section */}
                    <div className="flex items-center gap-12 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full" />
                      <div className="relative h-32 w-32 shrink-0">
                        <svg className="h-full w-full translate-x-1" viewBox="0 0 100 100">
                          <circle className="text-slate-800" strokeWidth="6" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                          <circle className="text-blue-500" strokeWidth="6" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * selectedRepo.overall_score) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-white">{selectedRepo.overall_score}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Pts</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getMaturityColor(selectedRepo.analysis_results?.maturity_label || "")}`}>
                          {selectedRepo.analysis_results?.maturity_label || "Unknown"} Grade
                        </span>
                        <h3 className="text-2xl font-black text-white">Engineering Maturity</h3>
                        <p className="text-xs text-slate-400 leading-relaxed italic">The score is calculated based on infrastructure, testing, and architectural modularity.</p>
                      </div>
                    </div>

                    {/* Stack & Critique */}
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <Layers size={14} className="text-blue-400" /> Technology Stack
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedRepo.analysis_results?.static_scan.stack.map(s => (
                            <span key={s} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-slate-300">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <Zap size={14} className="text-amber-400" /> Patterns Detected
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedRepo.analysis_results?.structural_evaluation.patterns_detected.map(p => (
                            <span key={p} className="px-3 py-1 bg-amber-500/5 border border-amber-500/10 rounded-lg text-xs font-bold text-amber-400">{p}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Sparkles size={14} className="text-purple-400" /> Architect Critique
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-slate-700 pl-4">
                        "{selectedRepo.analysis_results?.architectural_critique}"
                      </p>
                    </div>

                    {/* Security Section (NEW) */}
                    {selectedRepo.analysis_results?.security_findings && selectedRepo.analysis_results.security_findings.length > 0 && (
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
                          <AlertCircle size={14} /> Security vulnerabilities detected
                        </h4>
                        <div className="space-y-3">
                          {selectedRepo.analysis_results.security_findings.map((f, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-4">
                              <div className={`mt-1 shrink-0 h-2 w-2 rounded-full ${f.severity === 'CRITICAL' ? 'bg-rose-500 animate-ping' : 'bg-amber-500'}`} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-tighter">{f.type}</span>
                                  <span className="text-[10px] text-slate-600 font-mono">/ {f.file}</span>
                                </div>
                                <p className="text-xs font-bold text-white mb-1">{f.label}</p>
                                <p className="text-[10px] text-slate-400 italic leading-snug">{f.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Roadmap Section */}
                    {selectedRepo.analysis_results?.actionable_roadmap && selectedRepo.analysis_results.actionable_roadmap.length > 0 && (
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 border-b border-blue-500/20 pb-2">Actionable Roadmap</h4>
                        <div className="space-y-4">
                          {selectedRepo.analysis_results.actionable_roadmap.map((step, idx) => (
                            <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 border-l-4 border-l-blue-600">
                              <div className="flex items-center justify-between">
                                <h5 className="font-black text-white uppercase text-sm tracking-tighter">{step.title}</h5>
                                <span className="text-[10px] font-bold text-slate-600">PHASE {idx + 1}</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
                              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg flex gap-3">
                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                <p className="text-xs text-emerald-400 font-bold">{step.action}</p>
                              </div>
                              <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                <code className="text-[10px] text-blue-300 font-mono">{step.guide}</code>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-8 border-t border-slate-800 mt-auto bg-[#0a0d18]/90 backdrop-blur-md">
                    <button className="w-full py-4 bg-white text-black font-black uppercase text-sm rounded-2xl shadow-xl shadow-white/5 active:scale-95 transition-all">Download PDF Report</button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}

// --- Internal Components ---

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center lg:gap-4 p-3 rounded-2xl transition-all duration-300 relative group overflow-hidden ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-500 hover:text-white hover:bg-white/5"}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-[11px] font-black uppercase tracking-widest hidden lg:block relative z-10">{label}</span>
      {!active && <div className="absolute inset-0 bg-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 opacity-20 pointer-events-none" />}
    </button>
  );
}

function StatCard({ icon, label, value, detail }: { icon: React.ReactNode, label: string, value: string | number, detail: string }) {
  return (
    <div className="p-6 rounded-[2rem] bg-slate-900/40 border border-slate-800/50 hover:border-slate-700 transition-all group backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/50">{icon}</div>
        <div className="h-1.5 w-1.5 rounded-full bg-slate-700 group-hover:bg-blue-400 transition-colors" />
      </div>
      <div className="space-y-1">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</h4>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-[10px] text-slate-600 font-bold">{detail}</p>
      </div>
    </div>
  );
}

function RepoCardSmall({ repo, onClick }: { repo: Repository, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="p-5 rounded-3xl bg-black border border-slate-800/50 hover:border-blue-500/30 transition-all group cursor-pointer active:scale-95"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center border-2 border-[#05070a] shadow-lg ${repo.overall_score >= 66 ? "bg-emerald-500" : "bg-blue-500"}`}>
            <span className="text-[10px] font-black text-black">{repo.overall_score}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-white truncate max-w-[120px] uppercase tracking-tighter">{repo.url.split("/").pop()}</p>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-600 font-bold">{repo.analysis_results?.static_scan.stack?.[0] || "Analysis"}</span>
              <span className="h-1 w-1 bg-slate-800 rounded-full" />
              <span className="text-[9px] text-slate-700 underline">{repo.status}</span>
            </div>
          </div>
        </div>
        <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 size={12} className="text-slate-400" />
        </div>
      </div>
    </div>
  );
}

function RepoCardDetailed({ repo, onClick }: { repo: Repository, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group relative p-8 rounded-[3rem] bg-slate-900/30 border border-slate-800/50 hover:border-slate-700/50 flex flex-col gap-6 cursor-pointer active:scale-[0.98] transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center relative">
          <Terminal size={24} className="text-blue-400" />
          {repo.status === "completed" && (
            <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center border-4 border-[#05070a] z-10">
              {repo.overall_score}
            </div>
          )}
        </div>
        <div className="flex gap-1.5">
          {repo.analysis_results?.static_scan.standards.has_docker && <Container size={14} className="text-blue-500" />}
          {repo.analysis_results?.static_scan.testing.detected && <ShieldCheck size={14} className="text-emerald-500" />}
          {repo.analysis_results?.security_findings && repo.analysis_results.security_findings.length > 0 && (
            <AlertCircle size={14} className="text-rose-500 animate-pulse" />
          )}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-black text-white truncate uppercase tracking-tighter">{repo.url.split("/").pop()}</h3>
        <p className="text-[10px] text-slate-500 font-mono truncate">{repo.url.replace("https://", "")}</p>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-2">
        {repo.analysis_results?.static_scan.stack.slice(0, 3).map(s => (
          <span key={s} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-black uppercase text-slate-500">{s}</span>
        ))}
      </div>

      <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-800/50">
        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${getMaturityColor(repo.analysis_results?.maturity_label || "")}`}>
          {repo.analysis_results?.maturity_label || "Pending"}
        </span>
        <span className="text-[10px] font-black text-slate-700 uppercase">{repo.status}</span>
      </div>

      {/* Hover Glow */}
      <div className="absolute inset-x-12 bottom-0 h-1 bg-blue-600 blur-sm scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </div>
  );
}

// --- Utils ---

const getMaturityColor = (label: string) => {
  switch (label?.toLowerCase()) {
    case "enterprise": return "text-amber-400 border-amber-500/30 bg-amber-500/5";
    case "production": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/5";
    case "intermediate": return "text-blue-400 border-blue-500/30 bg-blue-500/5";
    case "basic": return "text-rose-400 border-rose-500/30 bg-rose-500/5";
    default: return "text-slate-400 border-slate-500/30 bg-slate-500/5";
  }
};
