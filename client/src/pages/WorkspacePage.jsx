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

  // UI state for analysis pipeline
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState("");

  // Remove staged file
  const removeFile = (id, name) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
    setRawFiles(prev => prev.filter(f => f.name !== name));
  };

  // Real full-stack legal compile pipeline execution
  const runNeuralInsights = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(5);
    setAnalysisStep("1. Staging and Uploading PDF Briefs...");

    // Create a timer to crawl through visual steps smoothly while request is active
    let currentProgress = 5;
    const progressInterval = setInterval(() => {
      if (currentProgress < 20) {
        currentProgress += 1;
        setAnalysisStep("1. Staging and Uploading PDF Briefs...");
      } else if (currentProgress < 40) {
        currentProgress += 1;
        setAnalysisStep("2. In-Memory Parsing & Automated OCR Heuristics...");
      } else if (currentProgress < 60) {
        currentProgress += 1;
        setAnalysisStep("3. Running OCR on scanned briefs (English Tesseract)...");
      } else if (currentProgress < 80) {
        currentProgress += 1;
        setAnalysisStep("4. Synthesizing deep semantic FAISS case analysis...");
      } else if (currentProgress < 95) {
        currentProgress += 0.5;
        setAnalysisStep("5. Structuring & saving final litigation case file...");
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
      // Step 4 MERN axios trigger
      const response = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/dossiers/compile`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setAnalysisStep("5. Analysis complete. Syncing dashboard...");

      setTimeout(() => {
        setIsAnalyzing(false);
        // Force refresh / redirect to dashboard
        navigate("/dashboard");
      }, 1000);

    } catch (error) {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      console.error("Compilation error:", error);
      showToast(`Case file compile failed: ${error.response?.data?.message || error.message}`, "error");
    }
  };

  // Form submit handler
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (rawFiles.length === 0) {
      showToast("Please stage at least one case document before executing neural insights.", "warning");
      return;
    }
    runNeuralInsights();
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 relative overflow-hidden font-sans">
      
      {/* 1. Luxurious Radial Amber Backlight Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#C8A45D]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#C8A45D]/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Floating navigation header */}
      <header className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-3 pb-6 border-b border-zinc-900/60 mb-8 relative z-10">
        <Link to="/" className="flex items-center gap-3 group">
          <svg className="w-7 h-7 text-[#C8A45D] transition-transform group-hover:scale-105" viewBox="0 0 100 100" fill="none">
            <path d="M50 25V75M50 75H60M50 75H40" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M28 35C38 32 62 32 72 35" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="28" cy="35" r="3" fill="#000" stroke="currentColor" strokeWidth="3.5" />
            <circle cx="72" cy="35" r="3" fill="#000" stroke="currentColor" strokeWidth="3.5" />
            <circle cx="50" cy="25" r="3" fill="currentColor" />
          </svg>
          <span className="text-[#C8A45D] text-xs font-serif tracking-[0.35em] uppercase font-bold">
            NYAYVIVEK 
          </span>
        </Link>
        
        <div className="flex items-center gap-3 md:gap-6 flex-wrap">
          <nav className="flex items-center gap-4 md:gap-5 bg-zinc-950/50 border border-zinc-900 px-3 md:px-6 py-2.5 rounded-full backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <Link 
              to="/dashboard" 
              className="text-xs font-mono tracking-widest text-zinc-400 hover:text-white hover:scale-105 transition-all uppercase"
            >
              DASHBOARD
            </Link>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            <Link 
              to="/workspace" 
              className="text-xs font-mono tracking-widest text-[#C8A45D] font-semibold hover:scale-105 transition-all uppercase"
            >
              WORKSPACE
            </Link>
          </nav>
          
          <button 
            type="button"
            onClick={handleLogout}
            className="text-xs font-mono tracking-widest text-zinc-400 hover:text-red-400 border border-zinc-900 hover:border-red-950/40 hover:bg-red-950/15 px-5 py-2.5 rounded-full transition-all uppercase cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]"
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* Setup Wizard Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 pb-16">

        {/* STEP 1: Describe Case Context (Left Card) */}
        <section className="bg-gradient-to-b from-[#0b0b0b] to-[#040404] border border-[#C8A45D]/10 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-[0_15px_35px_rgba(0,0,0,0.9)] hover:border-[#C8A45D]/25 transition-all duration-500">
          
          <span className="block text-[10px] font-mono tracking-[0.3em] text-[#C8A45D] uppercase font-semibold mb-2">
            STEP 1 OF 2
          </span>
          <h1 className="text-3xl font-serif text-white tracking-tight mb-8">
            Describe Case Context
          </h1>

          <form id="case-context-form" onSubmit={handleFormSubmit} className="flex flex-col gap-6">
            
            {/* Case Title */}
            <div className="flex flex-col gap-1.5">
              <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Case Title / Litigation Parties
              </label>
              <input
                required
                type="text" 
                value={caseTitle}
                onChange={(e) => setCaseTitle(e.target.value)}
                placeholder="e.g. State of UP v. Ravindra & Ors"
                className="w-full bg-black border border-zinc-900 text-white text-xs font-sans p-4 rounded focus:outline-none focus:border-[#C8A45D] focus:ring-1 focus:ring-[#C8A45D]/20 transition-all placeholder:text-zinc-400 font-light"
              />
            </div>

            {/* Court Jurisdiction */}
            <div className="flex flex-col gap-1.5">
              <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Court Jurisdiction
              </label>
              <input
                type="text"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="e.g. Supreme Court"
                className="w-full bg-black border border-zinc-900 text-white text-xs font-sans p-4 rounded focus:outline-none focus:border-[#C8A45D] focus:ring-1 focus:ring-[#C8A45D]/20 transition-all placeholder:text-zinc-400 font-light"
              />
            </div>

            {/* Case Classification Category Dropdown */}
            <div className="flex flex-col gap-1.5 relative">
              <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Case Category
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black border border-[#C8A45D]/40 text-[#C8A45D] text-xs font-sans p-4 rounded focus:outline-none focus:border-[#C8A45D] focus:ring-1 focus:ring-[#C8A45D]/20 transition-all cursor-pointer appearance-none font-medium pr-10 [&>option]:bg-zinc-950 [&>option]:text-white"
                >
                  <option value="Criminal Appeal (Homicide)">Criminal Appeal (Homicide)</option>
                  <option value="Civil Dispute (Property Rights)">Civil Dispute (Property Rights)</option>
                  <option value="Constitutional Bench (Jurisdictional Law)">Constitutional Bench (Jurisdictional Law)</option>
                  <option value="Corporate Compliance & Arbitration">Corporate Compliance & Arbitration</option>
                  <option value="Intellectual Property Infringement">Intellectual Property Infringement</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#C8A45D]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Strategic Notes Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="block text-[9px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Case Notes (Optional)
              </label>
              <textarea
                rows={5}
                value={counselNotes}
                onChange={(e) => setCounselNotes(e.target.value)}
                placeholder="Provide additional details such as witness statements, timeline facts, or general notes to include in the case analysis..."
                className="w-full bg-black border border-zinc-900 text-white text-xs font-sans p-4 rounded focus:outline-none focus:border-[#C8A45D] focus:ring-1 focus:ring-[#C8A45D]/20 transition-all placeholder:text-zinc-400 font-light leading-relaxed resize-none"
              />
            </div>

          </form>
        </section>

        {/* STEP 2: File Repository Uploads (Right Card) */}
        <section className="bg-gradient-to-b from-[#0b0b0b] to-[#040404] border border-[#C8A45D]/10 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-[0_15px_35px_rgba(0,0,0,0.9)] hover:border-[#C8A45D]/25 transition-all duration-500 flex flex-col justify-between">
          
          <div>
            {/* Header with counter */}
            <div className="flex justify-between items-baseline mb-8">
              <div>
                <span className="block text-[10px] font-mono tracking-[0.3em] text-[#C8A45D] uppercase font-semibold mb-2">
                  STEP 2 OF 2
                </span>
                <h2 className="text-3xl font-serif text-white tracking-tight">
                  Upload Case Documents
                </h2>
              </div>
              <span className="text-xs font-mono text-zinc-400 tracking-wider">
                <span className="text-[#C8A45D] font-bold">{stagedFiles.length}</span> file(s) selected
              </span>
            </div>

            {/* Dotted Upload Dropzone */}
            <div className="border border-dashed border-zinc-800 rounded-xl bg-black/40 p-10 flex flex-col items-center justify-center text-center group hover:border-[#C8A45D]/40 hover:bg-[#C8A45D]/5 transition-all duration-300 relative cursor-pointer">
              <div className="w-12 h-12 rounded-full border border-[#C8A45D]/30 flex items-center justify-center text-[#C8A45D] transition-colors duration-300 mb-4 bg-zinc-950/50 group-hover:border-[#C8A45D]/80 group-hover:bg-[#C8A45D]/10">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm font-serif text-white mb-1">
                Drag PDF documents here to upload
              </p>
              <p className="text-zinc-500 text-[11px] leading-relaxed max-w-xs">
                Supports standard PDF briefs. Upload multiple PDFs to run the AI analysis.
              </p>
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
                      showToast("Only standard PDF documents can be uploaded.", "error");
                      return;
                    }

                    if (pdfFiles.length < filesArray.length) {
                      showToast("Some non-PDF files were skipped. Only standard PDF documents can be uploaded.", "warning");
                    }

                    setRawFiles(prev => [...pdfFiles, ...prev]);
                    setStagedFiles(prev => [
                      ...pdfFiles.map((file, idx) => ({
                        id: `upload-${Date.now()}-${idx}`,
                        name: file.name
                      })),
                      ...prev
                    ]);
                  }
                }} 
              />
            </div>

            {/* Category selection selector */}


            {/* Staging Document list queue */}
            <div className="mt-8 space-y-2.5 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {stagedFiles.length === 0 ? (
                <p className="text-zinc-500 text-xs font-light text-center py-6 font-mono">
                  No files staged. Drag and drop or browse files to begin.
                </p>
              ) : (
                stagedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-black/60 border border-zinc-900/60 p-4 rounded-xl hover:border-zinc-800 transition-all group duration-300 min-w-0 gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-[#C8A45D] border border-zinc-900 shrink-0">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-white font-medium font-sans truncate" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="border border-[#C8A45D]/30 bg-[#C8A45D]/5 text-[9px] font-mono uppercase text-[#C8A45D] font-semibold px-2.5 py-1 rounded flex items-center gap-1.5 shadow-[0_2px_8px_rgba(200,164,93,0.05)] select-none">
                        <svg className="w-3 h-3 text-[#C8A45D] stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        READY
                      </div>
                      
                      {/* Delete button */}
                      <button
                        onClick={() => removeFile(file.id, file.name)}
                        className="text-zinc-400 hover:text-red-400 p-1.5 transition-colors cursor-pointer rounded hover:bg-red-500/10"
                        title="Remove file"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <button
            type="submit"
            form="case-context-form"
            className="mt-8 w-full border border-[#C8A45D]/30 bg-black text-[11px] font-mono text-[#C8A45D] hover:text-black hover:border-[#C8A45D] py-4 hover:bg-[#C8A45D] tracking-widest font-bold uppercase rounded transition-all duration-300 active:scale-[0.98] shadow-[0_0_20px_rgba(200,164,93,0.1)] hover:shadow-[0_0_35px_rgba(200,164,93,0.35)] cursor-pointer flex items-center justify-center gap-2"
          >
            COMPILE & ANALYZE CASE FILE
          </button>
        </section>

      </main>

      {/* 5. Stunning Cinematic Neural Synthesis Loader Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#C8A45D]/10 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" />
          
          <div className="max-w-md w-full p-8 rounded-2xl border border-[#C8A45D]/20 bg-zinc-950/60 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.9)] text-center">
            
            {/* Spinning Gold Vectors */}
            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-zinc-900" />
              <div className="absolute inset-0 rounded-full border-2 border-t-[#C8A45D] border-r-transparent border-b-[#C8A45D]/20 border-l-transparent animate-spin" />
              <svg className="w-8 h-8 text-[#C8A45D] relative animate-pulse-slow" viewBox="0 0 100 100" fill="none">
                <path d="M50 25V75" stroke="currentColor" strokeWidth="4" />
                <path d="M30 35C40 33 60 33 70 35" stroke="currentColor" strokeWidth="4" />
                <circle cx="50" cy="45" r="3.5" fill="currentColor" />
              </svg>
            </div>

            <h3 className="text-lg font-serif text-white mb-2 tracking-wide">
              Synthesizing Evidence Case File
            </h3>
            
            {/* Live Progress State msg */}
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#C8A45D] mb-6 h-6 animate-pulse">
              {analysisStep}
            </p>

            {/* Glowing progress bar */}
            <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
              <div 
                className="h-full bg-gradient-to-r from-[#DFBA73] to-[#C8A45D] transition-all duration-300 shadow-[0_0_10px_#C8A45D]"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-3 text-[10px] font-mono text-zinc-400">
              <span>NYAYVIVEK // CORE ENGINE</span>
              <span className="text-[#C8A45D] font-bold">{analysisProgress}%</span>
            </div>

          </div>
        </div>
      )}



    </div>
  );
};

export default WorkspacePage;
