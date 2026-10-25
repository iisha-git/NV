import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import useAuthStore from "../store/useAuthStore";
import { useToast } from "../components/ToastContext";
import { syntheticPreviewCase } from "../data/syntheticPreview";

const GOLD = "#C8A45D";

const DashboardPage = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { showToast } = useToast();

  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [completedActions, setCompletedActions] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Clearly-labeled synthetic preview mode (?preview=synthetic) for offline UI demonstration
  const isSyntheticPreview = new URLSearchParams(window.location.search).get("preview") === "synthetic";

  // Dynamic Case Retrieval from MongoDB exclusively (No fallback mock data)
  useEffect(() => {
    const fetchDossiers = async () => {
      if (isSyntheticPreview) {
        setCases([syntheticPreviewCase]);
        setSelectedCaseId(syntheticPreviewCase.id);
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || ""}/api/dossiers`, {
          withCredentials: true
        });
        if (response.data && response.data.success && response.data.dossiers && response.data.dossiers.length > 0) {
          const mappedCases = response.data.dossiers.map(d => ({
            id: d._id,
            case_title: d.case_title,
            filing_index: d.case_classification || "CRA/2026/8841-B",
            jurisdiction: d.court_jurisdiction || "Supreme Court of India (Appellate Jurisdiction)",
            date_logged: new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            type: d.category || "Criminal Appeal",
            brief_summary: d.strategic_counselor_notes
              ? `${(d.extracted_text || "").slice(0, 300)}...\n\nCounselor Notes: ${d.strategic_counselor_notes}`
              : d.extracted_text
                ? d.extracted_text.slice(0, 350) + "..."
                : "No case briefing summary logged.",
            predicted_sections: d.predicted_sections || [],
            legal_sections: d.legal_sections || [],
            similar_cases: d.similar_cases || [],
            evidence_mapping: d.evidence_mapping || [],
            missing_evidence: d.missing_evidence || [],
            recommended_actions: [
              ...(d.missing_evidence || []).map(item => `Secure missing evidentiary item: ${typeof item === 'object' && item !== null ? item.evidence : item}`),
              "Perform comprehensive timeline corroboration checks on digital forensics reports.",
              "Coordinate deposition timeline audits for primary eye-witnesses."
            ],
            analytics: d.analytics || { outcome_analytics: [], relief_analytics: [] },
            indexed_files: (d.uploaded_pdfs || []).map(file => ({
              id: typeof file === 'object' && file !== null ? file._id : `file-${Math.random()}`,
              name: typeof file === 'object' && file !== null ? file.originalName : file,
              fileName: typeof file === 'object' && file !== null ? file.fileName : file,
              size: typeof file === 'object' && file !== null ? file.fileSize : 0,
              uploadedAt: typeof file === 'object' && file !== null && file.uploadedAt
                ? new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : "N/A",
              status: "SECURE INDEX"
            }))
          }));
          setCases(mappedCases);
          setSelectedCaseId(mappedCases[0].id);
        } else {
          setCases([]);
          setSelectedCaseId("");
        }
      } catch (error) {
        console.error("Failed to query dossiers from MongoDB:", error);
        setCases([]);
        setSelectedCaseId("");
      } finally {
        setLoading(false);
      }
    };
    fetchDossiers();
  }, []);

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0] || {
    id: "",
    case_title: "No Active Case Compiled",
    filing_index: "N/A",
    jurisdiction: "N/A",
    date_logged: "N/A",
    type: "N/A",
    brief_summary: "No summaries available.",
    predicted_sections: [],
    legal_sections: [],
    similar_cases: [],
    evidence_mapping: [],
    missing_evidence: [],
    recommended_actions: [],
    analytics: { outcome_analytics: [], relief_analytics: [] },
    indexed_files: []
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDeleteCase = () => {
    if (!activeCase || !activeCase.id) return;
    if (isSyntheticPreview) {
      showToast("Synthetic preview - delete is disabled for fictional sample data.", "info");
      return;
    }
    setShowDeleteConfirm(true);
  };

  const executeDeleteCase = async () => {
    setShowDeleteConfirm(false);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || ""}/api/dossiers/${activeCase.id}`, {
        withCredentials: true
      });
      showToast("Case file and its uploaded documents were deleted.", "success");
      const updatedCases = cases.filter(c => c.id !== activeCase.id);
      setCases(updatedCases);
      if (updatedCases.length > 0) {
        setSelectedCaseId(updatedCases[0].id);
      } else {
        setSelectedCaseId("");
      }
    } catch (err) {
      console.error("Dossier delete error:", err);
      showToast(`Deletion failed: ${err.response?.data?.message || err.message}`, "error");
    }
  };

  const toggleAction = (idx) => {
    setCompletedActions((prev) => ({
      ...prev,
      [selectedCaseId + "-" + idx]: !prev[selectedCaseId + "-" + idx],
    }));
  };

  const tabs = [
    { id: "overview", name: "Overview" },
    { id: "legal_sections", name: "Legal Sections" },
    { id: "similar_cases", name: "Similar Cases" },
    { id: "evidence_mapping", name: "Trends" },
    { id: "missing_evidence", name: "Missing Evidence" },
    { id: "analytics", name: "Recommendations" },
  ];

  const scorePct = (s) => {
    const n = Number(s);
    return n > 1 ? n.toFixed(0) : (n * 100).toFixed(0);
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white relative font-sans">
      {isSyntheticPreview && (
        <div className="relative z-20 max-w-6xl mx-auto mt-4 border border-[#C8A45D]/40 bg-[#C8A45D]/10 text-[#C8A45D] text-xs tracking-wide px-5 py-3 rounded-xl">
          Synthetic preview - fictional sample data for UI demonstration while the backend is offline. Nothing shown is a real case or a real result.
        </div>
      )}
      <div className="absolute top-0 left-1/3 w-[420px] h-[420px] bg-[#C8A45D]/[0.04] rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation */}
      <header className="max-w-6xl mx-auto flex items-center justify-between px-5 py-5 relative z-10">
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
          <span className="px-3.5 py-2 rounded-lg bg-[#C8A45D]/10 text-[#C8A45D] font-medium">Dashboard</span>
          <Link to="/workspace" className="px-3.5 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
            Workspace
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-1 px-3.5 py-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
          >
            Log out
          </button>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-5 pb-20 relative z-10">
        {/* Page head + case picker */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div>
            <h1 className="text-3xl font-serif text-white">Your case files</h1>
            <p className="text-zinc-400 text-sm mt-2 max-w-xl leading-relaxed">
              Results from the briefs you uploaded: suggested legal sections, similar past cases and
              evidence checks. These are retrieval suggestions from a pilot dataset - review them before relying on them.
            </p>
          </div>
          {cases.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="bg-zinc-950/60 border border-zinc-800 text-white text-sm pl-4 pr-10 py-2.5 rounded-lg focus:outline-none focus:border-[#C8A45D] cursor-pointer appearance-none max-w-[260px] truncate [&>option]:bg-zinc-950"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>{c.case_title}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {selectedCaseId && (
                <button
                  onClick={handleDeleteCase}
                  title="Delete this case file"
                  className="p-2.5 rounded-lg border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/20 transition-all cursor-pointer"
                >
                  <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {cases.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center text-center py-20 border border-zinc-900 rounded-2xl bg-zinc-950/30">
            <div className="w-14 h-14 rounded-full bg-[#C8A45D]/10 flex items-center justify-center text-[#C8A45D] mb-5">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125.504 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif text-white mb-2">No case files yet</h2>
            <p className="text-zinc-400 text-sm max-w-sm leading-relaxed mb-7">
              Upload your first legal brief in the Workspace and the analysis will appear here.
            </p>
            <Link
              to="/workspace"
              className="bg-[#C8A45D] hover:bg-[#d6b570] text-black text-sm font-bold px-6 py-3 rounded-xl transition-all"
            >
              Analyze your first case
            </Link>
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 mb-6 -mx-5 px-5">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#C8A45D]/15 text-[#C8A45D] font-semibold"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                    }`}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + selectedCaseId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {/* OVERVIEW */}
                {activeTab === "overview" && (
                  <div className="flex flex-col gap-6">
                    <section className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-6 md:p-8">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <h2 className="text-2xl font-serif text-white mr-auto">{activeCase.case_title}</h2>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">
                          {isSyntheticPreview ? "SYNTHETIC SAMPLE" : "ANALYZED"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-zinc-400 mb-6">
                        <span><span className="text-zinc-600">Type:</span> {activeCase.type}</span>
                        <span><span className="text-zinc-600">Court:</span> {activeCase.jurisdiction}</span>
                        <span><span className="text-zinc-600">Logged:</span> {activeCase.date_logged}</span>
                      </div>
                      <div className="border-t border-zinc-900 pt-5">
                        <h3 className="text-sm font-semibold text-zinc-300 mb-2">Extracted brief text</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{activeCase.brief_summary}</p>
                      </div>
                    </section>

                    <section className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-6 md:p-8">
                      <h3 className="text-lg font-serif text-white mb-1">Uploaded documents</h3>
                      <p className="text-sm text-zinc-500 mb-5">{activeCase.indexed_files.length} file(s) stored with this case.</p>
                      <div className="flex flex-col gap-2.5">
                        {activeCase.indexed_files.map((file, idx) => {
                          const isRealFile = isSyntheticPreview ? true : (file.id && !file.id.startsWith('file-'));
                          const downloadUrl = isSyntheticPreview
                            ? `/samples/${file.name}`
                            : `${import.meta.env.VITE_API_URL || ""}/api/dossiers/${activeCase.id}/files/${file.id}`;
                          return (
                            <div key={idx} className="flex items-center justify-between gap-3 bg-black/40 border border-zinc-900 rounded-xl px-4 py-3.5">
                              <div className="flex items-center gap-3 min-w-0">
                                <svg className="w-4.5 h-4.5 w-[18px] h-[18px] text-[#C8A45D] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125.504 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                <div className="min-w-0">
                                  <p className="text-sm text-white truncate">{file.name}</p>
                                  <p className="text-xs text-zinc-500 mt-0.5">{file.size > 0 ? formatSize(file.size) : '0 KB'} · Uploaded {file.uploadedAt || 'N/A'}</p>
                                </div>
                              </div>
                              {isRealFile && (
                                <div className="flex items-center gap-2 shrink-0">
                                  <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
                                    className="text-xs font-medium text-[#C8A45D] border border-[#C8A45D]/30 hover:bg-[#C8A45D] hover:text-black px-3.5 py-1.5 rounded-lg transition-all">
                                    View
                                  </a>
                                  <a href={`${downloadUrl}?download=true`} download
                                    className="text-xs font-medium text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-600 px-3.5 py-1.5 rounded-lg transition-all">
                                    Download
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                )}

                {/* LEGAL SECTIONS */}
                {activeTab === "legal_sections" && (
                  <section className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-6 md:p-8">
                    <h2 className="text-2xl font-serif text-white mb-2">Suggested legal sections</h2>
                    <p className="text-sm text-zinc-400 mb-7 leading-relaxed">
                      Statutes and sections cited by the past cases the engine matched to this brief.
                      The bar shows how often each section appeared among those matches - it is not an accuracy score.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeCase.predicted_sections.map((sectionObj, idx) => {
                        const sectionStr = typeof sectionObj === 'object' && sectionObj !== null ? sectionObj.section : sectionObj;
                        const confidence = typeof sectionObj === 'object' && sectionObj !== null ? sectionObj.confidence : null;
                        return (
                          <div key={idx} className="bg-black/40 border border-zinc-900 rounded-xl p-5 hover:border-[#C8A45D]/30 transition-colors">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <h3 className="text-sm font-semibold text-white leading-snug">{sectionStr}</h3>
                              {confidence !== null && (
                                <span className="text-xs font-semibold text-[#C8A45D] shrink-0">{confidence}%</span>
                              )}
                            </div>
                            {confidence !== null && (
                              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                <div className="h-full bg-[#C8A45D] rounded-full" style={{ width: `${Math.min(confidence, 100)}%` }} />
                              </div>
                            )}
                            <p className="text-xs text-zinc-500 mt-2.5">
                              {isSyntheticPreview ? "Sample frequency among matched cases" : "Share of matched past cases citing this section"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* SIMILAR CASES */}
                {activeTab === "similar_cases" && (
                  <section className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-6 md:p-8">
                    <h2 className="text-2xl font-serif text-white mb-2">Similar past cases</h2>
                    <p className="text-sm text-zinc-400 mb-7 leading-relaxed">
                      Past case summaries from a pilot dataset, ranked by semantic similarity to your brief.
                      Matches are retrieval results to review, not predictions of outcome.
                    </p>
                    <div className="flex flex-col gap-4">
                      {activeCase.similar_cases.map((caseItem, idx) => (
                        <div key={idx} className="bg-black/40 border border-zinc-900 rounded-xl p-5 hover:border-[#C8A45D]/25 transition-colors">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                            <div className="min-w-0">
                              <h3 className="text-base font-serif text-white leading-snug">{caseItem.case_title}</h3>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {caseItem.case_type && (
                                  <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800">{caseItem.case_type}</span>
                                )}
                                {caseItem.sub_category && (
                                  <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">{caseItem.sub_category}</span>
                                )}
                                {caseItem.judgment_outcome && (
                                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">{caseItem.judgment_outcome}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xl font-serif text-[#C8A45D] font-bold">{scorePct(caseItem.similarity_score)}%</div>
                              <div className="text-[11px] text-zinc-500">similarity</div>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-[#C8A45D] rounded-full" style={{ width: `${Math.min(Number(scorePct(caseItem.similarity_score)), 100)}%` }} />
                          </div>
                          {caseItem.judge_observation && (
                            <p className="text-sm text-zinc-400 leading-relaxed">
                              <span className="text-zinc-500 font-medium">Court noted: </span>{caseItem.judge_observation}
                            </p>
                          )}
                          {caseItem.legal_sections && (
                            <p className="text-xs text-zinc-500 mt-2">
                              <span className="text-zinc-600">Sections cited: </span>{caseItem.legal_sections}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* TRENDS */}
                {activeTab === "evidence_mapping" && (() => {
                  const outcomeList = activeCase.analytics?.outcome_analytics || [];
                  const reliefList = activeCase.analytics?.relief_analytics || [];
                  const caseTypeString = activeCase.analytics?.case_type || activeCase.type || "N/A";
                  const Bar = ({ label, pct }) => (
                    <div className="mb-4">
                      <div className="flex items-center justify-between gap-4 mb-1.5">
                        <span className="text-sm text-zinc-300 leading-snug">{label}</span>
                        <span className="text-sm font-semibold text-[#C8A45D] shrink-0">{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-[#C8A45D]/80 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  );
                  return (
                    <section className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-6 md:p-8">
                      <h2 className="text-2xl font-serif text-white mb-2">Judgment pattern trends</h2>
                      <p className="text-sm text-zinc-400 mb-7 leading-relaxed">
                        How the matched past cases were decided. The engine classified this brief as
                        <span className="text-[#C8A45D] font-medium"> {caseTypeString}</span>.
                        These frequencies describe the matched set, not the likely outcome of this case.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-4">Outcomes in matched cases</h3>
                          {outcomeList.length === 0 && <p className="text-sm text-zinc-500">No outcome data for this case.</p>}
                          {outcomeList.map((item, idx) => (
                            <Bar key={idx} label={item.outcome} pct={item.percentage} />
                          ))}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-4">Relief granted in matched cases</h3>
                          {reliefList.length === 0 && <p className="text-sm text-zinc-500">No relief data for this case.</p>}
                          {reliefList.map((item, idx) => (
                            <Bar key={idx} label={item.relief} pct={item.percentage} />
                          ))}
                        </div>
                      </div>
                    </section>
                  );
                })()}

                {/* MISSING EVIDENCE */}
                {activeTab === "missing_evidence" && (
                  <section className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-6 md:p-8">
                    <h2 className="text-2xl font-serif text-white mb-2">Evidence gaps to check</h2>
                    <p className="text-sm text-zinc-400 mb-7 leading-relaxed">
                      Items the analysis expected for a case of this type but did not find in the uploaded brief.
                    </p>
                    <div className="flex flex-col gap-3">
                      {activeCase.missing_evidence.map((evidence, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-red-950/10 border border-red-900/25 rounded-xl px-5 py-4">
                          <div className="w-9 h-9 rounded-lg bg-red-950/40 flex items-center justify-center text-red-400 shrink-0">
                            <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                          </div>
                          <p className="text-sm text-zinc-200 leading-snug">
                            {typeof evidence === 'object' && evidence !== null ? evidence.evidence : evidence}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* RECOMMENDATIONS */}
                {activeTab === "analytics" && (
                  <section className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-6 md:p-8">
                    <h2 className="text-2xl font-serif text-white mb-2">Suggested next steps</h2>
                    <p className="text-sm text-zinc-400 mb-7 leading-relaxed">
                      A working checklist based on the gaps above. Tick items off as you complete them.
                    </p>
                    <div className="flex flex-col gap-3">
                      {activeCase.recommended_actions.map((action, idx) => {
                        const isDone = !!completedActions[selectedCaseId + "-" + idx];
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleAction(idx)}
                            className={`flex items-start gap-4 text-left border rounded-xl px-5 py-4 transition-all cursor-pointer ${
                              isDone
                                ? "bg-emerald-950/10 border-emerald-900/40"
                                : "bg-black/40 border-zinc-900 hover:border-zinc-700"
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                              isDone ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "border-zinc-700 text-transparent"
                            }`}>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            <span className={`text-sm leading-relaxed ${isDone ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
                              {action}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Footer actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-900 mt-8 pt-6">
              <button
                onClick={handleDeleteCase}
                className="text-sm text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                Delete this case file
              </button>
              <button
                onClick={() => navigate("/workspace")}
                className="bg-[#C8A45D] hover:bg-[#d6b570] text-black text-sm font-bold px-6 py-3 rounded-xl transition-all cursor-pointer"
              >
                Analyze another brief
              </button>
            </div>
          </>
        )}
      </main>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-7 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-serif text-white mb-2">Delete this case file?</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                "{activeCase.case_title}" and its uploaded documents will be permanently removed. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 text-sm text-zinc-300 border border-zinc-800 hover:border-zinc-600 py-2.5 rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteCase}
                  className="flex-1 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg transition-all cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;
