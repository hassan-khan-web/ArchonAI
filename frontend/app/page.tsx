"use client";

import { useEffect, useState, useCallback } from "react";

interface Repository {
  id: string;
  url: string;
  name: string | null;
  status: "pending" | "cloning" | "completed" | "failed";
  local_path: string | null;
  analysis_results?: {
    static_scan: {
      stack: string[];
      standards: {
        has_readme: boolean;
        has_gitignore: boolean;
        has_docker: boolean;
        has_ci_cd: boolean;
      };
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
  };
  overall_score: number;
  created_at: string;
}

export default function Home() {
  // --- Connectivity State & Diagnostics ---
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [backendMessage, setBackendMessage] = useState("");
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
  const [isUrlOverridden, setIsUrlOverridden] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [new Date().toLocaleTimeString() + ": " + msg, ...prev].slice(0, 5));
  }, []);

  // --- App State ---
  const [repoUrl, setRepoUrl] = useState("");
  const [submitStatus, setSubmitStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; message: string }>({ type: "idle", message: "" });
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkConnectivity = useCallback(async (testUrl: string) => {
    setBackendStatus("checking");
    addLog(`Testing connection to ${testUrl}...`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const res = await fetch(`${testUrl}/`, {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setBackendStatus("connected");
        setBackendMessage(data.message || "Deep Link Established");
        addLog("✅ Success: Backend reached cleanly.");
        return true;
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.name === "AbortError" ? "Request timed out" : "Network reachability failure"}`);
      setBackendStatus("disconnected");
      setBackendMessage("Connection Refused");
    }
    return false;
  }, [addLog]);

  const fetchRepositories = useCallback(async (targetUrl: string) => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${targetUrl}/api/v1/repositories/`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRepositories(data);
        if (backendStatus !== "connected") {
          setBackendStatus("connected");
          setBackendMessage("Sync Established");
        }
      }
    } catch (error) {
      console.error("Failed to fetch repositories:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [backendStatus]);

  useEffect(() => {
    checkConnectivity(apiUrl);
    fetchRepositories(apiUrl);

    const interval = setInterval(() => {
      fetchRepositories(apiUrl);
    }, 5000);

    return () => clearInterval(interval);
  }, [apiUrl, checkConnectivity, fetchRepositories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus({ type: "loading", message: "Initialing project ingestion..." });
    try {
      const res = await fetch(`${apiUrl}/api/v1/repositories/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl }),
      });
      if (res.ok) {
        setSubmitStatus({ type: "success", message: "Vault ingestion protocol started successfully." });
        setRepoUrl("");
        fetchRepositories(apiUrl);
      } else {
        const errorData = await res.json();
        setSubmitStatus({ type: "error", message: `Protocol Error: ${errorData.detail || "Access Denied"}` });
      }
    } catch (error) {
      setSubmitStatus({ type: "error", message: "Critical: Backend communication failed." });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "cloning": return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "pending": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "failed": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getMaturityColor = (label: string) => {
    switch (label?.toLowerCase()) {
      case "enterprise": return "text-amber-400 border-amber-500/30 bg-amber-500/5";
      case "production": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/5";
      case "intermediate": return "text-blue-400 border-blue-500/30 bg-blue-500/5";
      case "basic": return "text-rose-400 border-rose-500/30 bg-rose-500/5";
      default: return "text-slate-400 border-slate-500/30 bg-slate-500/5";
    }
  };

  return (
    <div className="min-h-screen bg-[#070A14] text-slate-200 selection:bg-sky-500/30 font-sans selection:text-white overflow-x-hidden">
      {/* Mesh Background Effects */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[50%] bg-purple-600 blur-[150px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-20 flex flex-col gap-12 lg:gap-20">

        {/* Navigation Bar */}
        <nav className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-blue-900/40">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white uppercase">ArchonAI</h2>
              <span className="text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase">Ingestion Core v1.0</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <div className={`group flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-500 bg-slate-900/50 backdrop-blur-md ${backendStatus === "connected" ? "border-emerald-500/20" :
              backendStatus === "checking" ? "border-amber-500/20" : "border-rose-500/20"
              }`}>
              <div className={`h-2 w-2 rounded-full shadow-[0_0_8px] ${backendStatus === "connected" ? "bg-emerald-400 shadow-emerald-400" :
                backendStatus === "checking" ? "bg-amber-400 shadow-amber-400 animate-bounce" : "bg-rose-400 shadow-rose-400 shadow-rose-500/50"
                }`} />
              <div className="flex flex-col">
                <span className={`text-[10px] uppercase font-black tracking-widest ${backendStatus === "connected" ? "text-emerald-400" :
                  backendStatus === "checking" ? "text-amber-400" : "text-rose-400"
                  }`}>
                  {backendStatus === "connected" ? "Link Primary" : backendStatus === "checking" ? "Syncing..." : "Link Severed"}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">{apiUrl.replace("http://", "")}</span>
              </div>
              <button
                onClick={() => setIsUrlOverridden(!isUrlOverridden)}
                className="ml-2 p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-600 hover:text-white"
                title="Toggle Diagnostics"
              >
                <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
              </button>
            </div>

            {isUrlOverridden && (
              <div className="absolute top-24 right-6 z-50 w-80 flex flex-col gap-3 p-5 bg-slate-900 border border-slate-700 backdrop-blur-2xl rounded-[1.5rem] shadow-3xl animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Network Diagnostic</p>
                  <button onClick={() => setLogs([])} className="text-[10px] text-blue-500 hover:underline">Clear</button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="flex-1 bg-black border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono outline-none focus:border-blue-500"
                  />
                  <button onClick={() => checkConnectivity(apiUrl)} className="px-4 py-2 bg-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-colors">Retest</button>
                </div>
                <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-[10px] font-mono text-slate-600 italic">Listening for events...</p>
                  ) : (
                    logs.map((log, i) => (
                      <p key={i} className="text-[10px] font-mono text-slate-500 leading-relaxed border-l border-slate-800 pl-3">{log}</p>
                    ))
                  )}
                </div>
                <div className="pt-2 border-t border-slate-800 text-[9px] text-slate-600">
                  Tip: If disconnected, try 127.0.0.1:8000 instead of localhost:8000.
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Branding */}
        <section className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8 mt-10">
          <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] animate-in slide-in-from-bottom-2">
            Engineering Maturity Engine
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white leading-[1.0] tracking-tighter">
            Architect the <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">Unstoppable.</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl font-medium">
            Analyze, evaluate, and upgrade your software repositories with the world's most intelligent architecture auditing platform.
          </p>
        </section>

        {/* Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-10">

          {/* Form Card */}
          <div className="lg:col-span-5 flex flex-col gap-10 p-10 bg-gradient-to-b from-slate-900/60 to-slate-900/20 border border-slate-800/50 backdrop-blur-2xl rounded-[3rem] shadow-2xl group transition-all duration-500 hover:border-slate-700/50">
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-white tracking-tight">Initiate Scan</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Submit your GitHub repository URL for deep architectural analysis.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="relative group">
                <input
                  type="url"
                  placeholder="https://github.com/namespace/project"
                  className="w-full px-6 py-6 rounded-[1.5rem] bg-black border border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-slate-700 text-sm font-medium pr-16"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  required
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-500 opacity-50">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitStatus.type === "loading"}
                className="relative overflow-hidden group w-full bg-white text-black font-black py-6 rounded-[1.5rem] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <span className="relative z-10">{submitStatus.type === "loading" ? "Processing Signal..." : "Deploy Scanner"}</span>
                <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
              </button>
            </form>

            <div className={`mt-auto p-6 rounded-[1.5rem] border transition-all duration-500 min-h-[80px] flex items-center gap-5 ${submitStatus.type === "success" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" :
              submitStatus.type === "error" ? "bg-rose-500/5 border-rose-500/20 text-rose-400" :
                submitStatus.type === "loading" ? "bg-blue-500/5 border-blue-500/20 text-blue-400" : "bg-slate-900 border-slate-800 text-slate-500 italic text-xs"
              }`}>
              {submitStatus.type === "idle" ? (
                <>Ready for Ingestion...</>
              ) : (
                <>
                  <div className="shrink-0 font-black text-xl">
                    {submitStatus.type === "success" ? "✓" : submitStatus.type === "error" ? "!" : "◈"}
                  </div>
                  <p className="text-sm font-bold leading-tight">{submitStatus.message}</p>
                </>
              )}
            </div>
          </div>

          {/* Monitoring Feed */}
          <div className="lg:col-span-7 flex flex-col gap-10 p-10 bg-slate-900/30 border border-slate-800/50 backdrop-blur-xl rounded-[1.5rem] shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Diagnostic Feed</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">{repositories.length} Active Modules</p>
              </div>
              <div className={`flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 ${isRefreshing ? "animate-pulse" : ""}`}>
                <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {repositories.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-700 space-y-6">
                  <div className="w-24 h-24 rounded-full border border-slate-800/50 flex items-center justify-center relative">
                    <svg className="w-10 h-10 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest opacity-50">Awaiting Ingestion Signal</p>
                </div>
              ) : (
                repositories.map((repo) => (
                  <div key={repo.id} className="flex flex-col gap-0 group">
                    <div className="p-6 rounded-t-[2rem] bg-black/40 border border-slate-800/50 hover:border-slate-600 transition-all duration-300 flex items-center justify-between gap-6">
                      <div className="flex-1 min-w-0 flex items-center gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-slate-800/50 flex items-center justify-center shrink-0 border border-slate-700/50 relative">
                          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          {repo.status === "completed" && (
                            <div className={`absolute -top-2 -right-2 h-7 w-7 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-slate-900 shadow-xl ${repo.overall_score >= 86 ? "bg-amber-500 text-black" :
                              repo.overall_score >= 66 ? "bg-emerald-500 text-black" :
                                repo.overall_score >= 41 ? "bg-blue-500 text-white" : "bg-rose-500 text-white"
                              }`}>
                              {repo.overall_score}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-mono text-[13px] text-white truncate font-bold">{repo.url.replace("https://", "")}</p>
                            {repo.analysis_results?.maturity_label && (
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${getMaturityColor(repo.analysis_results.maturity_label)}`}>
                                {repo.analysis_results.maturity_label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest text-blue-400">{repo.analysis_results?.static_scan?.stack?.[0] || 'Analyzing...'}</span>
                            <span className="h-1 w-1 bg-slate-800 rounded-full" />
                            <span className="text-[9px] text-slate-600 font-black">{new Date(repo.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${getStatusBadge(repo.status)}`}>
                          {repo.status}
                        </div>
                        {repo.status === "cloning" && (
                          <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-500 animate-loading-bar" />
                          </div>
                        )}
                      </div>
                    </div>

                    {repo.status === "completed" && repo.analysis_results && (
                      <div className="p-6 bg-slate-900/40 border-x border-b border-slate-800/50 rounded-b-[2rem] space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex flex-wrap gap-2">
                          {repo.analysis_results.static_scan.stack.map(s => (
                            <span key={s} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-slate-400 capitalize">{s}</span>
                          ))}
                          {repo.analysis_results.static_scan.standards.has_docker && <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400">Dockerized</span>}
                          {repo.analysis_results.static_scan.testing.detected && <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400">Tested</span>}
                        </div>

                        <div className="p-4 rounded-xl bg-black/40 border border-slate-800/50">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_blue]" />
                            Senior Architect Critique
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-slate-700 pl-4 py-1">
                            "{repo.analysis_results.architectural_critique}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s infinite linear;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}
