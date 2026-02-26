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
      payload?: any;
    };
    categories?: Record<string, string[]>;
    dependency_graph?: {
      nodes: { id: number; name: string; path: string; type: string }[];
      links: { source: number; target: number }[];
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
  const [ingestionMode, setIngestionMode] = useState<"url" | "github" | "upload">("url");
  const [githubUser, setGithubUser] = useState("");
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"review" | "tech" | "debt" | "graph">("review");
  const [submissionError, setSubmissionError] = useState<string | null>(null);

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
    if (!repoUrl) return;
    setIsSubmitLoading(true);
    setSubmissionError(null);
    try {
      const res = await fetch(`${apiUrl}/api/v1/repositories/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl }),
      });
      if (res.ok) {
        setRepoUrl("");
        fetchRepositories();
      } else {
        const err = await res.json();
        setSubmissionError(err.detail || "Failed to engage neural scanner");
      }
    } catch (e) {
      setSubmissionError("Backend neuro-link failure. Check connection.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const fetchGithubRepos = async () => {
    if (!githubUser) return;
    setIsGithubLoading(true);
    setSubmissionError(null);
    try {
      const res = await fetch(`${apiUrl}/api/v1/github/repos/${githubUser}`);
      if (res.ok) {
        const data = await res.json();
        setGithubRepos(data);
      } else if (res.status === 404) {
        setSubmissionError("GitHub identity not found in public archives");
        setGithubRepos([]);
      } else {
        setSubmissionError("Quantum glitch in GitHub API link");
      }
    } catch (e) {
      setSubmissionError("Failed to reach GitHub neural gateway");
    } finally {
      setIsGithubLoading(false);
    }
  };

  const handleGithubEngage = async (url: string) => {
    setIsSubmitLoading(true);
    setSubmissionError(null);
    try {
      const res = await fetch(`${apiUrl}/api/v1/repositories/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        fetchRepositories();
      } else {
        setSubmissionError("Deployment sequence interrupted");
      }
    } catch (e) {
      setSubmissionError("Engagement failed: Network unstable");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setIsSubmitLoading(true);
    setSubmissionError(null);
    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      const res = await fetch(`${apiUrl}/api/v1/repositories/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setUploadFile(null);
        fetchRepositories();
      } else {
        const err = await res.json();
        setSubmissionError(err.detail || "Neural upload rejected: Format invalid");
      }
    } catch (e) {
      setSubmissionError("Bio-metric upload failed. Neural link severed.");
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
            <h1 className="text-xl font-black tracking-tighter text-white uppercase">Archon</h1>
            <span className="text-xs text-slate-500 font-mono tracking-widest uppercase">Intel Core v2</span>
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
            <span className="text-sm font-black uppercase tracking-widest hidden lg:block">
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
            <span className="text-base font-medium text-slate-500 capitalize">{view}</span>
            <ChevronRight size={16} className="text-slate-700" />
            <span className="text-base font-bold text-white uppercase tracking-widest">Main Canvas</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input type="text" placeholder="Search projects..." className="bg-slate-900/50 border border-slate-800 rounded-xl px-10 py-2 text-sm outline-none focus:border-emerald-500/50 transition-colors w-64" />
            </div>
            <button className="h-10 px-4 bg-white text-black font-black text-sm uppercase rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 flex items-center gap-2">
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
                <div className="p-8 rounded-[2.5rem] bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm space-y-6 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                        <Zap className="text-emerald-400" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Analysis Control</h3>
                        <p className="text-sm text-slate-500 font-bold">Deploy new neural auditing cluster</p>
                      </div>
                    </div>
                    <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
                      {(["url", "github", "upload"] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setIngestionMode(mode)}
                          className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${ingestionMode === mode ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40" : "text-slate-500 hover:text-slate-300"}`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-4">
                    {submissionError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3"
                      >
                        <AlertCircle size={14} className="text-rose-400" />
                        <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">{submissionError}</span>
                      </motion.div>
                    )}

                    {ingestionMode === "url" && (
                      <form onSubmit={handleSubmit} className="flex gap-4">
                        <input
                          type="url"
                          placeholder="Paste Repository URL (https://github.com/...)"
                          className="flex-1 bg-black/60 border border-slate-800 rounded-xl px-5 py-3 text-sm outline-none focus:border-emerald-500 transition-all font-medium text-white"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          required
                        />
                        <button
                          type="submit"
                          disabled={isSubmitLoading}
                          className="px-10 bg-emerald-600 rounded-xl text-sm font-black uppercase text-white hover:bg-emerald-500 transition-all disabled:opacity-50"
                        >
                          {isSubmitLoading ? "Engaging..." : "Scan Repository"}
                        </button>
                      </form>
                    )}

                    {ingestionMode === "github" && (
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">github.com/</span>
                            <input
                              type="text"
                              placeholder="username"
                              className="w-full bg-black/60 border border-slate-800 rounded-xl pl-28 pr-5 py-3 text-sm outline-none focus:border-emerald-500 transition-all font-medium text-white"
                              value={githubUser}
                              onChange={(e) => setGithubUser(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && fetchGithubRepos()}
                            />
                          </div>
                          <button
                            onClick={fetchGithubRepos}
                            disabled={isGithubLoading}
                            className="px-10 bg-emerald-600 rounded-xl text-sm font-black uppercase text-white hover:bg-emerald-500 transition-all"
                          >
                            {isGithubLoading ? "Fetching..." : "Connect"}
                          </button>
                        </div>
                        {githubRepos.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {githubRepos.map(repo => (
                              <div key={repo.full_name} className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
                                <div>
                                  <h4 className="text-sm font-black text-white truncate">{repo.name}</h4>
                                  <p className="text-[10px] text-slate-500 line-clamp-1">{repo.description || "No description"}</p>
                                </div>
                                <button
                                  onClick={() => handleGithubEngage(repo.html_url)}
                                  className="mt-3 w-full py-1.5 bg-emerald-600/10 border border-emerald-500/20 text-[10px] font-black uppercase text-emerald-400 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all"
                                >
                                  Engage
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {ingestionMode === "upload" && (
                      <form onSubmit={handleUpload} className="flex gap-4">
                        <div className="flex-1 relative">
                          <input
                            type="file"
                            accept=".zip"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          />
                          <div className="h-full bg-black/60 border border-dashed border-slate-800 rounded-xl px-5 py-3 flex items-center justify-between transition-all group-hover:border-emerald-500/50">
                            <span className="text-sm text-slate-400">
                              {uploadFile ? uploadFile.name : "Select or drag architecture ZIP file..."}
                            </span>
                            <PlusCircle size={18} className="text-slate-600" />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={!uploadFile || isSubmitLoading}
                          className="px-10 bg-emerald-600 rounded-xl text-sm font-black uppercase text-white hover:bg-emerald-500 transition-all disabled:opacity-30"
                        >
                          {isSubmitLoading ? "Engaging..." : "Upload & Scan"}
                        </button>
                      </form>
                    )}
                  </div>
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
                              <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                                {(["review", "tech", "debt", "graph"] as const).map(t => (
                                  <button
                                    key={t}
                                    onClick={() => setActiveTab(t)}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40" : "text-slate-500 hover:text-slate-300"}`}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Tab Content Panels */}
                            <div className="flex-1 min-h-0">
                              <AnimatePresence mode="wait">
                                {activeTab === "review" && (
                                  <motion.div
                                    key="review"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-8"
                                  >
                                    <div className="flex items-center gap-8 bg-white/5 p-6 rounded-[2rem] border border-white/10 relative overflow-hidden shrink-0">
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 blur-3xl rounded-full" />
                                      <div className="relative h-24 w-24 shrink-0">
                                        <svg className="h-full w-full" viewBox="0 0 100 100">
                                          <circle className="text-slate-800" strokeWidth="6" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                                          <circle className="text-emerald-500" strokeWidth="6" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * selectedRepo.overall_score) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                          <span className="text-3xl font-black text-white">{selectedRepo.overall_score}</span>
                                          <span className="text-sm font-black uppercase tracking-widest text-slate-500">Pts</span>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-black uppercase border ${getMaturityColor(selectedRepo.analysis_results?.maturity_label || "")}`}>
                                          {selectedRepo.analysis_results?.maturity_label || "Unknown"} Grade
                                        </span>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Engineering Maturity</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed italic">The score reflects neural weighting across infrastructure, parity, and security layers.</p>
                                      </div>
                                    </div>

                                    {selectedRepo.analysis_results?.ai_analysis && !selectedRepo.analysis_results.ai_analysis.error && (
                                      <div className="p-6 rounded-[2rem] bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-400/20 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                          <Cpu size={100} className="text-emerald-500" />
                                        </div>
                                        <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                                          <Sparkles size={16} className="animate-pulse" /> AI Architect Deep Review
                                        </h4>
                                        <div className="text-base text-white/90 leading-relaxed font-medium mb-6 relative z-10 space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                                          {(typeof selectedRepo.analysis_results.ai_analysis.executive_summary === 'string'
                                            ? selectedRepo.analysis_results.ai_analysis.executive_summary.split('\n\n')
                                            : Object.values(selectedRepo.analysis_results.ai_analysis.executive_summary)
                                          ).map((para, i) => (
                                            <p key={i}>{para as string}</p>
                                          ))}
                                        </div>

                                        {selectedRepo.analysis_results.ai_analysis.architectural_pivot && (
                                          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 space-y-2 mb-4 relative z-10">
                                            <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                              <RefreshCw size={16} />
                                              <span className="text-sm font-black uppercase tracking-wider text-emerald-300">Suggested Action</span>
                                            </div>
                                            <h5 className="text-lg font-black text-white uppercase">{selectedRepo.analysis_results.ai_analysis.architectural_pivot.title}</h5>
                                            <div className="text-base text-slate-400 leading-relaxed space-y-2">
                                              {(typeof selectedRepo.analysis_results.ai_analysis.architectural_pivot.description === 'string'
                                                ? selectedRepo.analysis_results.ai_analysis.architectural_pivot.description.split('\n\n')
                                                : Object.values(selectedRepo.analysis_results.ai_analysis.architectural_pivot.description)
                                              ).map((p, i) => (
                                                <p key={i}>{p as string}</p>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-slate-500 uppercase tracking-widest">Model:</span>
                                          <span className="text-xs font-black text-white uppercase bg-white/5 px-3 py-1 rounded-md border border-white/10">
                                            Groq/Llama-3.3-70B
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Roadmap Steps */}
                                    {selectedRepo.analysis_results?.actionable_roadmap && (
                                      <div className="space-y-4 pb-12">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                                          <GitCommit size={16} /> Engineering Roadmap
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {selectedRepo.analysis_results.actionable_roadmap.slice(0, 4).map((step, idx) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-emerald-600/5 border border-emerald-500/20 space-y-2">
                                              <h5 className="text-sm font-black text-white uppercase">{step.title}</h5>
                                              <div className="flex gap-2 items-center">
                                                <div className="h-1 w-1 bg-emerald-400 rounded-full" />
                                                <p className="text-sm text-emerald-400 font-bold">{step.action}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                )}

                                {activeTab === "tech" && (
                                  <motion.div
                                    key="tech"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                  >
                                    {selectedRepo.analysis_results?.categories && (
                                      <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/20 space-y-6">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                          <Layers size={16} /> Comprehensive Tech Stack Breakdown
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                          {Object.entries(selectedRepo.analysis_results.categories).map(([category, techs]) => (
                                            (techs as string[]).length > 0 && (
                                              <div key={category} className="p-5 rounded-2xl bg-black/20 border border-white/5 space-y-4 hover:border-emerald-500/30 transition-all">
                                                <div className="flex items-center justify-between">
                                                  <h5 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{category}</h5>
                                                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                  {(techs as string[]).map(tech => (
                                                    <span key={tech} className="px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs font-black text-emerald-400 uppercase tracking-tight">
                                                      {tech}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                )}

                                {activeTab === "debt" && (
                                  <motion.div
                                    key="debt"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                  >
                                    {selectedRepo.analysis_results?.ai_analysis?.technical_debt && (
                                      <div className="space-y-4">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                                          <Activity size={16} /> Neural Debt Audit
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                          {selectedRepo.analysis_results.ai_analysis.technical_debt.map((d: any, idx: number) => (
                                            <div key={idx} className="p-6 rounded-[1.5rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-6 group hover:border-amber-500/40 transition-all">
                                              <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                                <AlertCircle size={20} className="text-amber-400" />
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                  <span className="text-[10px] font-black text-amber-500 uppercase px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 tracking-widest">
                                                    {d.area}
                                                  </span>
                                                </div>
                                                <h5 className="text-lg font-black text-white uppercase mb-1">{d.issue}</h5>
                                                <p className="text-sm text-slate-500 leading-relaxed font-medium">{d.impact}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                )}

                                {activeTab === "graph" && (
                                  <motion.div
                                    key="graph"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="h-full min-h-[500px] w-full bg-slate-900/40 rounded-[2.5rem] border border-white/5 relative overflow-hidden p-8"
                                  >
                                    <h4 className="text-sm font-black uppercase tracking-widest text-emerald-500 mb-8 flex items-center gap-2 leading-none">
                                      <Maximize2 size={16} /> Architectural Dependency Graph
                                    </h4>

                                    <div className="relative h-[400px] w-full flex items-center justify-center">
                                      {(selectedRepo.analysis_results as any)?.dependency_graph?.nodes?.length > 0 ? (
                                        <div className="relative w-full h-full">
                                          {/* Connecting Lines */}
                                          <svg className="absolute inset-0 pointer-events-none opacity-30 h-full w-full">
                                            {(selectedRepo.analysis_results as any).dependency_graph.links.slice(0, 30).map((link: any, i: number) => {
                                              const sourceNode = (selectedRepo.analysis_results as any).dependency_graph.nodes.find((n: any) => n.id === link.source);
                                              const targetNode = (selectedRepo.analysis_results as any).dependency_graph.nodes.find((n: any) => n.id === link.target);
                                              if (!sourceNode || !targetNode) return null;

                                              // High-energy pseudo-random positions for visualization
                                              const x1 = 15 + (link.source * 13) % 70;
                                              const y1 = 15 + (link.source * 17) % 70;
                                              const x2 = 15 + (link.target * 19) % 70;
                                              const y2 = 15 + (link.target * 23) % 70;

                                              return (
                                                <line
                                                  key={i}
                                                  x1={`${x1}%`} y1={`${y1}%`}
                                                  x2={`${x2}%`} y2={`${y2}%`}
                                                  stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" strokeDasharray="4 2"
                                                />
                                              );
                                            })}
                                          </svg>

                                          {/* Node Points */}
                                          <div className="absolute inset-0">
                                            {(selectedRepo.analysis_results as any).dependency_graph.nodes.slice(0, 20).map((node: any, i: number) => (
                                              <motion.div
                                                key={node.id}
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.02 }}
                                                style={{
                                                  left: `${15 + (node.id * 13) % 70}%`,
                                                  top: `${15 + (node.id * 17) % 70}%`
                                                }}
                                                className="absolute -translate-x-1/2 -translate-y-1/2 p-3 bg-slate-800/80 border border-emerald-500/20 rounded-xl backdrop-blur-md hover:border-emerald-400 group cursor-pointer transition-all z-20"
                                              >
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mb-1 group-hover:scale-150 transition-transform" />
                                                <p className="text-[10px] font-black text-white hover:text-emerald-400 transition-colors truncate max-w-[100px]">{node.name}</p>
                                                <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-black/90 p-2 rounded-lg border border-white/10 z-50 whitespace-nowrap">
                                                  <p className="text-[8px] text-slate-500 font-mono italic">{node.path}</p>
                                                </div>
                                              </motion.div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-center opacity-20">
                                          <Cpu size={64} className="mb-4 animate-pulse" />
                                          <p className="text-sm font-black uppercase tracking-widest leading-none">Architectural Matrix Offline</p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between border-t border-white/5 pt-4">
                                      <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Node</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded-full bg-white/10 border border-emerald-500/20" />
                                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dependency Vector</span>
                                        </div>
                                      </div>
                                      <p className="text-[10px] font-bold text-slate-600 italic">Neural Engine: V1 Architecture Mapper</p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                          <div className="h-16 w-16 rounded-2.5xl bg-slate-800/30 border border-slate-700/50 flex items-center justify-center mb-6">
                            <Cpu size={32} className="text-slate-600 animate-pulse" />
                          </div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Initialize Architecture visualization</h3>
                          <p className="text-sm text-slate-500 max-w-xs leading-relaxed">Select a repository from your fleet to monitor the neural architecture, security vectors, and AI-driven pivots in real-time.</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Right Pane: Repo List (Swapped) */}
                  <div className="w-80 flex flex-col gap-4 overflow-y-auto custom-scrollbar pl-2 shrink-0">
                    <div className="flex items-center justify-between mb-1 px-2">
                      <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest text-right w-full">Neural Fleet</h4>
                      <span className="hidden text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{repositories.length} Nodes</span>
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
                      <select className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-4 py-1.5 text-xs font-black uppercase outline-none focus:border-emerald-500 appearance-none">
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
      <span className="text-sm font-black uppercase tracking-widest hidden lg:block relative z-10">{label}</span>
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
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</h4>
        <p className="text-3xl font-black text-white">{value}</p>
        <p className="text-xs text-slate-600 font-bold">{detail}</p>
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
            <span className="text-xs font-black">{repo.overall_score}</span>
          </div>
          <div className="min-w-0">
            <p className={`text-base font-black truncate max-w-[140px] uppercase tracking-tighter ${active ? "text-white" : "text-white/80 group-hover:text-white"}`}>
              {repo.url.split("/").pop()}
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${active ? "text-emerald-200" : "text-slate-600"}`}>
                {repo.analysis_results?.static_scan.stack?.[0] || "Analysis"}
              </span>
              <span className={`h-1 w-1 rounded-full ${active ? "bg-emerald-400" : "bg-slate-800"}`} />
              <span className={`text-sm font-bold ${active ? "text-emerald-100" : "text-slate-500"} underline decoration-dotted`}>
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
          <span key={s} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-sm font-black uppercase text-slate-400">{s}</span>
        ))}
      </div>

      <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-800/50">
        <span className={`px-2 py-0.5 rounded text-xs font-black uppercase tracking-tighter border ${getMaturityColor(repo.analysis_results?.maturity_label || "")}`}>
          {repo.analysis_results?.maturity_label || "Pending"}
        </span>
        <span className="text-sm font-black text-slate-700 uppercase">{repo.status}</span>
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
