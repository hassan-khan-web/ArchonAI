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
  Sparkles,
  GitCommit
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
    structured_critique?: {
      executive_summary: string;
      technical_debt: {
        area: string;
        issue: string;
        impact: string;
      }[];
      architect_persona: string;
    };
    ai_analysis?: {
      executive_summary: string;
      technical_debt: {
        area: string;
        issue: string;
        impact: string;
      }[];
      architectural_pivot: {
        title: string;
        description: string;
        impact: string;
      };
      persona: string;
      error?: string;
    };
  };
  overall_score: number;
  created_at: string;
  logs?: string[];
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

  // Auto-select first repo if none selected
  useEffect(() => {
    if (repositories.length > 0 && !selectedRepoId) {
      setSelectedRepoId(repositories[0].id);
    }
  }, [repositories, selectedRepoId]);

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
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/10 blur-[120px] rounded-full" />
      </div>

      {/* --- Sidebar --- */}
      <aside className="w-20 lg:w-64 flex flex-col border-r border-slate-800/50 bg-[#070912]/80 backdrop-blur-xl z-20 transition-all">
        <div className="p-6 mb-8 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/40 shrink-0">
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
              <input type="text" placeholder="Search projects..." className="bg-slate-900/50 border border-slate-800 rounded-xl px-10 py-2 text-xs outline-none focus:border-emerald-500/50 transition-colors w-64" />
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
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 flex flex-col min-h-0 space-y-6">
                {/* Stats Ribbon */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                  <StatCard icon={<Layers className="text-emerald-400" />} label="Monitored Repos" value={stats.total} detail="+2 this week" />
                  <StatCard icon={<Cpu className="text-teal-400" />} label="Analysis Mean" value={`${stats.avgScore}%`} detail="Health Index" />
                  <StatCard icon={<ShieldCheck className="text-emerald-400" />} label="Production Ready" value={stats.productionGrade} detail="Maturity Alpha" />
                  <StatCard
                    icon={<AlertCircle className={stats.totalThreats > 0 ? "text-rose-400 animate-pulse" : "text-slate-400"} />}
                    label="Active Threats"
                    value={stats.totalThreats}
                    detail={stats.totalThreats > 0 ? "Action Required" : "Nodes Secured"}
                  />
                </div>

                {/* Ingestion Section (NEW Placement) */}
                <div className="p-5 rounded-[2rem] bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm flex items-center justify-between gap-8 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                      <Zap className="text-emerald-400" size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-tighter">Analysis Control</h3>
                      <p className="text-[10px] text-slate-500 font-bold">Deploy new neural auditing cluster</p>
                    </div>
                  </div>
                  <form onSubmit={handleSubmit} className="flex gap-3 max-w-md w-full">
                    <input
                      type="url"
                      placeholder="Enter Repository URL..."
                      className="flex-1 bg-black/40 border border-slate-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-emerald-500 transition-all font-medium text-white"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitLoading}
                      className="px-6 py-2 bg-emerald-600 rounded-xl text-[10px] font-black uppercase text-white hover:bg-emerald-500 transition-all disabled:opacity-50"
                    >
                      {isSubmitLoading ? "Processing..." : "Engage"}
                    </button>
                  </form>
                </div>

                {/* Main Two-Pane Section */}
                <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                  {/* Left Pane: Results (Swapped) */}
                  <div className="flex-1 bg-slate-900/10 rounded-[2.5rem] border border-slate-800/50 flex flex-col overflow-hidden relative">
                    <AnimatePresence mode="wait">
                      {selectedRepo ? (
                        <motion.div
                          key={selectedRepo.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6"
                        >
                          {/* Analysis Content Pulled From Former Drawer */}
                          <div className="space-y-8">
                            <div className="flex items-center justify-between sticky top-0 bg-slate-900/0 backdrop-blur-md z-10 py-2">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                  <GitBranch className="text-emerald-400" size={20} />
                                </div>
                                <div>
                                  <h2 className="text-lg font-black text-white truncate max-w-xs">{selectedRepo.url.split("/").pop()}</h2>
                                  <p className="text-[8px] text-slate-600 font-mono tracking-widest">{selectedRepo.id}</p>
                                </div>
                              </div>
                            </div>

                            {/* Score & Grade */}
                            <div className="flex items-center gap-8 bg-white/5 p-6 rounded-[2rem] border border-white/10 relative overflow-hidden shrink-0">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 blur-3xl rounded-full" />
                              <div className="relative h-24 w-24 shrink-0">
                                <svg className="h-full w-full" viewBox="0 0 100 100">
                                  <circle className="text-slate-800" strokeWidth="6" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                                  <circle className="text-emerald-500" strokeWidth="6" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * selectedRepo.overall_score) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-2xl font-black text-white">{selectedRepo.overall_score}</span>
                                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Pts</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${getMaturityColor(selectedRepo.analysis_results?.maturity_label || "")}`}>
                                  {selectedRepo.analysis_results?.maturity_label || "Unknown"} Grade
                                </span>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Engineering Maturity</h3>
                                <p className="text-[10px] text-slate-500 leading-relaxed italic">The score reflects neural weighting across infrastructure, parity, and security layers.</p>
                              </div>
                            </div>

                            {/* AI Architect Review */}
                            {selectedRepo.analysis_results?.ai_analysis && !selectedRepo.analysis_results.ai_analysis.error && (
                              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-400/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                  <Cpu size={100} className="text-emerald-500" />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                                  <Sparkles size={14} className="animate-pulse" /> AI Architect Deep Review
                                </h4>
                                <p className="text-sm text-white leading-relaxed font-medium mb-4 relative z-10">
                                  {selectedRepo.analysis_results.ai_analysis.executive_summary}
                                </p>

                                {selectedRepo.analysis_results.ai_analysis.architectural_pivot && (
                                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 space-y-1 mb-4 relative z-10">
                                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                      <RefreshCw size={12} />
                                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">Suggested Action</span>
                                    </div>
                                    <h5 className="text-xs font-black text-white uppercase">{selectedRepo.analysis_results.ai_analysis.architectural_pivot.title}</h5>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">{selectedRepo.analysis_results.ai_analysis.architectural_pivot.description}</p>
                                  </div>
                                )}

                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] text-slate-500 uppercase tracking-widest">Model:</span>
                                  <span className="text-[8px] font-black text-white uppercase bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                                    Groq/Llama-3.3-70B
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Technical Debt & Security */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                              {/* Technical Debt */}
                              {selectedRepo.analysis_results?.structured_critique?.technical_debt && (
                                <div className="space-y-4">
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                                    <Activity size={14} /> Neural Debt Audit
                                  </h4>
                                  <div className="space-y-2">
                                    {selectedRepo.analysis_results.structured_critique.technical_debt.slice(0, 3).map((d, idx) => (
                                      <div key={idx} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start gap-3">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[7px] font-black text-amber-500 uppercase px-1 rounded bg-amber-500/10">
                                              {d.area}
                                            </span>
                                            <span className="text-[9px] font-bold text-white uppercase truncate">{d.issue}</span>
                                          </div>
                                          <p className="text-[9px] text-slate-600 leading-snug line-clamp-1">{d.impact}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Roadmap Steps */}
                              {selectedRepo.analysis_results?.actionable_roadmap && (
                                <div className="space-y-4">
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                                    <GitCommit size={14} /> Engineering Roadmap
                                  </h4>
                                  <div className="space-y-2">
                                    {selectedRepo.analysis_results.actionable_roadmap.slice(0, 2).map((step, idx) => (
                                      <div key={idx} className="p-3 rounded-xl bg-emerald-600/5 border border-emerald-500/20 space-y-2">
                                        <h5 className="text-[9px] font-black text-white uppercase">{step.title}</h5>
                                        <div className="flex gap-2 items-center">
                                          <div className="h-1 w-1 bg-emerald-400 rounded-full" />
                                          <p className="text-[9px] text-emerald-400 font-bold">{step.action}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                          <div className="h-16 w-16 rounded-2.5xl bg-slate-800/30 border border-slate-700/50 flex items-center justify-center mb-6">
                            <Cpu size={32} className="text-slate-600 animate-pulse" />
                          </div>
                          <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-2">Initialize Architecture visualization</h3>
                          <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">Select a repository from your fleet to monitor the neural architecture, security vectors, and AI-driven pivots in real-time.</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Right Pane: Repo List (Swapped) */}
                  <div className="w-80 flex flex-col gap-4 overflow-y-auto custom-scrollbar pl-2 shrink-0">
                    <div className="flex items-center justify-between mb-1 px-2">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-full">Neural Fleet</h4>
                      <span className="hidden text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{repositories.length} Nodes</span>
                    </div>
                    <div className="space-y-3">
                      {repositories.map(repo => (
                        <RepoCardSmall
                          key={repo.id}
                          repo={repo}
                          active={selectedRepoId === repo.id}
                          onClick={() => setSelectedRepoId(repo.id)}
                        />
                      ))}
                    </div>
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
                      <select className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-4 py-1.5 text-[10px] font-black uppercase outline-none focus:border-emerald-500 appearance-none">
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

      {/* Drawer Removed: Moved to Result Panel */}

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
      className={`w-full flex items-center lg:gap-4 p-3 rounded-2xl transition-all duration-300 relative group overflow-hidden ${active ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "text-slate-500 hover:text-white hover:bg-white/5"}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-[11px] font-black uppercase tracking-widest hidden lg:block relative z-10">{label}</span>
      {!active && <div className="absolute inset-0 bg-emerald-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 opacity-20 pointer-events-none" />}
    </button>
  );
}

function StatCard({ icon, label, value, detail }: { icon: React.ReactNode, label: string, value: string | number, detail: string }) {
  return (
    <div className="p-6 rounded-[2rem] bg-slate-900/40 border border-slate-800/50 hover:border-slate-700 transition-all group backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/50">{icon}</div>
        <div className="h-1.5 w-1.5 rounded-full bg-slate-700 group-hover:bg-emerald-400 transition-colors" />
      </div>
      <div className="space-y-1">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</h4>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-[10px] text-slate-600 font-bold">{detail}</p>
      </div>
    </div>
  );
}

function RepoCardSmall({ repo, active, onClick }: { repo: Repository, active?: boolean, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border transition-all group cursor-pointer active:scale-95 ${active
        ? "bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-900/20"
        : "bg-slate-900/30 border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/50 shadow-sm"
        }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center border-2 border-[#05070a] shadow-lg ${active ? "bg-white text-emerald-600" : (repo.overall_score >= 66 ? "bg-emerald-500 text-black" : "bg-teal-500 text-black")
            }`}>
            <span className="text-[10px] font-black">{repo.overall_score}</span>
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-black truncate max-w-[140px] uppercase tracking-tighter ${active ? "text-white" : "text-white/80 group-hover:text-white"}`}>
              {repo.url.split("/").pop()}
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold ${active ? "text-emerald-200" : "text-slate-600"}`}>
                {repo.analysis_results?.static_scan.stack?.[0] || "Analysis"}
              </span>
              <span className={`h-1 w-1 rounded-full ${active ? "bg-emerald-400" : "bg-slate-800"}`} />
              <span className={`text-[9px] font-bold ${active ? "text-emerald-100" : "text-slate-500"} underline decoration-dotted`}>
                {repo.status}
              </span>
            </div>
          </div>
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
          <Terminal size={24} className="text-emerald-400" />
          {repo.status === "completed" && (
            <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center border-4 border-[#05070a] z-10">
              {repo.overall_score}
            </div>
          )}
        </div>
        <div className="flex gap-1.5">
          {repo.analysis_results?.static_scan.standards.has_docker && <Container size={14} className="text-emerald-500" />}
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
      <div className="absolute inset-x-12 bottom-0 h-1 bg-emerald-600 blur-sm scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </div>
  );
}

// --- Utils ---

const getMaturityColor = (label: string) => {
  switch (label?.toLowerCase()) {
    case "enterprise": return "text-amber-400 border-amber-500/30 bg-amber-500/5";
    case "production": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/5";
    case "intermediate": return "text-teal-400 border-teal-500/30 bg-teal-500/5";
    case "basic": return "text-rose-400 border-rose-500/30 bg-rose-500/5";
    default: return "text-slate-400 border-slate-500/30 bg-slate-500/5";
  }
};
