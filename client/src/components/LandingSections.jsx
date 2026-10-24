import React from "react";

const steps = [
  {
    num: "01",
    title: "Upload the case file",
    desc: "Stage up to ten PDF briefs for one matter. Scanned pages are read automatically with OCR, so older physical records work too.",
  },
  {
    num: "02",
    title: "Semantic analysis",
    desc: "The combined brief is converted into sentence embeddings and compared against a pilot dataset of past case summaries using FAISS similarity search.",
  },
  {
    num: "03",
    title: "Review the dossier",
    desc: "One case file brings together similar cases, applicable sections, evidence mapping, missing evidence and outcome patterns - each traceable to the dataset rows behind it.",
  },
];

const features = [
  {
    title: "Similar Case Retrieval",
    desc: "The five closest past cases by meaning, each shown with its similarity score, cited sections and recorded outcome.",
  },
  {
    title: "Applicable Legal Sections",
    desc: "Statutes cited by the most similar cases, ranked by how frequently they appear across them.",
  },
  {
    title: "Evidence-Law Mapping",
    desc: "Which evidence types supported which legal sections across the matching matters.",
  },
  {
    title: "Missing Evidence Detection",
    desc: "Evidence that similar cases usually include but the uploaded brief does not mention - a checklist for counsel.",
  },
  {
    title: "Judgment Pattern Analytics",
    desc: "How outcomes and interim reliefs were distributed across the matching cases, shown as plain percentages.",
  },
];

const LandingSections = ({ onGetStarted, onPreviewDemo }) => {
  return (
    <div className="relative z-10 bg-black text-white">

      {/* ============ HOW IT WORKS ============ */}
      <section id="indexing" className="relative border-t border-zinc-900/80">
        <div className="absolute top-0 left-1/3 w-[420px] h-[420px] bg-[#C8A45D]/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-8 md:px-20 py-24 md:py-32 relative">
          <span className="block text-[10px] font-mono tracking-[0.35em] text-[#C8A45D] uppercase font-semibold mb-4">
            How it works
          </span>
          <h2 className="font-serif text-3xl md:text-5xl tracking-tighter leading-[1.08] max-w-2xl">
            From a stack of briefs to
            <span className="text-[#C8A45D]"> one clear case file</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            {steps.map((step) => (
              <div
                key={step.num}
                className="group bg-gradient-to-b from-[#0b0b0b] to-[#050505] border border-zinc-900 rounded-2xl p-8 hover:border-[#C8A45D]/30 transition-all duration-500"
              >
                <span className="font-serif text-4xl text-[#C8A45D]/40 group-hover:text-[#C8A45D]/70 transition-colors duration-500">
                  {step.num}
                </span>
                <h3 className="font-serif text-xl mt-5 mb-3 tracking-tight">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed font-light">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHAT THE ANALYSIS SHOWS ============ */}
      <section id="synthesis" className="relative border-t border-zinc-900/80">
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] bg-[#C8A45D]/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-8 md:px-20 py-24 md:py-32 relative">
          <span className="block text-[10px] font-mono tracking-[0.35em] text-[#C8A45D] uppercase font-semibold mb-4">
            The analysis
          </span>
          <h2 className="font-serif text-3xl md:text-5xl tracking-tighter leading-[1.08] max-w-2xl">
            What one upload
            <span className="text-[#C8A45D]"> shows you</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-gradient-to-b from-[#0b0b0b] to-[#050505] border border-zinc-900 rounded-2xl p-8 hover:border-[#C8A45D]/30 transition-all duration-500"
              >
                <div className="w-9 h-9 rounded-full border border-[#C8A45D]/30 flex items-center justify-center mb-5 group-hover:border-[#C8A45D]/70 group-hover:bg-[#C8A45D]/10 transition-all duration-500">
                  <svg className="w-4 h-4 text-[#C8A45D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <h3 className="font-serif text-lg mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed font-light">{feature.desc}</p>
              </div>
            ))}

            {/* Honest scope card */}
            <div className="border border-[#C8A45D]/25 bg-[#C8A45D]/[0.04] rounded-2xl p-8">
              <div className="w-9 h-9 rounded-full border border-[#C8A45D]/40 flex items-center justify-center mb-5">
                <svg className="w-4 h-4 text-[#C8A45D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className="font-serif text-lg mb-3 tracking-tight text-[#C8A45D]">Said honestly</h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light">
                A research prototype, not legal advice. Results are similarity matches from a pilot
                dataset of about one hundred case summaries - a starting point for a lawyer's
                review, never a prediction of what a real court will decide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA + FOOTER ============ */}
      <section className="relative border-t border-zinc-900/80">
        <div className="max-w-7xl mx-auto px-8 md:px-20 py-24 md:py-28 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[300px] bg-[#C8A45D]/[0.07] rounded-full blur-[130px] pointer-events-none" />
          <h2 className="font-serif text-3xl md:text-5xl tracking-tighter leading-[1.08] relative">
            Read a case the way
            <br />
            <span className="text-[#C8A45D]">the evidence reads it</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-12 relative">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 rounded-full bg-[#C8A45D] text-black font-semibold text-xs uppercase tracking-[0.25em] transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(200,164,93,0.45)] cursor-pointer"
            >
              Get Started
            </button>
            <button
              onClick={onPreviewDemo}
              className="px-8 py-4 rounded-full border border-[#C8A45D]/40 text-[#C8A45D] backdrop-blur-md bg-[#C8A45D]/5 text-xs uppercase tracking-[0.25em] font-semibold transition-all duration-500 hover:scale-[1.03] cursor-pointer"
            >
              Preview Demo
            </button>
          </div>
        </div>

        <footer className="border-t border-zinc-900/80">
          <div className="max-w-7xl mx-auto px-8 md:px-20 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[#C8A45D] text-[11px] font-mono tracking-[0.35em] uppercase font-semibold">
              NyayVivek
            </span>
            <p className="text-zinc-600 text-[10px] font-mono tracking-widest uppercase text-center">
              AI-assisted legal research prototype - academic demonstration only - not legal advice
            </p>
          </div>
        </footer>
      </section>
    </div>
  );
};

export default LandingSections;
