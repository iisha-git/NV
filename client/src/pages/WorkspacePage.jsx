import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "../store/useAuthStore";
import { useToast } from "../components/ToastContext";

const WorkspacePage = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Staged files metadata and actual File objects
  const [stagedFiles, setStagedFiles] = useState([]);
  const [rawFiles, setRawFiles] = useState([]);

  // Form input states
  const [caseTitle, setCaseTitle] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [category, setCategory] = useState("Criminal Appeal (Homicide)");
  const [counselNotes, setCounselNotes] = useState("");

  // Previously used form entries, stored in this browser only (never the PDFs).
  const HISTORY_KEY = "nv_workspace_history_v1";
  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const saveHistoryEntry = (entry) => {
    try {
      const next = [entry, ...history.filter(h =>
        !(h.caseTitle === entry.caseTitle && h.jurisdiction === entry.jurisdiction && h.category === entry.category)
      )].slice(0, 8);
      setHistory(next);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable (private mode) - remembering is optional, ignore
    }
  };

  const applyHistoryEntry = (idx) => {
    const h = history[idx];
    if (!h) return;
    setCaseTitle(h.caseTitle || "");
    setJurisdiction(h.jurisdiction || "");
    setCategory(h.category || "Criminal Appeal (Homicide)");
    setCounselNotes(h.counselNotes || "");
  };

  const clearHistory = () => {
    if (!window.confirm("Remove all saved form entries from this browser?")) return;
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
    setHistory([]);
  };

  // UI state for analysis pipeline
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState("");

  const removeFile = (id, name) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
    setRawFiles(prev => prev.filter(f => f.name !== name));
  };

  const runNeuralInsights = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(5);
    setAnalysisStep("Uploading your PDF briefs...");

    let currentProgress = 5;
    const progressInterval = setInterval(() => {
      if (currentProgress < 25) {
        currentProgress += 1;
        setAnalysisStep("Uploading your PDF briefs...");
      } else if (currentProgress < 50) {
        currentProgress += 1;
        setAnalysisStep("Reading and extracting text from the documents...");
      } else if (currentProgress < 75) {
        currentProgress += 1;
        setAnalysisStep("Searching for relevant laws and similar cases...");
      } else if (currentProgress < 95) {
        currentProgress += 0.5;
        setAnalysisStep("Putting together the case file...");
      }
      setAnalysisProgress(Math.floor(currentProgress));
    }, 150);

    const formData = new FormData();
    formData.append("case_title", caseTitle);
    formData.append("litigation_parties", caseTitle);
    formData.append("court_jurisdiction", jurisdiction);
    formData.append("case_classification", category);
    formData.append("category", category);
    formData.append("strategic_counselor_notes", counselNotes);

    for (const file of rawFiles) {
      formData.append("files", file);
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL || ""}/api/dossiers/compile`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setAnalysisStep("Analysis complete. Opening your dashboard...");

      saveHistoryEntry({ caseTitle, jurisdiction, category, counselNotes, usedAt: Date.now() });

      setTimeout(() => {
        setIsAnalyzing(false);
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      console.error("Compilation error:", error);
      showToast(`Case file compile failed: ${error.response?.data?.message || error.message}`, "error");
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (rawFiles.length === 0) {
      showToast("Please add at least one PDF before running the analysis.", "warning");
      return;
    }
    runNeuralInsights();
  };

  const inputCls =
    "w-full bg-zinc-950/60 border border-zinc-800 text-white text-sm p-3.5 rounded-lg focus:outline-none focus:border-[#C8A45D] focus:ring-1 focus:ring-[#C8A45D]/30 transition-all placeholder:text-zinc-500";
  const labelCls = "block text-sm text-zinc-300 font-medium mb-1.5";

  return (
    <div className="min-h-screen bg-[#070707] text-white relative font-sans">
      <div className="absolute top-0 left-1/3 w-[420px] h-[420px] bg-[#C8A45D]/[0.04] rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation */}
      <header className="max-w-3xl mx-auto flex items-center justify-between px-5 py-5 relative z-10">
        <Link to="/" className="flex items-center gap-2.5">
          <svg className="w-6 h-6 text-[#C8A45D]" viewBox="0 0 100 100" fill="none">
            <path d="M50 25V75M50 75H60M50 75H40" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M28 35C38 32 62 32 72 35" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="28" cy="35" r="3" fill="#000" stroke="currentColor" strokeWidth="3.5" />
            <circle cx="72" cy="35" r="3" fill="#000" stroke="currentColor" strokeWidth="3.5" />
            <circle cx="50" cy="25" r="3" fill="currentColor" />
          </svg>
          <span className="text-[#C8A45D] text-sm font-serif tracking-[0.25em] uppercase font-bold">NyayVivek</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/dashboard" className="px-3.5 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
            Dashboard
          </Link>
          <span className="px-3.5 py-2 rounded-lg bg-[#C8A45D]/10 text-[#C8A45D] font-medium">Workspace</span>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-1 px-3.5 py-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
          >
            Log out
          </button>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-5 pb-20 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-white">Analyze a new case</h1>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
            Tell us about the case, upload the brief as a PDF, and NyayVivek will extract the text,
            suggest relevant legal sections and find similar past cases.
          </p>
        </div>

        <form id="case-context-form" onSubmit={handleFormSubmit} className="flex flex-col gap-6">
          {/* Step 1 */}
          <section className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-7 rounded-full bg-[#C8A45D]/15 text-[#C8A45D] text-sm font-bold flex items-center justify-center">1</span>
              <h2 className="text-lg font-serif text-white">About the case</h2>
            </div>
            <div className="flex flex-col gap-5">
              {history.length > 0 && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label className="block text-sm text-zinc-300 font-medium">Use a previous entry</label>
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="text-xs text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Clear saved entries
                    </button>
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value !== "") applyHistoryEntry(Number(e.target.value));
                    }}
                    className="w-full bg-zinc-950/60 border border-zinc-800 text-white text-sm p-3 rounded-lg focus:outline-none focus:border-[#C8A45D] transition-all cursor-pointer appearance-none [&>option]:bg-zinc-950"
                  >
                    <option value="">Choose an entry you used before...</option>
                    {history.map((h, idx) => (
                      <option key={idx} value={idx}>
                        {h.caseTitle || "Untitled"}{h.jurisdiction ? ` - ${h.jurisdiction}` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-500 mt-2">
                    Saved in this browser only, after a completed analysis. Uploaded PDFs are never saved.
                  </p>
                </div>
              )}
              <div>
                <label className={labelCls}>Case title <span className="text-[#C8A45D]">*</span></label>
                <input
                  required
                  type="text"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="e.g. State of UP v. Ravindra & Ors"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Court / jurisdiction</label>
                  <input
                    type="text"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    placeholder="e.g. Supreme Court"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Case category</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-950/60 border border-zinc-800 text-white text-sm p-3.5 rounded-lg focus:outline-none focus:border-[#C8A45D] transition-all cursor-pointer appearance-none pr-10 [&>option]:bg-zinc-950"
                    >
                      <option value="Criminal Appeal (Homicide)">Criminal Appeal (Homicide)</option>
                      <option value="Civil Dispute (Property Rights)">Civil Dispute (Property Rights)</option>
                      <option value="Constitutional Bench (Jurisdictional Law)">Constitutional Bench (Jurisdictional Law)</option>
                      <option value="Corporate Compliance & Arbitration">Corporate Compliance & Arbitration</option>
                      <option value="Intellectual Property Infringement">Intellectual Property Infringement</option>
                    </select>
                    <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-zinc-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Notes for the analysis <span className="text-zinc-500 font-normal">(optional)</span></label>
                <textarea
                  rows={4}
                  value={counselNotes}
                  onChange={(e) => setCounselNotes(e.target.value)}
                  placeholder="Witness statements, timeline facts, or anything else the analysis should consider..."
                  className={inputCls + " leading-relaxed resize-none"}
                />
              </div>
            </div>
          </section>

          {/* Step 2 */}
          <section className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#C8A45D]/15 text-[#C8A45D] text-sm font-bold flex items-center justify-center">2</span>
                <h2 className="text-lg font-serif text-white">Upload the brief</h2>
              </div>
              <span className="text-sm text-zinc-500">
                <span className="text-[#C8A45D] font-semibold">{stagedFiles.length}</span> selected
              </span>
            </div>

            <div className="border-2 border-dashed border-zinc-800 rounded-xl bg-black/30 p-8 flex flex-col items-center justify-center text-center hover:border-[#C8A45D]/50 hover:bg-[#C8A45D]/[0.03] transition-all relative cursor-pointer">
              <div className="w-11 h-11 rounded-full bg-[#C8A45D]/10 flex items-center justify-center text-[#C8A45D] mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm text-white font-medium">Click to choose PDF files, or drag them here</p>
              <p className="text-zinc-500 text-xs mt-1.5">PDF only. You can add several files for one case.</p>
              <input
                type="file"
                multiple
                accept=".pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    const filesArray = Array.from(e.target.files);
                    const pdfFiles = filesArray.filter(f => f.name.toLowerCase().endsWith('.pdf'));
                    if (pdfFiles.length === 0) {
                      showToast("Only PDF documents can be uploaded.", "error");
                      return;
                    }
                    if (pdfFiles.length < filesArray.length) {
                      showToast("Some non-PDF files were skipped.", "warning");
                    }
                    setRawFiles(prev => [...pdfFiles, ...prev]);
                    setStagedFiles(prev => [
                      ...pdfFiles.map((file, idx) => ({ id: `upload-${Date.now()}-${idx}`, name: file.name })),
                      ...prev
                    ]);
                  }
                }}
              />
            </div>

            {stagedFiles.length > 0 && (
              <div className="mt-5 space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {stagedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-black/40 border border-zinc-900 px-4 py-3 rounded-lg gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <svg className="w-4 h-4 text-[#C8A45D] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <p className="text-sm text-zinc-200 truncate" title={file.name}>{file.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id, file.name)}
                      className="text-zinc-500 hover:text-red-400 text-xs px-2 py-1 rounded transition-colors cursor-pointer shrink-0"
                      title="Remove file"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <button
            type="submit"
            className="w-full bg-[#C8A45D] hover:bg-[#d6b570] text-black text-sm font-bold py-4 rounded-xl transition-all active:scale-[0.99] cursor-pointer shadow-[0_8px_30px_rgba(200,164,93,0.15)]"
          >
            Analyze this case
          </button>
          <p className="text-center text-xs text-zinc-600 -mt-3">
            The first analysis after a quiet period can take a few minutes while the engine warms up.
          </p>
        </form>
      </main>

      {/* Analysis loader */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-5">
          <div className="max-w-sm w-full p-8 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl text-center">
            <div className="relative w-16 h-16 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
              <div className="absolute inset-0 rounded-full border-2 border-t-[#C8A45D] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <svg className="w-7 h-7 text-[#C8A45D] absolute inset-0 m-auto" viewBox="0 0 100 100" fill="none">
                <path d="M50 25V75" stroke="currentColor" strokeWidth="4" />
                <path d="M30 35C40 33 60 33 70 35" stroke="currentColor" strokeWidth="4" />
                <circle cx="50" cy="45" r="3.5" fill="currentColor" />
              </svg>
            </div>
            <h3 className="text-lg font-serif text-white mb-2">Analyzing your case</h3>
            <p className="text-sm text-zinc-400 mb-6 min-h-[20px]">{analysisStep}</p>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C8A45D] transition-all duration-300 rounded-full"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-600 mt-3">Keep this tab open. Large documents can take a few minutes.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;
